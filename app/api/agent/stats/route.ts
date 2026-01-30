import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's calls count
    const todayCallsResult = await sql`
      SELECT COUNT(*) as count
      FROM calls
      WHERE agent_id = ${user.id}
      AND created_at >= ${today.toISOString()}
    `;

    // Get average handle time
    const handleTimeResult = await sql`
      SELECT AVG(duration_seconds) as avg_duration
      FROM calls
      WHERE agent_id = ${user.id}
      AND created_at >= ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}
    `;

    // Get average score (join through calls to get agent)
    const scoreResult = await sql`
      SELECT AVG(e.total_score) as avg_score
      FROM evaluations e
      JOIN calls c ON e.call_id = c.id
      WHERE c.agent_id = ${user.id}
      AND e.created_at >= ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}
    `;

    // Get previous week's average score for trend
    const prevScoreResult = await sql`
      SELECT AVG(e.total_score) as avg_score
      FROM evaluations e
      JOIN calls c ON e.call_id = c.id
      WHERE c.agent_id = ${user.id}
      AND e.created_at >= ${new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()}
      AND e.created_at < ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}
    `;

    // Get pending coaching insights
    const coachingResult = await sql`
      SELECT COUNT(*) as count
      FROM coaching_insights
      WHERE agent_id = ${user.id}
      AND acknowledged_at IS NULL
    `;

    // Get recent evaluations (join through calls)
    const recentEvaluations = await sql`
      SELECT e.id, e.total_score, e.strengths, e.created_at
      FROM evaluations e
      JOIN calls c ON e.call_id = c.id
      WHERE c.agent_id = ${user.id}
      ORDER BY e.created_at DESC
      LIMIT 5
    `;

    // Get recent insights
    const recentInsights = await sql`
      SELECT id, insight_type, title, description, priority
      FROM coaching_insights
      WHERE agent_id = ${user.id}
      ORDER BY created_at DESC
      LIMIT 6
    `;

    // Get score trend data for last 7 days (join through calls)
    const scoreTrendData = await sql`
      SELECT 
        DATE(e.created_at) as date,
        AVG(e.total_score) as score
      FROM evaluations e
      JOIN calls c ON e.call_id = c.id
      WHERE c.agent_id = ${user.id}
      AND e.created_at >= ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}
      GROUP BY DATE(e.created_at)
      ORDER BY date ASC
    `;

    const currentAvgScore = Number(scoreResult[0]?.avg_score) || 0;
    const prevAvgScore = Number(prevScoreResult[0]?.avg_score) || 0;
    const scoreTrend = prevAvgScore > 0 
      ? Math.round(((currentAvgScore - prevAvgScore) / prevAvgScore) * 100) 
      : 0;

    // Format trend data
    const formattedTrendData = scoreTrendData.map((row) => ({
      date: new Date(row.date).toLocaleDateString("en-US", { weekday: "short" }),
      score: Math.round(Number(row.score)),
    }));

    // Fill in missing days
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const filledTrendData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dayName = days[date.getDay()];
      const existingData = formattedTrendData.find((d) => d.date === dayName);
      filledTrendData.push(existingData || { date: dayName, score: currentAvgScore || 75 });
    }

    return NextResponse.json({
      todayCalls: Number(todayCallsResult[0]?.count) || 0,
      avgHandleTime: Math.round(Number(handleTimeResult[0]?.avg_duration) || 0),
      handleTimeTrend: -2,
      avgScore: Math.round(currentAvgScore) || 0,
      scoreTrend,
      pendingCoaching: Number(coachingResult[0]?.count) || 0,
      recentEvaluations,
      recentInsights,
      scoreTrendData: filledTrendData,
    });
  } catch (error) {
    console.error("Error fetching agent stats:", error);
    return NextResponse.json({
      todayCalls: 0,
      avgHandleTime: 0,
      handleTimeTrend: 0,
      avgScore: 0,
      scoreTrend: 0,
      pendingCoaching: 0,
      recentEvaluations: [],
      recentInsights: [],
      scoreTrendData: [],
    });
  }
}
