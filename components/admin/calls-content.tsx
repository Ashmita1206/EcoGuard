"use client";

import useSWR from "swr";
import { loggingFetcher } from "@/lib/fetcher";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Phone, Search, Clock, PhoneIncoming, PhoneOutgoing } from "lucide-react";
import { useState } from "react";


interface Call {
  id: string;
  agent_id: string;
  agent_name: string;
  supervisor_name: string | null;
  customer_phone: string;
  duration_seconds: number;
  call_type: "inbound" | "outbound";
  status: string;
  created_at: string;
  total_score: number | null;
}

export function AdminCallsContent() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useSWR<{ calls: Call[] }>("/api/admin/calls", loggingFetcher);

  const calls = data?.calls || [];

  const filteredCalls = calls.filter((call) =>
    call.customer_phone.includes(search) ||
    call.agent_name.toLowerCase().includes(search.toLowerCase()) ||
    (call.supervisor_name && call.supervisor_name.toLowerCase().includes(search.toLowerCase()))
  );

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

  // eslint-disable-next-line no-console
  console.log('[render] AdminCalls data:', { calls: calls.length });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">All Calls</h1>
          <p className="text-muted-foreground">
            Organization-wide call history
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
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by phone, agent, or supervisor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-input border-border"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Agent</TableHead>
                <TableHead className="text-muted-foreground">Supervisor</TableHead>
                <TableHead className="text-muted-foreground">Date</TableHead>
                <TableHead className="text-muted-foreground">Type</TableHead>
                <TableHead className="text-muted-foreground">Customer</TableHead>
                <TableHead className="text-muted-foreground">Duration</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCalls.map((call) => (
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
                  <TableCell className="text-muted-foreground">
                    {call.supervisor_name || "-"}
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
                    <Badge
                      variant="outline"
                      className={
                        call.status === "completed"
                          ? "border-success text-success"
                          : call.status === "dropped"
                          ? "border-destructive text-destructive"
                          : "border-warning text-warning"
                      }
                    >
                      {call.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {call.total_score !== null ? (
                      <ScoreBadge score={call.total_score} size="sm" />
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredCalls.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No calls found</p>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Debug JSON removed */}
    </div>
  );
}
