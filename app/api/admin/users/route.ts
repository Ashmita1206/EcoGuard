import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await sql`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        s.name as supervisor_name,
        u.created_at
      FROM users u
      LEFT JOIN users s ON u.supervisor_id = s.id
      ORDER BY u.created_at DESC
    `;

    return NextResponse.json({ success: true, data: { users } });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: true, data: { users: [] } },
      { status: 200 }
    );
  }
}
