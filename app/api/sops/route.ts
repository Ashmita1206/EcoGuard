import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sops = await sql`
      SELECT id, title, content, category, created_at, updated_at
      FROM sops
      ORDER BY category, title
    `;

    // Get unique categories
    const categoriesResult = await sql`
      SELECT DISTINCT category FROM sops ORDER BY category
    `;
    const categories = categoriesResult.map((row) => row.category);

    return NextResponse.json({ success: true, data: { sops, categories } });
    } catch (error) {
    console.error("Error fetching SOPs:", error);
    // Failure-safe: return empty shape with 200 so frontend can render empty-state
    return NextResponse.json({ success: true, data: { sops: [], categories: [] } });
  }
}
