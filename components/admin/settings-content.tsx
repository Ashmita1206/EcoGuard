"use client";

import useSWR from "swr";
import { loggingFetcher } from "@/lib/fetcher";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Sliders, Bell, Shield } from "lucide-react";
import { useState } from "react";


interface ScoringCategory {
  name: string;
  weight: number;
  enabled: boolean;
}

export function SettingsContent() {
  const { data } = useSWR("/api/admin/settings", loggingFetcher);
  const [categories, setCategories] = useState<ScoringCategory[]>([
    { name: "Communication", weight: 25, enabled: true },
    { name: "Problem Resolution", weight: 25, enabled: true },
    { name: "Product Knowledge", weight: 20, enabled: true },
    { name: "Compliance", weight: 15, enabled: true },
    { name: "Customer Satisfaction", weight: 15, enabled: true },
  ]);
  const [alertThreshold, setAlertThreshold] = useState(60);

  const handleWeightChange = (index: number, weight: number[]) => {
    const newCategories = [...categories];
    newCategories[index].weight = weight[0];
    setCategories(newCategories);
  };

  const handleToggle = (index: number) => {
    const newCategories = [...categories];
    newCategories[index].enabled = !newCategories[index].enabled;
    setCategories(newCategories);
  };

  const totalWeight = categories
    .filter((c) => c.enabled)
    .reduce((sum, c) => sum + c.weight, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Configure scoring criteria, alerts, and system settings
        </p>
      </div>

      <Tabs defaultValue="scoring" className="space-y-6">
        <TabsList className="bg-secondary">
          <TabsTrigger value="scoring" className="gap-2">
            <Sliders className="h-4 w-4" />
            Scoring
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <Bell className="h-4 w-4" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scoring" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Scoring Categories</CardTitle>
              <CardDescription>
                Configure the weight of each evaluation category. Weights should total 100%.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {categories.map((category, index) => (
                <div
                  key={category.name}
                  className={`space-y-4 rounded-lg border p-4 ${
                    category.enabled ? "border-border" : "border-border/50 opacity-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={category.enabled}
                        onCheckedChange={() => handleToggle(index)}
                      />
                      <Label className="text-card-foreground font-medium">
                        {category.name}
                      </Label>
                    </div>
                    <span className="text-lg font-bold text-primary">
                      {category.weight}%
                    </span>
                  </div>
                  {category.enabled && (
                    <Slider
                      value={[category.weight]}
                      onValueChange={(value) => handleWeightChange(index, value)}
                      max={50}
                      min={5}
                      step={5}
                      className="w-full"
                    />
                  )}
                </div>
              ))}

              <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-4">
                <span className="font-medium text-card-foreground">Total Weight</span>
                <span
                  className={`text-lg font-bold ${
                    totalWeight === 100 ? "text-success" : "text-destructive"
                  }`}
                >
                  {totalWeight}%
                </span>
              </div>

              {totalWeight !== 100 && (
                <p className="text-sm text-destructive">
                  Weights must total 100%. Current total: {totalWeight}%
                </p>
              )}

              <Button disabled={totalWeight !== 100}>Save Scoring Configuration</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Alert Configuration</CardTitle>
              <CardDescription>
                Configure when alerts are triggered for supervisors and admins.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-card-foreground">Low Score Alert Threshold</Label>
                  <span className="text-lg font-bold text-warning">{alertThreshold}</span>
                </div>
                <Slider
                  value={[alertThreshold]}
                  onValueChange={(value) => setAlertThreshold(value[0])}
                  max={80}
                  min={40}
                  step={5}
                />
                <p className="text-sm text-muted-foreground">
                  Supervisors will be alerted when an agent scores below {alertThreshold}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="space-y-1">
                    <Label className="text-card-foreground">SOP Violation Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Alert when SOP violations are detected
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="space-y-1">
                    <Label className="text-card-foreground">Coaching Required Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Alert when an agent needs coaching attention
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="space-y-1">
                    <Label className="text-card-foreground">Score Drop Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Alert when agent score drops significantly
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Button>Save Alert Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Security Settings</CardTitle>
              <CardDescription>
                Manage authentication and security options.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-card-foreground">Session Timeout (minutes)</Label>
                  <Input
                    type="number"
                    defaultValue={60}
                    className="max-w-xs bg-input border-border"
                  />
                  <p className="text-sm text-muted-foreground">
                    Users will be logged out after this period of inactivity
                  </p>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="space-y-1">
                    <Label className="text-card-foreground">Require Strong Passwords</Label>
                    <p className="text-sm text-muted-foreground">
                      Enforce minimum password requirements
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="space-y-1">
                    <Label className="text-card-foreground">Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Require 2FA for admin accounts
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>

              <Button>Save Security Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
