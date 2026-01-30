import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "supervisor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get team agents
    const agents = await sql`
      SELECT id, name FROM users WHERE supervisor_id = ${user.id} AND role = 'agent'
    `;

    // Get calls with evaluations
    const calls = await sql`
      SELECT 
        c.id,
        c.agent_id,
        u.name as agent_name,
        c.customer_phone,
        c.duration_seconds,
        c.call_type,
        c.status,
        c.created_at,
        e.total_score,
        e.category_scores,
        e.strengths,
        e.improvements,
        t.content as transcript_content
      FROM calls c
      JOIN users u ON c.agent_id = u.id
      LEFT JOIN evaluations e ON e.call_id = c.id
      LEFT JOIN transcripts t ON t.call_id = c.id
      WHERE u.supervisor_id = ${user.id}
      ORDER BY c.created_at DESC
      LIMIT 100
    `;

    const formattedCalls = calls.map((call) => ({
      id: call.id,
      agent_id: call.agent_id,
      agent_name: call.agent_name,
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
          }
        : null,
      transcript: call.transcript_content
        ? { content: call.transcript_content }
        : null,
    }));

    return NextResponse.json({ calls: formattedCalls, agents });
  } catch (error) {
    console.error("Error fetching supervisor calls:", error);
    return NextResponse.json({ calls: [], agents: [] });
  }
}
