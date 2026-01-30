"use client";

import useSWR from "swr";
import { loggingFetcher } from "@/lib/fetcher";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Search, Eye, Plus, FileText } from "lucide-react";
import { useState } from "react";


interface SOP {
  id: string;
  title: string;
  content: string;
  category: string;
  version: number;
  created_at: string;
  updated_at: string;
}

interface SOPsContentProps {
  canEdit?: boolean;
}

export function SOPsContent({ canEdit = false }: SOPsContentProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const { data, isLoading } = useSWR<{ sops: SOP[]; categories: string[] }>(
    "/api/sops",
    loggingFetcher
  );

  const sops = data?.sops || [];
  const categories = data?.categories || [];

  const filteredSOPs = sops.filter((sop) => {
    const matchesSearch =
      sop.title.toLowerCase().includes(search.toLowerCase()) ||
      sop.content.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || sop.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Standard Operating Procedures
          </h1>
          <p className="text-muted-foreground">
            Guidelines and procedures for quality assurance
          </p>
        </div>
        {canEdit && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add SOP
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search SOPs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-input border-border"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={categoryFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setCategoryFilter("all")}
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={categoryFilter === category ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* SOPs Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredSOPs.map((sop) => (
          <Card key={sop.id} className="bg-card border-border">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <Badge variant="outline" className="text-muted-foreground">
                  v{sop.version}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <CardTitle className="text-base text-card-foreground">
                  {sop.title}
                </CardTitle>
                <Badge className="mt-2 bg-secondary text-secondary-foreground">
                  {sop.category}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {sop.content}
              </p>
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-muted-foreground">
                  Updated {new Date(sop.updated_at).toLocaleDateString()}
                </span>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl bg-card border-border">
                    <DialogHeader>
                      <DialogTitle className="text-card-foreground">
                        {sop.title}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-secondary text-secondary-foreground">
                          {sop.category}
                        </Badge>
                        <Badge variant="outline" className="text-muted-foreground">
                          Version {sop.version}
                        </Badge>
                      </div>
                      <ScrollArea className="h-96 rounded-lg border border-border bg-secondary/30 p-4">
                        <div className="prose prose-invert prose-sm max-w-none">
                          <pre className="whitespace-pre-wrap font-sans text-muted-foreground">
                            {sop.content}
                          </pre>
                        </div>
                      </ScrollArea>
                      <p className="text-xs text-muted-foreground">
                        Last updated: {new Date(sop.updated_at).toLocaleString()}
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSOPs.length === 0 && (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">No SOPs found</p>
          </CardContent>
        </Card>
      )}

      {/* Debug JSON removed */}
    </div>
  );
}
