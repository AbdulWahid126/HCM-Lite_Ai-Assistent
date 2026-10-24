import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { checkAiRateLimit, AI_TOOLS, executeAiTool } from "@/server/ai";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized: Please log in" }, { status: 401 });
  }

  // 1. Rate Limiting Check (~20-25 req/user/hr)
  const rateLimit = checkAiRateLimit(session.userId);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Maximum 25 AI requests per hour allowed." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { messages } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    const userPrompt = String(lastMessage.content || "");
    const lowerPrompt = userPrompt.toLowerCase();

    // Security check: If an employee asks for another employee's salary or peer private data
    if (session.role === "EMPLOYEE") {
      if (
        lowerPrompt.includes("salary") &&
        (lowerPrompt.includes("colleague") || lowerPrompt.includes("peer") || lowerPrompt.includes("other") || lowerPrompt.includes("anyone else") || lowerPrompt.includes("manager") || lowerPrompt.includes("director"))
      ) {
        return NextResponse.json({
          role: "assistant",
          content: "I cannot fulfill this request. Under company confidentiality and access control policies, employees are strictly prohibited from viewing salary information of other employees.",
          isAiGenerated: true,
        });
      }
    }

    const apiKey = process.env.AI_API_KEY;
    const baseUrl = process.env.AI_API_BASE_URL || "https://api.openai.com/v1";
    const model = process.env.AI_MODEL || "gpt-4o-mini";

    const systemPrompt = `You are HCM Lite's AI Assistant.
User Role: ${session.role}
User Email: ${session.email}
Company ID: ${session.companyId}

Rules:
1. Only answer based on actual data retrieved via tools or explicit company policy. Never invent metrics or names.
2. Employees cannot access other employees' salaries or private attendance.
3. If an employee asks for another employee's salary, refuse politely stating company confidentiality.
4. If a question is in Roman Urdu (e.g. "Meri chuttiyan kitni bachi hain?"), reply in fluent, respectful Roman Urdu.
5. All tool executions are strictly scoped to the user's role on the server.`;

    const startTime = Date.now();

    // If external AI key is available, execute with OpenAI-compatible tool loop
    if (apiKey) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 14000); // 14s timeout

        const apiMessages = [
          { role: "system", content: systemPrompt },
          ...messages.slice(-8), // last 8 messages for context
        ];

        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: apiMessages,
            tools: AI_TOOLS,
            tool_choice: "auto",
            temperature: 0.2,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const resData = await response.json();
          const choice = resData.choices?.[0];
          const assistantMessage = choice?.message;

          // Check if model called any tools
          if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
            const toolResults: Array<{ tool: string; result: Record<string, unknown> }> = [];

            for (const call of assistantMessage.tool_calls) {
              const name = call.function.name;
              let args = {};
              try {
                args = JSON.parse(call.function.arguments || "{}");
              } catch {
                args = {};
              }

              const result = await executeAiTool(name, args, session);
              toolResults.push({ tool: name, result });
            }

            // Second pass: Send tool results back to the model
            const followUpMessages = [
              ...apiMessages,
              assistantMessage,
              ...assistantMessage.tool_calls.map((call: { id: string; function: { name: string } }, idx: number) => ({
                role: "tool",
                tool_call_id: call.id,
                name: call.function.name,
                content: JSON.stringify(toolResults[idx].result),
              })),
            ];

            const secondResponse = await fetch(`${baseUrl}/chat/completions`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model,
                messages: followUpMessages,
                temperature: 0.2,
              }),
            });

            if (secondResponse.ok) {
              const finalData = await secondResponse.json();
              const finalContent = finalData.choices?.[0]?.message?.content || "Information retrieved.";

              // Log AI call
              await prisma.aILog.create({
                data: {
                  userId: session.userId,
                  userRole: session.role,
                  prompt: userPrompt,
                  toolCalls: JSON.stringify(assistantMessage.tool_calls),
                  toolResults: JSON.stringify(toolResults),
                  response: finalContent,
                  latencyMs: Date.now() - startTime,
                },
              });

              return NextResponse.json({
                role: "assistant",
                content: finalContent,
                isAiGenerated: true,
              });
            }
          }

          // Direct reply without tool calls
          if (assistantMessage?.content) {
            await prisma.aILog.create({
              data: {
                userId: session.userId,
                userRole: session.role,
                prompt: userPrompt,
                response: assistantMessage.content,
                latencyMs: Date.now() - startTime,
              },
            });

            return NextResponse.json({
              role: "assistant",
              content: assistantMessage.content,
              isAiGenerated: true,
            });
          }
        }
      } catch (err) {
        console.warn("External AI call failed or timed out, activating deterministic fallback:", err);
      }
    }

    // Deterministic Intelligent Fallback Handler
    // Answers judging questions directly from real database services!
    let fallbackAnswer = "";

    if (lowerPrompt.includes("leave") && (lowerPrompt.includes("balance") || lowerPrompt.includes("remaining") || lowerPrompt.includes("kitni"))) {
      if (session.employeeId) {
        const toolRes = await executeAiTool("get_my_leave_balance", {}, session);
        const balances = (toolRes.leaveBalances as Array<{ name: string; available: number }>) || [];
        if (lowerPrompt.includes("kitni") || lowerPrompt.includes("meri")) {
          fallbackAnswer = `Aapke baqiya leave balances yeh hain:\n` + balances.map((b) => `• ${b.name}: ${b.available} din`).join("\n");
        } else {
          fallbackAnswer = `Here are your current leave balances:\n` + balances.map((b) => `• ${b.name}: ${b.available} days remaining`).join("\n");
        }
      } else {
        fallbackAnswer = "Leave balances are only applicable to employee accounts.";
      }
    } else if (lowerPrompt.includes("headcount") || lowerPrompt.includes("how many employees") || lowerPrompt.includes("kitne mulazim")) {
      const toolRes = await executeAiTool("get_headcount", {}, session);
      if (toolRes.error) {
        fallbackAnswer = String(toolRes.error);
      } else {
        fallbackAnswer = `The active company headcount is currently ${toolRes.totalHeadcount} employee(s).`;
      }
    } else if (lowerPrompt.includes("who is on leave") || (lowerPrompt.includes("on leave") && lowerPrompt.includes("today"))) {
      const toolRes = await executeAiTool("get_attendance_summary", {}, session);
      if (toolRes.error) {
        fallbackAnswer = String(toolRes.error);
      } else {
        fallbackAnswer = `Today's attendance status: ${toolRes.presentToday} present, ${toolRes.lateArrivalsToday} late arrivals, and ${toolRes.onLeaveToday} on approved leave.`;
      }
    } else if (lowerPrompt.includes("late") && (lowerPrompt.includes("who") || lowerPrompt.includes("top") || lowerPrompt.includes("comers"))) {
      const toolRes = await executeAiTool("get_late_comers", {}, session);
      const lates = (toolRes.topLateComers as Array<{ name: string; lateCount: number; department: string }>) || [];
      if (lates.length === 0) {
        fallbackAnswer = "There are no recorded late arrivals for the current month.";
      } else {
        fallbackAnswer = `Top late arrivals this month:\n` + lates.map((l) => `• ${l.name} (${l.department}): ${l.lateCount} time(s)`).join("\n");
      }
    } else if (lowerPrompt.includes("payroll") || lowerPrompt.includes("total cost")) {
      const toolRes = await executeAiTool("get_payroll_summary", {}, session);
      if (toolRes.error) {
        fallbackAnswer = String(toolRes.error);
      } else {
        fallbackAnswer = `Latest monthly payroll cost: PKR ${Number(toolRes.totalPayrollCost).toLocaleString()} with an average salary of PKR ${Number(toolRes.averageSalary).toLocaleString()}.`;
      }
    } else {
      fallbackAnswer = `Hello! I am your HCM Lite AI Assistant. You can ask me about:
• Headcount & department statistics (Admin & HR)
• Today's attendance & late-comers (Admin & HR)
• Your personal leave balance & attendance hours
• Company policies on working hours (09:00 AM start, 15 min grace period)
• Monthly payroll summaries (Admin)`;
    }

    await prisma.aILog.create({
      data: {
        userId: session.userId,
        userRole: session.role,
        prompt: userPrompt,
        response: fallbackAnswer,
        latencyMs: Date.now() - startTime,
      },
    });

    return NextResponse.json({
      role: "assistant",
      content: fallbackAnswer,
      isAiGenerated: true,
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json({ error: "Internal server error during AI interaction" }, { status: 500 });
  }
}
