"use client";

import { useAuth } from "@/hooks/use-auth";
import useSWR from "swr";
import { StatsCard } from "@/components/stats-card";
import { ScoreBadge } from "@/components/score-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Clock, TrendingUp, Lightbulb, ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { loggingFetcher } from "@/lib/fetcher";

export function AgentDashboardContent() {
  const { user } = useAuth();
  const { data: statsRaw, isLoading } = useSWR(user ? `/api/agent/stats` : null, loggingFetcher);
  const stats = statsRaw || ({} as any);

  // render

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s your performance overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Today's Calls"
          value={stats.todayCalls ?? 0}
          description="completed"
          icon={Phone}
        />
        <StatsCard
          title="Avg Handle Time"
          value={`${Math.floor((stats.avgHandleTime ?? 0) / 60)}m ${(stats.avgHandleTime ?? 0) % 60}s`}
          trend={{ value: stats.handleTimeTrend ?? 0, label: "vs last week" }}
          icon={Clock}
        />
        <StatsCard
          title="Quality Score"
          value={stats.avgScore ?? 0}
          trend={{ value: stats.scoreTrend ?? 0, label: "vs last week" }}
          icon={TrendingUp}
        />
        <StatsCard
          title="Coaching Tips"
          value={stats.pendingCoaching ?? 0}
          description="new insights"
          icon={Lightbulb}
        />
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Score Trend Chart */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">
              Score Trend (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.scoreTrendData || []}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.55 0.15 250)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="oklch(0.55 0.15 250)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.03 250)" />
                  <XAxis
                    dataKey="date"
                    stroke="oklch(0.65 0 0)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke="oklch(0.65 0 0)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(0.16 0.025 250)",
                      border: "1px solid oklch(0.28 0.03 250)",
                      borderRadius: "8px",
                      color: "oklch(0.98 0 0)",
                    }}
                  />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="oklch(0.55 0.15 250)"
                      strokeWidth={2}
                      fill="url(#scoreGradient)"
                    />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Evaluations */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-card-foreground">
              Recent Evaluations
            </CardTitle>
            <Link href="/agent/calls">
              <Button variant="ghost" size="sm" className="gap-1">
                View all
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentEvaluations?.length > 0 ? (
                stats.recentEvaluations.map((evaluation: {
                  id: string;
                  created_at: string;
                  total_score: number;
                  strengths: string[];
                }) => (
                  <div
                    key={evaluation.id}
                    className="flex items-center justify-between rounded-lg bg-secondary/50 p-4"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-card-foreground">
                        Call Evaluation
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(evaluation.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <ScoreBadge score={evaluation.total_score} />
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No evaluations yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coaching Insights Preview */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-card-foreground">
            Latest Coaching Insights
          </CardTitle>
          <Link href="/agent/coaching">
            <Button variant="ghost" size="sm" className="gap-1">
              View all
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stats.recentInsights?.length > 0 ? (
              stats.recentInsights.map((insight: {
                id: string;
                insight_type: string;
                title: string;
                description: string;
                priority: string;
              }) => (
                <div
                  key={insight.id}
                  className="rounded-lg border border-border bg-secondary/30 p-4 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        insight.insight_type === "strength"
                          ? "bg-success"
                          : insight.insight_type === "improvement"
                          ? "bg-warning"
                          : "bg-primary"
                      }`}
                    />
                    <span className="text-xs font-medium text-muted-foreground uppercase">
                      {insight.insight_type}
                    </span>
                  </div>
                  <h4 className="font-medium text-card-foreground">
                    {insight.title}
                  </h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {insight.description}
                  </p>
                </div>
              ))
            ) : (
              <p className="col-span-full text-center text-sm text-muted-foreground py-8">
                No coaching insights yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Debug JSON removed */}
    </div>
  );
}
