"use client";

import useSWR from "swr";
import { loggingFetcher } from "@/lib/fetcher";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lightbulb, TrendingUp, AlertCircle, Check, Star } from "lucide-react";
import { cn } from "@/lib/utils";

// using centralized loggingFetcher from lib/fetcher

interface CoachingInsight {
  id: string;
  insight_type: "strength" | "improvement" | "trend";
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  acknowledged_at: string | null;
  created_at: string;
}

export function CoachingContent() {
  const { data, isLoading, mutate } = useSWR<{ insights: CoachingInsight[] }>(
    "/api/agent/coaching",
    loggingFetcher
  );

  const handleAcknowledge = async (insightId: string) => {
    await fetch(`/api/agent/coaching/${insightId}/acknowledge`, {
      method: "POST",
    });
    mutate();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-secondary rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-secondary rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const insights = data?.insights || [];
  const pendingInsights = insights.filter((i) => !i.acknowledged_at);
  const acknowledgedInsights = insights.filter((i) => i.acknowledged_at);
  const strengthInsights = insights.filter((i) => i.insight_type === "strength");
  const improvementInsights = insights.filter((i) => i.insight_type === "improvement");
  const trendInsights = insights.filter((i) => i.insight_type === "trend");

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "strength":
        return Star;
      case "improvement":
        return AlertCircle;
      case "trend":
        return TrendingUp;
      default:
        return Lightbulb;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case "strength":
        return "text-success bg-success/10 border-success/20";
      case "improvement":
        return "text-warning bg-warning/10 border-warning/20";
      case "trend":
        return "text-primary bg-primary/10 border-primary/20";
      default:
        return "text-muted-foreground bg-secondary border-border";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive text-destructive-foreground";
      case "medium":
        return "bg-warning text-warning-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const InsightCard = ({ insight }: { insight: CoachingInsight }) => {
    const Icon = getInsightIcon(insight.insight_type);

    return (
      <Card
        className={cn(
          "bg-card border transition-all hover:shadow-md",
          insight.acknowledged_at && "opacity-60"
        )}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg border",
                getInsightColor(insight.insight_type)
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <Badge className={getPriorityColor(insight.priority)}>
              {insight.priority}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h3 className="font-semibold text-card-foreground">{insight.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
              {insight.description}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {new Date(insight.created_at).toLocaleDateString()}
            </span>
            {insight.acknowledged_at ? (
              <Badge variant="outline" className="text-success border-success">
                <Check className="h-3 w-3 mr-1" />
                Acknowledged
              </Badge>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAcknowledge(insight.id)}
              >
                Mark as Read
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Coaching Insights</h1>
        <p className="text-muted-foreground">
          AI-generated insights to help you improve your performance
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">New Insights</p>
                <p className="text-2xl font-bold text-card-foreground">
                  {pendingInsights.length}
                </p>
              </div>
              <Lightbulb className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Strengths</p>
                <p className="text-2xl font-bold text-success">
                  {strengthInsights.length}
                </p>
              </div>
              <Star className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">To Improve</p>
                <p className="text-2xl font-bold text-warning">
                  {improvementInsights.length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Trends</p>
                <p className="text-2xl font-bold text-primary">
                  {trendInsights.length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="bg-secondary">
          <TabsTrigger value="all">
            All ({insights.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({pendingInsights.length})
          </TabsTrigger>
          <TabsTrigger value="strengths">
            Strengths ({strengthInsights.length})
          </TabsTrigger>
          <TabsTrigger value="improvements">
            Improvements ({improvementInsights.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {insights.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {insights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center">
                <Lightbulb className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">
                  No coaching insights yet. Keep taking calls!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingInsights.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingInsights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center">
                <Check className="mx-auto h-12 w-12 text-success/50" />
                <p className="mt-4 text-muted-foreground">
                  All caught up! No pending insights.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="strengths" className="space-y-4">
          {strengthInsights.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {strengthInsights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center">
                <Star className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">
                  No strength insights yet.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="improvements" className="space-y-4">
          {improvementInsights.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {improvementInsights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center">
                <Check className="mx-auto h-12 w-12 text-success/50" />
                <p className="mt-4 text-muted-foreground">
                  Great job! No improvements needed.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
