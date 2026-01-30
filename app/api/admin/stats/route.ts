import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    // Total users
    const usersResult = await sql`SELECT COUNT(*) as count FROM users`;

    // Today's calls
    const todayCallsResult = await sql`
      SELECT COUNT(*) as count FROM calls WHERE created_at >= ${today.toISOString()}
    `;

    // Yesterday's calls
    const yesterdayCallsResult = await sql`
      SELECT COUNT(*) as count FROM calls 
      WHERE created_at >= ${yesterday.toISOString()} AND created_at < ${today.toISOString()}
    `;

    // Org average score this week
    const orgScoreResult = await sql`
      SELECT COALESCE(AVG(total_score), 0) as avg_score FROM evaluations 
      WHERE created_at >= ${weekAgo.toISOString()}
    `;

    // Org average score last week
    const prevOrgScoreResult = await sql`
      SELECT COALESCE(AVG(total_score), 0) as avg_score FROM evaluations 
      WHERE created_at >= ${twoWeeksAgo.toISOString()} AND created_at < ${weekAgo.toISOString()}
    `;

    // Critical alerts (be resilient to schemas without read_at)
    const alertsResult = await sql`
      SELECT COUNT(*) as count FROM alerts WHERE severity = 'critical'
    `;

    // Score trend data
    const scoreTrendData = await sql`
      SELECT DATE(created_at) as date, COALESCE(AVG(total_score), 0) as score
      FROM evaluations
      WHERE created_at >= ${weekAgo.toISOString()}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    // Score distribution
    const scoreDistribution = await sql`
      SELECT 
        CASE 
          WHEN total_score >= 90 THEN 'Excellent'
          WHEN total_score >= 75 THEN 'Good'
          WHEN total_score >= 60 THEN 'Fair'
          ELSE 'Needs Work'
        END as name,
        COUNT(*) as value
      FROM evaluations
      WHERE created_at >= ${weekAgo.toISOString()}
      GROUP BY 
        CASE 
          WHEN total_score >= 90 THEN 'Excellent'
          WHEN total_score >= 75 THEN 'Good'
          WHEN total_score >= 60 THEN 'Fair'
          ELSE 'Needs Work'
        END
    `;

    // Supervisor performance (group by supervisor instead of team)
    const supervisorPerformance = await sql`
      SELECT 
        s.id as supervisor_id,
        s.name as supervisor_name,
        COUNT(DISTINCT u.id) as agent_count,
        COALESCE(AVG(e.total_score), 0) as avg_score,
        COUNT(DISTINCT c.id) as total_calls
      FROM users s
      LEFT JOIN users u ON u.supervisor_id = s.id AND u.role = 'agent'
      LEFT JOIN calls c ON c.agent_id = u.id AND c.created_at >= ${weekAgo.toISOString()}
      LEFT JOIN evaluations e ON e.call_id = c.id AND e.created_at >= ${weekAgo.toISOString()}
      WHERE s.role = 'supervisor'
      GROUP BY s.id, s.name
    `;

    const todayCalls = Number(todayCallsResult[0]?.count) || 0;
    const yesterdayCalls = Number(yesterdayCallsResult[0]?.count) || 0;
    const callsTrend = yesterdayCalls > 0 
      ? Math.round(((todayCalls - yesterdayCalls) / yesterdayCalls) * 100) 
      : 0;

    const currentOrgScore = Number(orgScoreResult[0]?.avg_score) || 0;
    const prevOrgScore = Number(prevOrgScoreResult[0]?.avg_score) || 0;
    const scoreTrend = prevOrgScore > 0 
      ? Math.round(((currentOrgScore - prevOrgScore) / prevOrgScore) * 100) 
      : 0;

    // Format trend data
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const formattedTrendData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dayName = days[date.getDay()];
      const existingData = scoreTrendData.find(
        (d) => new Date(d.date).toLocaleDateString("en-US", { weekday: "short" }) === dayName
      );
      formattedTrendData.push({
        date: dayName,
        score: existingData ? Math.round(Number(existingData.score)) : currentOrgScore || 75,
      });
    }

    return NextResponse.json({
      totalUsers: Number(usersResult[0]?.count) || 0,
      totalCallsToday: todayCalls,
      callsTrend,
      orgAvgScore: Math.round(currentOrgScore) || 0,
      scoreTrend,
      criticalAlerts: Number(alertsResult[0]?.count) || 0,
      scoreTrendData: formattedTrendData,
      scoreDistribution: scoreDistribution.map((d) => ({
        name: d.name,
        value: Number(d.value),
      })),
      supervisorPerformance: supervisorPerformance.map((s) => ({
        supervisor_id: s.supervisor_id,
        supervisor_name: s.supervisor_name,
        agent_count: Number(s.agent_count),
        avg_score: Math.round(Number(s.avg_score)),
        total_calls: Number(s.total_calls),
      })),
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json({
      totalUsers: 0,
      totalCallsToday: 0,
      callsTrend: 0,
      orgAvgScore: 0,
      scoreTrend: 0,
      criticalAlerts: 0,
      scoreTrendData: [],
      scoreDistribution: [],
      supervisorPerformance: [],
    });
  }
}
