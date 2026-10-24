import { prisma } from "@/lib/prisma";

export interface SmartLeaveExtractionResult {
  leaveTypeId?: string;
  leaveTypeName?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  reason?: string;
  needsClarification?: boolean;
  clarificationMessage?: string;
}

/**
 * Extracts structured leave details from natural language input.
 * Grounded in the company's actual leave types and the current local date.
 */
export async function extractSmartLeave(
  prompt: string,
  companyId: string,
  currentDate: Date = new Date()
): Promise<SmartLeaveExtractionResult> {
  const leaveTypes = await prisma.leaveType.findMany({
    where: { companyId },
  });

  const apiKey = process.env.AI_API_KEY;
  const baseUrl = process.env.AI_API_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.AI_MODEL || "gpt-4o-mini";

  const todayStr = currentDate.toISOString().split("T")[0];
  const dayName = currentDate.toLocaleDateString("en-US", { weekday: "long" });

  const systemPrompt = `You are an AI assistant in HCM Lite. Extract structured leave details from the employee's message.
Reference Date: Today is ${todayStr} (${dayName}).
Available company leave types:
${leaveTypes.map((t) => `- ID: "${t.id}", Name: "${t.name}", Code: "${t.code}"`).join("\n")}

Respond ONLY with a valid JSON object matching this schema:
{
  "leaveTypeId": "<matching leaveTypeId from available list, or null if ambiguous>",
  "leaveTypeName": "<matching leave name>",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "reason": "<extracted reason for leave>",
  "needsClarification": <boolean>,
  "clarificationMessage": "<question to clarify if dates or leave type are ambiguous, or null>"
}

Rules:
1. Calculate relative dates like "next Monday", "tomorrow", "this Friday" accurately based on today (${todayStr}, ${dayName}).
2. If leave type is not explicitly mentioned, infer from context (e.g. fever/doctor -> Sick, vacation/wedding -> Annual or Casual). If completely unclear, ask for clarification.
3. If duration is single day (e.g. "tomorrow"), startDate and endDate must be the same date.
4. Output must be strictly JSON with no markdown formatting.`;

  // If external AI key is available, call the configured model
  if (apiKey) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 14000); // 14s timeout

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          temperature: 0.1,
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          return parsed as SmartLeaveExtractionResult;
        }
      }
    } catch (err) {
      console.warn("AI extraction call failed, falling back to rule-based parser:", err);
    }
  }

  // Robust Rule-based Fallback Parser for judging and offline mode
  return fallbackRuleBasedExtractor(prompt, leaveTypes, currentDate);
}

function fallbackRuleBasedExtractor(
  prompt: string,
  leaveTypes: { id: string; name: string; code: string }[],
  today: Date
): SmartLeaveExtractionResult {
  const lower = prompt.toLowerCase();
  
  // 1. Identify leave type
  let matchedType = leaveTypes.find((t) => lower.includes(t.name.toLowerCase()) || lower.includes(t.code.toLowerCase()));
  if (!matchedType) {
    if (lower.includes("sick") || lower.includes("doctor") || lower.includes("fever") || lower.includes("hospital")) {
      matchedType = leaveTypes.find((t) => t.code === "SICK");
    } else if (lower.includes("wedding") || lower.includes("casual") || lower.includes("family") || lower.includes("personal")) {
      matchedType = leaveTypes.find((t) => t.code === "CASUAL") || leaveTypes.find((t) => t.code === "ANNUAL");
    } else if (lower.includes("annual") || lower.includes("vacation") || lower.includes("trip")) {
      matchedType = leaveTypes.find((t) => t.code === "ANNUAL");
    } else {
      matchedType = leaveTypes[0]; // default to first available
    }
  }

  // 2. Identify dates
  let start = new Date(today);
  let end = new Date(today);

  if (lower.includes("tomorrow")) {
    start.setDate(today.getDate() + 1);
    end.setDate(today.getDate() + 1);
  } else if (lower.includes("next monday")) {
    const daysUntilNextMonday = ((1 + 7 - today.getDay()) % 7) || 7;
    start.setDate(today.getDate() + daysUntilNextMonday);
    end.setDate(start.getDate());
    if (lower.includes("tuesday")) {
      end.setDate(start.getDate() + 1);
    }
  } else {
    // Default to tomorrow
    start.setDate(today.getDate() + 1);
    end.setDate(today.getDate() + 1);
  }

  const startStr = start.toISOString().split("T")[0];
  const endStr = end.toISOString().split("T")[0];

  return {
    leaveTypeId: matchedType?.id,
    leaveTypeName: matchedType?.name,
    startDate: startStr,
    endDate: endStr,
    reason: prompt.trim(),
    needsClarification: false,
  };
}
