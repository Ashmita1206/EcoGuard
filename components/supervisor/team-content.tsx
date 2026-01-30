"use client";

import useSWR from "swr";
import { loggingFetcher } from "@/lib/fetcher";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/score-badge";
import { Progress } from "@/components/ui/progress";
import { Users, TrendingUp, TrendingDown, Minus } from "lucide-react";


interface AgentDetail {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  total_calls: number;
  avg_score: number;
  avg_handle_time: number;
  category_scores: Record<string, number>;
  trend: number;
}

export function TeamPerformanceContent() {
  const { data, isLoading } = useSWR<{ agents: AgentDetail[] }>(
    "/api/supervisor/team",
    loggingFetcher
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-secondary rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-secondary rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const agents = data?.agents || [];


  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return TrendingUp;
    if (trend < 0) return TrendingDown;
    return Minus;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return "text-success";
    if (trend < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team Performance</h1>
          <p className="text-muted-foreground">
            Detailed view of each agent&apos;s performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <span className="text-sm text-muted-foreground">
            {agents.length} agents
          </span>
        </div>
      </div>

      {/* Agent Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => {
          const TrendIcon = getTrendIcon(agent.trend);
          return (
            <Card key={agent.id} className="bg-card border-border">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {agent.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base text-card-foreground">
                        {agent.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{agent.email}</p>
                    </div>
                  </div>
                  <ScoreBadge score={agent.avg_score} size="lg" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-secondary/50 p-2">
                    <p className="text-lg font-semibold text-card-foreground">
                      {agent.total_calls}
                    </p>
                    <p className="text-xs text-muted-foreground">Calls</p>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-2">
                    <p className="text-lg font-semibold text-card-foreground">
                      {formatDuration(agent.avg_handle_time)}
                    </p>
                    <p className="text-xs text-muted-foreground">Avg Time</p>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-2">
                    <div className={`flex items-center justify-center gap-1 ${getTrendColor(agent.trend)}`}>
                      <TrendIcon className="h-4 w-4" />
                      <span className="text-lg font-semibold">{Math.abs(agent.trend)}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Trend</p>
                  </div>
                </div>

                {/* Category Breakdown */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-card-foreground">
                    Category Scores
                  </p>
                  {Object.entries(agent.category_scores || {}).map(([category, score]) => (
                    <div key={category} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground capitalize">
                          {category.replace(/_/g, " ")}
                        </span>
                        <span className="font-medium text-card-foreground">{score}</span>
                      </div>
                      <Progress value={score} className="h-2" />
                    </div>
                  ))}
                  {(!agent.category_scores || Object.keys(agent.category_scores).length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      No category data available
                    </p>
                  )}
                </div>

                {/* Status Badge */}
                <div className="flex justify-end">
                  <Badge
                    variant="outline"
                    className={
                      agent.avg_score >= 80
                        ? "border-success text-success"
                        : agent.avg_score >= 60
                        ? "border-warning text-warning"
                        : "border-destructive text-destructive"
                    }
                  >
                    {agent.avg_score >= 80
                      ? "On Track"
                      : agent.avg_score >= 60
                      ? "Monitor"
                      : "Needs Coaching"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {agents.length === 0 && (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">
              No team members found
            </p>
          </CardContent>
        </Card>
      )}

      {/* Debug JSON removed */}
    </div>
  );
}
