import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "supervisor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get evaluations for agents under this supervisor (join through calls)
    let formattedEvaluations: any[] = [];
    try {
      const evaluations = await sql`
        SELECT 
          e.id,
          c.agent_id,
          u.name as agent_name,
          e.call_id,
          e.total_score,
          e.category_scores,
          e.strengths,
          e.improvements,
          e.sop_violations,
          e.auto_generated,
          e.reviewed_by,
          e.created_at
        FROM evaluations e
        JOIN calls c ON e.call_id = c.id
        JOIN users u ON c.agent_id = u.id
        WHERE u.supervisor_id = ${user.id}
        ORDER BY e.created_at DESC
        LIMIT 50
      `;

      formattedEvaluations = evaluations.map((e) => ({
        id: e.id,
        agent_id: e.agent_id,
        agent_name: e.agent_name,
        call_id: e.call_id,
        total_score: e.total_score,
        category_scores: e.category_scores,
        strengths: e.strengths,
        improvements: e.improvements,
        sop_violations: e.sop_violations,
        auto_generated: e.auto_generated,
        reviewed_by: e.reviewed_by,
        created_at: e.created_at,
      }));
    } catch (e) {
      console.error('Error fetching supervisor evaluations (robust):', e);
      formattedEvaluations = [];
    }

    return NextResponse.json({ evaluations: formattedEvaluations });
  } catch (error) {
    console.error("Error fetching evaluations:", error);
    return NextResponse.json({ evaluations: [] });
  }
}
