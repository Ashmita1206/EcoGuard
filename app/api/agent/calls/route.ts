import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get calls with evaluations and transcripts
    const calls = await sql`
      SELECT 
        c.id,
        c.customer_phone,
        c.duration_seconds,
        c.call_type,
        c.status,
        c.created_at,
        e.total_score,
        e.category_scores,
        e.strengths,
        e.improvements,
        e.sop_violations,
        t.content as transcript_content
      FROM calls c
      LEFT JOIN evaluations e ON e.call_id = c.id
      LEFT JOIN transcripts t ON t.call_id = c.id
      WHERE c.agent_id = ${user.id}
      ORDER BY c.created_at DESC
      LIMIT 100
    `;

    const formattedCalls = calls.map((call) => ({
      id: call.id,
      customer_phone: call.customer_phone,
      duration_seconds: call.duration_seconds,
      call_type: call.call_type,
      status: call.status,
      created_at: call.created_at,
      evaluation: call.total_score
        ? {
            total_score: call.total_score,
            category_scores: call.category_scores,
            strengths: call.strengths,
            improvements: call.improvements,
            sop_violations: call.sop_violations,
          }
        : null,
      transcript: call.transcript_content
        ? { content: call.transcript_content }
        : null,
    }));

    return NextResponse.json({ calls: formattedCalls });
  } catch (error) {
    console.error("Error fetching calls:", error);
    return NextResponse.json({ calls: [] });
  }
}
