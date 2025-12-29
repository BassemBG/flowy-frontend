import { useState } from "react";
import {
  MessageSquare,
  Power,
  Users,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  Clock,
  DollarSign,
  Wifi,
  WifiOff,
  AlertTriangle,
  Bell,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

// Mock data
const mockAlerts = [
  { id: 1, type: "urgent", message: "Client mentioned 'urgent' - Order #4521", time: "2 min ago" },
  { id: 2, type: "complaint", message: "Negative feedback received from Ahmed K.", time: "15 min ago" },
  { id: 3, type: "response", message: "Long response time detected (>5 min)", time: "1 hour ago" },
];

const peakHours = [
  { hour: "9AM", value: 45 },
  { hour: "10AM", value: 65 },
  { hour: "11AM", value: 80 },
  { hour: "12PM", value: 70 },
  { hour: "1PM", value: 55 },
  { hour: "2PM", value: 75 },
  { hour: "3PM", value: 90 },
  { hour: "4PM", value: 85 },
  { hour: "5PM", value: 60 },
];

export default function WhatsAppAgent() {
  const [isAgentActive, setIsAgentActive] = useState(true);
  const [isConnected, setIsConnected] = useState(true);

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl gradient-brand flex items-center justify-center shadow-glow">
              <MessageSquare className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="page-title">WhatsApp Agent</h1>
              <p className="page-description">Monitor and manage your business chatbot</p>
            </div>
          </div>
          
          {/* Quick Status */}
          <div className="flex items-center gap-3">
            <Badge 
              variant={isAgentActive ? "default" : "secondary"}
              className={isAgentActive ? "bg-green-500/10 text-green-600 border-green-500/20" : ""}
            >
              <span className={`w-2 h-2 rounded-full mr-2 ${isAgentActive ? "bg-green-500 animate-pulse" : "bg-muted-foreground"}`} />
              {isAgentActive ? "Online" : "Offline"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Top Row - Status & Connection */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Chatbot Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Power className="h-5 w-5 text-primary" />
                Chatbot Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${isAgentActive ? "bg-green-500/10" : "bg-muted"}`}>
                    <Power className={`h-6 w-6 ${isAgentActive ? "text-green-500" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <p className="font-medium">{isAgentActive ? "Agent Active" : "Agent Inactive"}</p>
                    <p className="text-sm text-muted-foreground">
                      {isAgentActive ? "Responding to messages" : "Not responding"}
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={isAgentActive} 
                  onCheckedChange={setIsAgentActive}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-foreground">247</p>
                  <p className="text-sm text-muted-foreground">Messages today</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-foreground">89</p>
                  <p className="text-sm text-muted-foreground">Conversations</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* WhatsApp Integration */}
          <Card className={!isConnected ? "border-destructive/50" : ""}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                {isConnected ? (
                  <Wifi className="h-5 w-5 text-green-500" />
                ) : (
                  <WifiOff className="h-5 w-5 text-destructive" />
                )}
                WhatsApp Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${isConnected ? "bg-green-500/10" : "bg-destructive/10"}`}>
                    {isConnected ? (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    ) : (
                      <XCircle className="h-6 w-6 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {isConnected ? "Connected" : "Disconnected"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isConnected ? "WhatsApp Business API" : "Connection lost"}
                    </p>
                  </div>
                </div>
                {!isConnected && (
                  <Button variant="outline" size="sm" onClick={() => setIsConnected(true)}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reconnect
                  </Button>
                )}
              </div>
              
              {/* Agent Availability */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Uptime this month</span>
                  <span className="text-sm font-medium text-green-600">99.8%</span>
                </div>
                <Progress value={99.8} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Metrics Row */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Clients</p>
                  <p className="text-2xl font-bold">1,284</p>
                  <div className="flex items-center gap-1 mt-1 text-green-600 text-sm">
                    <ArrowUpRight className="h-4 w-4" />
                    <span>12% this week</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Response Time</p>
                  <p className="text-2xl font-bold">1.2 min</p>
                  <div className="flex items-center gap-1 mt-1 text-green-600 text-sm">
                    <ArrowDownRight className="h-4 w-4" />
                    <span>8% faster</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                  <p className="text-2xl font-bold">24.5%</p>
                  <div className="flex items-center gap-1 mt-1 text-green-600 text-sm">
                    <ArrowUpRight className="h-4 w-4" />
                    <span>3.2% increase</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue Generated</p>
                  <p className="text-2xl font-bold">$12.4K</p>
                  <div className="flex items-center gap-1 mt-1 text-green-600 text-sm">
                    <ArrowUpRight className="h-4 w-4" />
                    <span>18% this month</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle Row - Engagement & Messages */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Client Engagement */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Client Engagement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-3xl font-bold text-foreground">892</p>
                  <p className="text-sm text-muted-foreground">New Clients</p>
                  <p className="text-xs text-green-600 mt-1">This month</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-3xl font-bold text-foreground">392</p>
                  <p className="text-sm text-muted-foreground">Returning</p>
                  <p className="text-xs text-primary mt-1">30.5% return rate</p>
                </div>
              </div>
              
              {/* Peak Hours */}
              <div>
                <p className="text-sm font-medium mb-3">Peak Activity Hours</p>
                <div className="flex items-end justify-between h-20 gap-1">
                  {peakHours.map((hour) => (
                    <div key={hour.hour} className="flex-1 flex flex-col items-center gap-1">
                      <div 
                        className="w-full rounded-t gradient-brand opacity-70 hover:opacity-100 transition-opacity"
                        style={{ height: `${hour.value}%` }}
                      />
                      <span className="text-xs text-muted-foreground">{hour.hour}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Message Statistics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Message Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-xl font-bold text-foreground">5.2K</p>
                  <p className="text-xs text-muted-foreground">Sent</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-xl font-bold text-foreground">4.8K</p>
                  <p className="text-xs text-muted-foreground">Received</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-xl font-bold text-foreground">8.3</p>
                  <p className="text-xs text-muted-foreground">Avg/Conv</p>
                </div>
              </div>
              
              {/* Resolution Rate */}
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Resolved Queries</span>
                    <span className="text-sm font-medium text-green-600">87%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: "87%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Unresolved</span>
                    <span className="text-sm font-medium text-amber-600">13%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: "13%" }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row - Feedback & Alerts */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Client Feedback */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ThumbsUp className="h-5 w-5 text-primary" />
                Client Feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center gap-8 py-4">
                <div className="text-center">
                  <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-2">
                    <ThumbsUp className="h-8 w-8 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">89%</p>
                  <p className="text-sm text-muted-foreground">Positive</p>
                </div>
                <div className="h-16 w-px bg-border" />
                <div className="text-center">
                  <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-2">
                    <ThumbsDown className="h-8 w-8 text-red-500" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">11%</p>
                  <p className="text-sm text-muted-foreground">Negative</p>
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Satisfaction Trend</span>
                  <Badge variant="outline" className="text-green-600 border-green-500/30">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +5% this week
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Based on 342 feedback responses collected this month
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Customizable Alerts */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Priority Alerts
                </div>
                <Badge variant="destructive" className="text-xs">
                  {mockAlerts.length} new
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[180px] pr-4">
                <div className="space-y-3">
                  {mockAlerts.map((alert) => (
                    <div 
                      key={alert.id} 
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        alert.type === "urgent" 
                          ? "bg-red-500/10" 
                          : alert.type === "complaint" 
                          ? "bg-amber-500/10" 
                          : "bg-blue-500/10"
                      }`}>
                        <AlertTriangle className={`h-4 w-4 ${
                          alert.type === "urgent" 
                            ? "text-red-500" 
                            : alert.type === "complaint" 
                            ? "text-amber-500" 
                            : "text-blue-500"
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{alert.message}</p>
                        <p className="text-xs text-muted-foreground">{alert.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
