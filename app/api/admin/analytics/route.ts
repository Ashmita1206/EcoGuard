import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "7d";

    const days = range === "30d" ? 30 : range === "90d" ? 90 : 7;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Call volume by day
    const callVolume = await sql`
      SELECT DATE(created_at) as date, COUNT(*) as calls
      FROM calls
      WHERE created_at >= ${startDate.toISOString()}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    // Score trend
    const scoreTrend = await sql`
      SELECT 
        DATE(created_at) as date,
        AVG(total_score) as avgScore,
        MIN(total_score) as minScore,
        MAX(total_score) as maxScore
      FROM evaluations
      WHERE created_at >= ${startDate.toISOString()}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    // Category performance
    const categoryPerformance = await sql`
      SELECT 
        key as category,
        AVG((category_scores->>key)::numeric) as score
      FROM evaluations,
      LATERAL jsonb_object_keys(category_scores) as key
      WHERE created_at >= ${startDate.toISOString()}
      GROUP BY key
      ORDER BY score DESC
    `;

    // Supervisor comparison (instead of team comparison)
    const supervisorComparison = await sql`
      SELECT 
        COALESCE(s.name, 'No Supervisor') as supervisor,
        AVG(e.total_score) as avgScore,
        COUNT(c.id) / 10.0 as callCount
      FROM users u
      LEFT JOIN users s ON u.supervisor_id = s.id
      LEFT JOIN calls c ON c.agent_id = u.id AND c.created_at >= ${startDate.toISOString()}
      LEFT JOIN evaluations e ON e.call_id = c.id AND e.created_at >= ${startDate.toISOString()}
      WHERE u.role = 'agent'
      GROUP BY s.name
    `;

    // Summary stats
    const summaryResult = await sql`
      SELECT 
        (SELECT COUNT(*) FROM calls WHERE created_at >= ${startDate.toISOString()}) as total_calls,
        (SELECT COUNT(*) FROM evaluations WHERE created_at >= ${startDate.toISOString()}) as total_evaluations,
        (SELECT AVG(total_score) FROM evaluations WHERE created_at >= ${startDate.toISOString()}) as avg_score,
        (SELECT COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM evaluations WHERE created_at >= ${startDate.toISOString()}), 0) 
         FROM evaluations WHERE total_score >= 90 AND created_at >= ${startDate.toISOString()}) as excellent_rate,
        (SELECT COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM evaluations WHERE created_at >= ${startDate.toISOString()}), 0) 
         FROM evaluations WHERE total_score < 60 AND created_at >= ${startDate.toISOString()}) as improvement_rate
    `;

    return NextResponse.json({
      success: true,
      data: {
        callVolume: callVolume.map((d) => ({
          date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          calls: Number(d.calls),
        })),
        scoreTrend: scoreTrend.map((d) => ({
          date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          avgScore: Math.round(Number(d.avgscore)),
          minScore: Math.round(Number(d.minscore)),
          maxScore: Math.round(Number(d.maxscore)),
        })),
        categoryPerformance: categoryPerformance.map((c) => ({
          category: c.category.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
          score: Math.round(Number(c.score)),
        })),
        teamComparison: supervisorComparison.map((s) => ({
          team: s.supervisor,
          avgScore: Math.round(Number(s.avgscore) || 0),
          callCount: Math.round(Number(s.callcount) || 0),
        })),
        summary: {
          totalCalls: Number(summaryResult[0]?.total_calls) || 0,
          totalEvaluations: Number(summaryResult[0]?.total_evaluations) || 0,
          avgScore: Math.round(Number(summaryResult[0]?.avg_score) || 0),
          excellentRate: Math.round(Number(summaryResult[0]?.excellent_rate) || 0),
          improvementRate: Math.round(Number(summaryResult[0]?.improvement_rate) || 0),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { success: true, data: { callVolume: [], scoreTrend: [], categoryPerformance: [], teamComparison: [], summary: { totalCalls: 0, totalEvaluations: 0, avgScore: 0, excellentRate: 0, improvementRate: 0 } } },
      { status: 500 }
    );
  }
}
