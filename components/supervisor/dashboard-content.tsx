"use client";

import { useAuth } from "@/hooks/use-auth";
import useSWR from "swr";
import { StatsCard } from "@/components/stats-card";
import { ScoreBadge } from "@/components/score-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Phone, TrendingUp, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

import { loggingFetcher } from "@/lib/fetcher";

interface AgentPerformance {
  id: string;
  name: string;
  avatar_url: string | null;
  total_calls: number;
  avg_score: number;
  trend: number;
}

interface Alert {
  id: string;
  alert_type: string;
  title: string;
  message: string;
  severity: string;
  created_at: string;
}

export function SupervisorDashboardContent() {
  const { user } = useAuth();
  const { data: statsRaw, isLoading } = useSWR(user ? "/api/supervisor/stats" : null, loggingFetcher);
  const stats = statsRaw || ({} as any);

  const getScoreColor = (score: number) => {
    if (score >= 90) return "oklch(0.65 0.18 145)";
    if (score >= 75) return "oklch(0.55 0.15 250)";
    if (score >= 60) return "oklch(0.75 0.15 85)";
    return "oklch(0.55 0.2 25)";
  };

  // render

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Team Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor your team&apos;s performance and quality metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Team Members"
          value={stats.teamSize ?? 0}
          description="active agents"
          icon={Users}
        />
        <StatsCard
          title="Today's Calls"
          value={stats.todayCalls ?? 0}
          trend={{ value: stats.callsTrend ?? 0, label: "vs yesterday" }}
          icon={Phone}
        />
        <StatsCard
          title="Team Avg Score"
          value={stats.teamAvgScore ?? 0}
          trend={{ value: stats.scoreTrend ?? 0, label: "vs last week" }}
          icon={TrendingUp}
        />
        <StatsCard
          title="Alerts"
          value={stats.pendingAlerts ?? 0}
          description="require attention"
          icon={AlertTriangle}
        />
      </div>

      {/* Charts and Team Performance */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Team Performance Chart */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-card-foreground">
              Agent Performance
            </CardTitle>
            <Link href="/supervisor/team">
              <Button variant="ghost" size="sm" className="gap-1">
                View all
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.agentPerformance || []} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(0.28 0.03 250)"
                    horizontal={true}
                    vertical={false}
                  />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    stroke="oklch(0.65 0 0)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="oklch(0.65 0 0)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(0.16 0.025 250)",
                      border: "1px solid oklch(0.28 0.03 250)",
                      borderRadius: "8px",
                      color: "oklch(0.98 0 0)",
                    }}
                  />
                  <Bar dataKey="avg_score" radius={[0, 4, 4, 0]}>
                    {stats.agentPerformance?.map((entry: AgentPerformance) => (
                      <Cell key={entry.id} fill={getScoreColor(entry.avg_score)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-card-foreground">Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentAlerts?.length > 0 ? (
                stats.recentAlerts.map((alert: Alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-3 rounded-lg p-4 ${
                      alert.severity === "critical"
                        ? "bg-destructive/10 border border-destructive/20"
                        : alert.severity === "warning"
                        ? "bg-warning/10 border border-warning/20"
                        : "bg-secondary/50"
                    }`}
                  >
                    <AlertTriangle
                      className={`h-5 w-5 mt-0.5 ${
                        alert.severity === "critical"
                          ? "text-destructive"
                          : alert.severity === "warning"
                          ? "text-warning"
                          : "text-muted-foreground"
                      }`}
                    />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium text-card-foreground">
                        {alert.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {alert.message}
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        {new Date(alert.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No alerts at this time
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top and Bottom Performers */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Performers */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Top Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topPerformers?.map((agent: AgentPerformance, index: number) => (
                <div
                  key={agent.id}
                  className="flex items-center gap-4 rounded-lg bg-secondary/30 p-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/20 text-sm font-bold text-success">
                    {index + 1}
                  </div>
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {agent.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-card-foreground">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {agent.total_calls} calls
                    </p>
                  </div>
                  <ScoreBadge score={agent.avg_score} />
                </div>
              ))}
              {(!stats.topPerformers || stats.topPerformers.length === 0) && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Needs Attention */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Needs Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.needsAttention?.map((agent: AgentPerformance) => (
                <div
                  key={agent.id}
                  className="flex items-center gap-4 rounded-lg bg-destructive/10 border border-destructive/20 p-3"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-destructive/20 text-destructive">
                      {agent.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-card-foreground">{agent.name}</p>
                    <p className="text-xs text-destructive">
                      Score dropped {Math.abs(agent.trend)}% this week
                    </p>
                  </div>
                  <ScoreBadge score={agent.avg_score} />
                </div>
              ))}
              {(!stats.needsAttention || stats.needsAttention.length === 0) && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  All agents performing well
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Debug JSON removed */}
    </div>
  );
}
