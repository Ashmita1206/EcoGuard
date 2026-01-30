import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const calls = await sql`
      SELECT 
        c.id,
        c.agent_id,
        u.name as agent_name,
        s.name as supervisor_name,
        c.customer_phone,
        c.duration_seconds,
        c.call_type,
        c.status,
        c.created_at,
        e.total_score
      FROM calls c
      JOIN users u ON c.agent_id = u.id
      LEFT JOIN users s ON u.supervisor_id = s.id
      LEFT JOIN evaluations e ON e.call_id = c.id
      ORDER BY c.created_at DESC
      LIMIT 200
    `;

    return NextResponse.json({ calls });
  } catch (error) {
    console.error("Error fetching calls:", error);
    return NextResponse.json({ calls: [] });
  }
}
