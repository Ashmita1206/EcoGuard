import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let alerts = [];

    try {
      // Try a generic select first — some DB schemas may differ, so use SELECT * and
      // filter in JS when necessary to avoid column-not-found errors.
      const rows = await sql`SELECT * FROM alerts ORDER BY created_at DESC LIMIT 100`;
      alerts = Array.isArray(rows) ? rows : [];

      if (user.role !== "admin") {
        alerts = alerts.filter((a: any) => {
          // handle different column naming conventions
          return a.user_id === user.id || a.userId === user.id || a.user === user.id;
        });
      }
    } catch (dbErr) {
      console.error('/api/notifications DB error', dbErr);
      // don't throw — return an empty list so client doesn't hit a 500
      alerts = [];
    }

    return NextResponse.json({ notifications: alerts });
  } catch (err) {
    console.error("/api/notifications error", err);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}
