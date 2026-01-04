import { useState, useEffect } from "react";
import {
  MessageSquare,
  Power,
  Users,
  TrendingUp,
  Clock,
  Wifi,
  WifiOff,
  CheckCircle,
  XCircle,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// API base URL
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface Analytics {
  messages_today: number;
  conversations_today: number;
  total_clients: number;
  new_clients_this_month: number;
  returning_clients: number;
  messages_sent: number;
  messages_received: number;
  avg_messages_per_conversation: number;
  tool_usage: Record<string, number>;
  hourly_distribution: { hour: string; count: number }[];
  language_distribution: { arabic: number; french: number };
  uptime_seconds: number;
}

export default function WhatsAppAgent() {
  const [isAgentActive, setIsAgentActive] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${API_BASE}/whatsapp_agent/analytics`);
      if (!response.ok) throw new Error("Failed to fetch analytics");
      const data = await response.json();
      setAnalytics(data);
      setIsConnected(true);
      setIsAgentActive(data.is_agent_active ?? true);
      setError(null);
    } catch (err) {
      setError("Unable to connect to analytics");
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const toggleAgentStatus = async (active: boolean) => {
    try {
      const response = await fetch(`${API_BASE}/whatsapp_agent/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: active }),
      });
      if (response.ok) {
        setIsAgentActive(active);
      }
    } catch (err) {
      console.error("Failed to toggle agent status:", err);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  // Default values when no data
  const data = analytics || {
    messages_today: 0,
    conversations_today: 0,
    total_clients: 0,
    new_clients_this_month: 0,
    returning_clients: 0,
    messages_sent: 0,
    messages_received: 0,
    avg_messages_per_conversation: 0,
    tool_usage: {},
    hourly_distribution: [],
    language_distribution: { arabic: 0, french: 0 },
    uptime_seconds: 0,
  };

  // Calculate max for hourly chart
  const maxHourly = Math.max(...data.hourly_distribution.map(h => h.count), 1);

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
            <Button variant="outline" size="sm" onClick={fetchAnalytics} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
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
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${isAgentActive ? "bg-green-500/10" : "bg-red-500/10"}`}>
                    <Power className={`h-6 w-6 ${isAgentActive ? "text-green-500" : "text-red-500"}`} />
                  </div>
                  <div>
                    <p className="font-medium">{isAgentActive ? "Agent Active" : "Agent Inactive"}</p>
                    <p className="text-sm text-muted-foreground">
                      {isAgentActive ? "Responding to messages" : "Sending offline message"}
                    </p>
                  </div>
                </div>
                <Button
                  variant={isAgentActive ? "destructive" : "default"}
                  onClick={() => toggleAgentStatus(!isAgentActive)}
                  className={isAgentActive ? "" : "bg-green-600 hover:bg-green-700"}
                >
                  <Power className="h-4 w-4 mr-2" />
                  {isAgentActive ? "Disable Agent" : "Enable Agent"}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-foreground">{data.messages_today}</p>
                  <p className="text-sm text-muted-foreground">Messages today</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-foreground">{data.conversations_today}</p>
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
                      {isConnected ? "WhatsApp Business API" : error || "Connection lost"}
                    </p>
                  </div>
                </div>
                {!isConnected && (
                  <Button variant="outline" size="sm" onClick={fetchAnalytics}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reconnect
                  </Button>
                )}
              </div>

              {/* Uptime */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Uptime</span>
                  <span className="text-sm font-medium text-green-600">
                    {Math.floor(data.uptime_seconds / 3600)}h {Math.floor((data.uptime_seconds % 3600) / 60)}m
                  </span>
                </div>
                <Progress value={isConnected ? 100 : 0} className="h-2" />
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
                  <p className="text-2xl font-bold">{data.total_clients.toLocaleString()}</p>
                  <div className="flex items-center gap-1 mt-1 text-green-600 text-sm">
                    <ArrowUpRight className="h-4 w-4" />
                    <span>{data.new_clients_this_month} new</span>
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
                  <p className="text-sm text-muted-foreground">Avg Msgs/Conversation</p>
                  <p className="text-2xl font-bold">{data.avg_messages_per_conversation}</p>
                  <div className="flex items-center gap-1 mt-1 text-muted-foreground text-sm">
                    <span>messages per chat</span>
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
                  <p className="text-sm text-muted-foreground">Document Checks</p>
                  <p className="text-2xl font-bold">{data.tool_usage?.check_document || 0}</p>
                  <div className="flex items-center gap-1 mt-1 text-green-600 text-sm">
                    <TrendingUp className="h-4 w-4" />
                    <span>status queries</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Returning Clients</p>
                  <p className="text-2xl font-bold">{data.returning_clients}</p>
                  <div className="flex items-center gap-1 mt-1 text-green-600 text-sm">
                    <ArrowUpRight className="h-4 w-4" />
                    <span>repeat users</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
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
                  <p className="text-3xl font-bold text-foreground">{data.new_clients_this_month}</p>
                  <p className="text-sm text-muted-foreground">New Clients</p>
                  <p className="text-xs text-green-600 mt-1">This month</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-3xl font-bold text-foreground">{data.returning_clients}</p>
                  <p className="text-sm text-muted-foreground">Returning</p>
                  <p className="text-xs text-primary mt-1">
                    {data.total_clients > 0
                      ? `${Math.round((data.returning_clients / data.total_clients) * 100)}% return rate`
                      : "0% return rate"
                    }
                  </p>
                </div>
              </div>

              {/* Peak Hours */}
              <div>
                <p className="text-sm font-medium mb-3">Peak Activity Hours</p>
                <div className="flex items-end justify-between h-20 gap-1">
                  {data.hourly_distribution.length > 0 ? (
                    data.hourly_distribution.map((hour) => (
                      <div key={hour.hour} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full rounded-t gradient-brand opacity-70 hover:opacity-100 transition-opacity"
                          style={{ height: `${(hour.count / maxHourly) * 100}%`, minHeight: hour.count > 0 ? "4px" : "0" }}
                        />
                        <span className="text-xs text-muted-foreground">{hour.hour}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground w-full text-center">No data yet</p>
                  )}
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
                  <p className="text-xl font-bold text-foreground">{data.messages_sent}</p>
                  <p className="text-xs text-muted-foreground">Sent</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-xl font-bold text-foreground">{data.messages_received}</p>
                  <p className="text-xs text-muted-foreground">Received</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-xl font-bold text-foreground">{data.avg_messages_per_conversation}</p>
                  <p className="text-xs text-muted-foreground">Avg/Conv</p>
                </div>
              </div>

              {/* Language Distribution */}
              <div className="space-y-3">
                <p className="text-sm font-medium">Language Distribution</p>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Arabic</span>
                    <span className="text-sm font-medium">{data.language_distribution.arabic}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{
                        width: `${(data.language_distribution.arabic / Math.max(data.language_distribution.arabic + data.language_distribution.french, 1)) * 100}%`
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">French</span>
                    <span className="text-sm font-medium">{data.language_distribution.french}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{
                        width: `${(data.language_distribution.french / Math.max(data.language_distribution.arabic + data.language_distribution.french, 1)) * 100}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
