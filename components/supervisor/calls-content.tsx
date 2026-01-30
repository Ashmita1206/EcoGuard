"use client";

import useSWR from "swr";
import { loggingFetcher } from "@/lib/fetcher";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScoreBadge } from "@/components/score-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Phone, Search, Clock, PhoneIncoming, PhoneOutgoing, Eye } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";


interface Call {
  id: string;
  agent_id: string;
  agent_name: string;
  customer_phone: string;
  duration_seconds: number;
  call_type: "inbound" | "outbound";
  status: string;
  created_at: string;
  evaluation?: {
    total_score: number;
    category_scores: Record<string, number>;
    strengths: string[];
    improvements: string[];
  };
  transcript?: {
    content: string;
  };
}

export function SupervisorCallsContent() {
  const [search, setSearch] = useState("");
  const [agentFilter, setAgentFilter] = useState("all");
  const { data, isLoading } = useSWR<{ calls: Call[]; agents: { id: string; name: string }[] }>(
    "/api/supervisor/calls",
    loggingFetcher
  );

  const calls = data?.calls || [];
  const agents = data?.agents || [];

  const filteredCalls = calls.filter((call) => {
    const matchesSearch =
      call.customer_phone.includes(search) ||
      call.agent_name.toLowerCase().includes(search.toLowerCase());
    const matchesAgent = agentFilter === "all" || call.agent_id === agentFilter;
    return matchesSearch && matchesAgent;
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 bg-secondary rounded animate-pulse" />
        <div className="h-96 bg-secondary rounded-lg animate-pulse" />
      </div>
    );
  }

  // render

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team Calls</h1>
          <p className="text-muted-foreground">
            Review calls from your team members
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-primary" />
          <span className="text-sm text-muted-foreground">
            {filteredCalls.length} calls
          </span>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by phone or agent..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-input border-border"
              />
            </div>
            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger className="w-[200px] bg-input border-border">
                <SelectValue placeholder="Filter by agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Agent</TableHead>
                <TableHead className="text-muted-foreground">Date</TableHead>
                <TableHead className="text-muted-foreground">Type</TableHead>
                <TableHead className="text-muted-foreground">Customer</TableHead>
                <TableHead className="text-muted-foreground">Duration</TableHead>
                <TableHead className="text-muted-foreground">Score</TableHead>
                <TableHead className="text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCalls.length > 0 ? (
                filteredCalls.map((call) => (
                  <TableRow key={call.id} className="border-border">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {call.agent_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-card-foreground">{call.agent_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-card-foreground">
                      {new Date(call.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {call.call_type === "inbound" ? (
                        <div className="flex items-center gap-1 text-success">
                          <PhoneIncoming className="h-4 w-4" />
                          <span className="text-sm">In</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-primary">
                          <PhoneOutgoing className="h-4 w-4" />
                          <span className="text-sm">Out</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-card-foreground font-mono text-sm">
                      {call.customer_phone}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{formatDuration(call.duration_seconds)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {call.evaluation ? (
                        <ScoreBadge score={call.evaluation.total_score} size="sm" />
                      ) : (
                        <span className="text-sm text-muted-foreground">Pending</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl bg-card border-border">
                          <DialogHeader>
                            <DialogTitle className="text-card-foreground">
                              Call Details - {call.agent_name}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Customer</p>
                                <p className="font-mono text-card-foreground">
                                  {call.customer_phone}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Duration</p>
                                <p className="text-card-foreground">
                                  {formatDuration(call.duration_seconds)}
                                </p>
                              </div>
                            </div>

                            {call.evaluation && (
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium text-card-foreground">
                                    Evaluation
                                  </h4>
                                  <ScoreBadge
                                    score={call.evaluation.total_score}
                                    showLabel
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  {Object.entries(call.evaluation.category_scores || {}).map(
                                    ([category, score]) => (
                                      <div
                                        key={category}
                                        className="flex items-center justify-between rounded-lg bg-secondary/50 p-3"
                                      >
                                        <span className="text-sm text-muted-foreground capitalize">
                                          {category.replace(/_/g, " ")}
                                        </span>
                                        <span className="font-medium text-card-foreground">
                                          {score}
                                        </span>
                                      </div>
                                    )
                                  )}
                                </div>

                                {call.evaluation.strengths?.length > 0 && (
                                  <div className="space-y-2">
                                    <h5 className="text-sm font-medium text-success">
                                      Strengths
                                    </h5>
                                    <ul className="space-y-1">
                                      {call.evaluation.strengths.map((s, i) => (
                                        <li key={i} className="text-sm text-muted-foreground">
                                          • {s}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {call.evaluation.improvements?.length > 0 && (
                                  <div className="space-y-2">
                                    <h5 className="text-sm font-medium text-warning">
                                      Areas for Improvement
                                    </h5>
                                    <ul className="space-y-1">
                                      {call.evaluation.improvements.map((s, i) => (
                                        <li key={i} className="text-sm text-muted-foreground">
                                          • {s}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}

                            {call.transcript && (
                              <div className="space-y-2">
                                <h4 className="font-medium text-card-foreground">
                                  Transcript
                                </h4>
                                <ScrollArea className="h-48 rounded-lg border border-border bg-secondary/30 p-4">
                                  <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">
                                    {call.transcript.content}
                                  </pre>
                                </ScrollArea>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">No calls found</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {/* Debug JSON removed */}
    </div>
  );
}
