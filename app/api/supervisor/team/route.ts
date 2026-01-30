import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "supervisor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

    // Get detailed agent information (robust to DB/schema issues)
    try {
      // Get detailed agent information
      const agents = await sql`
        SELECT 
          u.id,
          u.name,
          u.email,
          u.avatar_url,
          COUNT(DISTINCT c.id) as total_calls,
          COALESCE(AVG(e.total_score), 0) as avg_score,
          COALESCE(AVG(c.duration_seconds), 0) as avg_handle_time
        FROM users u
        LEFT JOIN calls c ON c.agent_id = u.id AND c.created_at >= ${weekAgo}
        LEFT JOIN evaluations e ON e.call_id = c.id AND e.created_at >= ${weekAgo}
        WHERE u.supervisor_id = ${user.id} AND u.role = 'agent'
        GROUP BY u.id, u.name, u.email, u.avatar_url
        ORDER BY avg_score DESC
      `;

      // Get previous week scores for trend calculation
      const prevScores = await sql`
        SELECT 
          c.agent_id,
          COALESCE(AVG(e.total_score), 0) as avg_score
        FROM calls c
        LEFT JOIN evaluations e ON e.call_id = c.id AND e.created_at >= ${twoWeeksAgo}
        WHERE c.agent_id IN (SELECT id FROM users WHERE supervisor_id = ${user.id} AND role = 'agent')
        AND c.created_at >= ${twoWeeksAgo}
        AND c.created_at < ${weekAgo}
        GROUP BY c.agent_id
      `;

      const prevScoreMap = new Map(prevScores.map((s) => [s.agent_id, Number(s.avg_score)]));

      // Get category scores for each agent
      const categoryScores = await sql`
        SELECT 
          c.agent_id,
          e.category_scores
        FROM calls c
        LEFT JOIN evaluations e ON e.call_id = c.id
        WHERE c.agent_id IN (SELECT id FROM users WHERE supervisor_id = ${user.id} AND role = 'agent')
        AND e.created_at >= ${weekAgo}
      `;

      // Aggregate category scores per agent
      const categoryScoreMap = new Map<number, Record<string, number[]>>();
      for (const row of categoryScores) {
        const scores = row.category_scores as Record<string, number>;
        if (!scores) continue;

        if (!categoryScoreMap.has(row.agent_id)) {
          categoryScoreMap.set(row.agent_id, {});
        }

        const agentScores = categoryScoreMap.get(row.agent_id)!;
        for (const [category, score] of Object.entries(scores)) {
          if (!agentScores[category]) {
            agentScores[category] = [];
          }
          agentScores[category].push(score);
        }
      }

      // Calculate average category scores
      const avgCategoryScores = new Map<number, Record<string, number>>();
      for (const [agentId, categories] of categoryScoreMap.entries()) {
        const avgScores: Record<string, number> = {};
        for (const [category, scores] of Object.entries(categories)) {
          avgScores[category] = Math.round(
            scores.reduce((a, b) => a + b, 0) / scores.length
          );
        }
        avgCategoryScores.set(agentId, avgScores);
      }

      const formattedAgents = agents.map((agent) => {
        const currentScore = Math.round(Number(agent.avg_score));
        const prevScore = prevScoreMap.get(agent.id) || currentScore;
        const trend = prevScore > 0 
          ? Math.round(((currentScore - prevScore) / prevScore) * 100) 
          : 0;

        return {
          id: agent.id,
          name: agent.name,
          email: agent.email,
          avatar_url: agent.avatar_url,
          total_calls: Number(agent.total_calls),
          avg_score: currentScore,
          avg_handle_time: Math.round(Number(agent.avg_handle_time)),
          category_scores: avgCategoryScores.get(agent.id) || {},
          trend,
        };
      });

      return NextResponse.json({ agents: formattedAgents });
    } catch (e) {
      console.error('Error fetching team data (robust):', e);
      return NextResponse.json({ agents: [] });
    }
  } catch (error) {
    console.error("Error fetching team data:", error);
    return NextResponse.json({ agents: [] });
  }
}
