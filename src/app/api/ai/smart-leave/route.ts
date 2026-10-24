import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { extractSmartLeave } from "@/server/ai/smart-leave";
import { checkAiRateLimit } from "@/server/ai";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimit = checkAiRateLimit(session.userId);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again in a little while." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const prompt = String(body.prompt || "").trim();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const extraction = await extractSmartLeave(prompt, session.companyId);

    return NextResponse.json({
      success: true,
      extraction,
      notice: "Please review and confirm your leave details before submitting. AI cannot submit requests automatically.",
    });
  } catch (error) {
    console.error("Smart leave extraction error:", error);
    return NextResponse.json({ error: "Failed to extract leave details" }, { status: 500 });
  }
}
