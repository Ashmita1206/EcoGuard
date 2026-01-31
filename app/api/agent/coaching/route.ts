import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const insights = await sql`
      SELECT id, insight_type, title, description, priority, acknowledged_at, created_at
      FROM coaching_insights
      WHERE agent_id = ${user.id}
      ORDER BY 
        CASE WHEN acknowledged_at IS NULL THEN 0 ELSE 1 END,
        CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
        created_at DESC
    `;

    return NextResponse.json({ success: true, data: { insights } });
  } catch (error) {
    console.error("Error fetching coaching insights:", error);
    return NextResponse.json(
      { success: true, data: { insights: [] } },
      { status: 200 }
    );
  }
}
