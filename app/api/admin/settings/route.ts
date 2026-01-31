import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get active scoring config
    const scoringConfig = await sql`
      SELECT * FROM scoring_config WHERE is_active = true LIMIT 1
    `;

    return NextResponse.json({
      success: true,
      data: {
        scoringConfig: scoringConfig[0] || null,
      },
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { success: true, data: { scoringConfig: null } },
      { status: 200 }
    );
  }
}
