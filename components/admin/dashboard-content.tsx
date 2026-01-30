"use client";

import useSWR from "swr";
import { loggingFetcher } from "@/lib/fetcher";
import { StatsCard } from "@/components/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Phone, TrendingUp, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";


export function AdminDashboardContent() {
  const { data: statsRaw, isLoading } = useSWR("/api/admin/stats", loggingFetcher);
  const stats = statsRaw || ({} as any);

  // render

  const COLORS = [
    "oklch(0.55 0.15 250)",
    "oklch(0.65 0.18 145)",
    "oklch(0.75 0.15 85)",
    "oklch(0.55 0.2 25)",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Organization-wide metrics and management
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers ?? 0}
          description="across all teams"
          icon={Users}
        />
        <StatsCard
          title="Total Calls Today"
          value={stats.totalCallsToday ?? 0}
          trend={{ value: stats.callsTrend ?? 0, label: "vs yesterday" }}
          icon={Phone}
        />
        <StatsCard
          title="Org Avg Score"
          value={stats.orgAvgScore ?? 0}
          trend={{ value: stats.scoreTrend ?? 0, label: "vs last week" }}
          icon={TrendingUp}
        />
        <StatsCard
          title="Critical Alerts"
          value={stats.criticalAlerts ?? 0}
          description="require attention"
          icon={AlertTriangle}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Score Trend */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-card-foreground">
              Organization Score Trend
            </CardTitle>
            <Link href="/admin/analytics">
              <Button variant="ghost" size="sm" className="gap-1">
                View analytics
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.scoreTrendData || []}>
                  <defs>
                    <linearGradient id="adminScoreGradient" x1="0" y1="0" x2="0" y2="1">
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
                    fill="url(#adminScoreGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Score Distribution */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.scoreDistribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {stats.scoreDistribution?.map((entry: { name: string }, index: number) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(0.16 0.025 250)",
                      border: "1px solid oklch(0.28 0.03 250)",
                      borderRadius: "8px",
                      color: "oklch(0.98 0 0)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {stats.scoreDistribution?.map((entry: { name: string }, index: number) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm text-muted-foreground">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Supervisor Performance */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-card-foreground">Supervisor Performance</CardTitle>
          <Link href="/admin/users">
            <Button variant="ghost" size="sm" className="gap-1">
              Manage users
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.supervisorPerformance?.map((supervisor: {
              supervisor_id: string;
              supervisor_name: string;
              agent_count: number;
              avg_score: number;
              total_calls: number;
            }) => (
              <div
                key={supervisor.supervisor_id}
                className="rounded-lg border border-border bg-secondary/30 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-card-foreground">{supervisor.supervisor_name}</h4>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold text-sm ${
                      supervisor.avg_score >= 80
                        ? "bg-success text-success-foreground"
                        : supervisor.avg_score >= 60
                        ? "bg-warning text-warning-foreground"
                        : "bg-destructive text-destructive-foreground"
                    }`}
                  >
                    {supervisor.avg_score}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Agents</p>
                    <p className="font-medium text-card-foreground">{supervisor.agent_count}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Calls</p>
                    <p className="font-medium text-card-foreground">{supervisor.total_calls}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {(!stats.supervisorPerformance || stats.supervisorPerformance.length === 0) && (
            <p className="text-center text-muted-foreground py-8">
              No supervisor data available
            </p>
          )}
        </CardContent>
      </Card>
      {/* Debug JSON removed */}
    </div>
  );
}
