"use client";

import useSWR from "swr";
import { loggingFetcher } from "@/lib/fetcher";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScoreBadge } from "@/components/score-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Search, Bot, User } from "lucide-react";
import { useState } from "react";


interface Evaluation {
  id: string;
  agent_id: string;
  agent_name: string;
  call_id: string;
  auto_generated: boolean;
  reviewed_by: number | null;
  total_score: number;
  category_scores: Record<string, number>;
  strengths: string[];
  improvements: string[];
  sop_violations: Record<string, string[]> | null;
  created_at: string;
}

export function EvaluationsContent() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const { data, isLoading } = useSWR<{ evaluations: Evaluation[] }>(
    "/api/supervisor/evaluations",
    loggingFetcher
  );

  const evaluations = data?.evaluations || [];

  const filteredEvaluations = evaluations.filter((evaluation) => {
    const matchesSearch = evaluation.agent_name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesType =
      typeFilter === "all" || 
      (typeFilter === "ai" && evaluation.auto_generated) ||
      (typeFilter === "manual" && !evaluation.auto_generated);
    return matchesSearch && matchesType;
  });

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Evaluations</h1>
          <p className="text-muted-foreground">
            Review AI and manual call evaluations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <span className="text-sm text-muted-foreground">
            {filteredEvaluations.length} evaluations
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by agent name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-input border-border"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px] bg-input border-border">
            <SelectValue placeholder="Evaluator type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="ai">AI Evaluations</SelectItem>
            <SelectItem value="manual">Manual Reviews</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Evaluations Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredEvaluations.map((evaluation) => (
          <Card key={evaluation.id} className="bg-card border-border">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {evaluation.agent_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base text-card-foreground">
                      {evaluation.agent_name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {new Date(evaluation.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <ScoreBadge score={evaluation.total_score} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Evaluator Type */}
              <div className="flex items-center gap-2">
                {evaluation.auto_generated ? (
                  <Badge variant="outline" className="gap-1 border-primary text-primary">
                    <Bot className="h-3 w-3" />
                    AI Evaluation
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 border-success text-success">
                    <User className="h-3 w-3" />
                    Manual Review
                  </Badge>
                )}
              </div>

              {/* Category Scores */}
              <div className="space-y-2">
                {Object.entries(evaluation.category_scores || {})
                  .slice(0, 3)
                  .map(([category, score]) => (
                    <div
                      key={category}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground capitalize">
                        {category.replace(/_/g, " ")}
                      </span>
                      <span className="font-medium text-card-foreground">{score}</span>
                    </div>
                  ))}
              </div>

              {/* Highlights */}
              <div className="space-y-2">
                {evaluation.strengths?.length > 0 && (
                  <div className="rounded-lg bg-success/10 p-2">
                    <p className="text-xs text-success font-medium">Strength</p>
                    <p className="text-sm text-card-foreground line-clamp-1">
                      {evaluation.strengths[0]}
                    </p>
                  </div>
                )}
                {evaluation.improvements?.length > 0 && (
                  <div className="rounded-lg bg-warning/10 p-2">
                    <p className="text-xs text-warning font-medium">To Improve</p>
                    <p className="text-sm text-card-foreground line-clamp-1">
                      {evaluation.improvements[0]}
                    </p>
                  </div>
                )}
                {evaluation.sop_violations && Object.keys(evaluation.sop_violations).length > 0 && (
                  <div className="rounded-lg bg-destructive/10 p-2">
                    <p className="text-xs text-destructive font-medium">SOP Violations</p>
                    <p className="text-sm text-card-foreground line-clamp-1">
                      {Object.entries(evaluation.sop_violations)[0]?.[1]?.[0] || "Multiple violations"}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEvaluations.length === 0 && (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">No evaluations found</p>
          </CardContent>
        </Card>
      )}

      {/* Debug JSON removed */}
    </div>
  );
}
