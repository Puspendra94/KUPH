import { useEffect, useState } from "react";
import { useKeycloakAuth } from "@/lib/keycloak-auth";
import { apiRequest } from "@/lib/api";
import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  Briefcase,
  TrendingUp,
  Calendar,
  Loader2,
} from "lucide-react";

interface DashboardStats {
  totalCampaigns: number;
  activeCampaigns: number;
  draftCampaigns: number;
  completedCampaigns: number;
  totalInfluencers: number;
  totalClients: number;
}

export default function Dashboard() {
  const { user, token } = useKeycloakAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      if (!token) return;
      try {
        const data = await apiRequest<DashboardStats>("/dashboard/stats", { token });
        setStats(data);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
  }, [token]);

  const statsCards = [
    {
      icon: TrendingUp,
      label: "Active Campaigns",
      value: stats?.activeCampaigns ?? 0,
      change: `${stats?.draftCampaigns ?? 0} in draft, ${stats?.completedCampaigns ?? 0} completed`,
    },
    {
      icon: Users,
      label: "Influencers",
      value: stats?.totalInfluencers ?? 0,
      change: "In your network",
    },
    {
      icon: Briefcase,
      label: "Clients",
      value: stats?.totalClients ?? 0,
      change: "Brand partners",
    },
    {
      icon: Calendar,
      label: "Total Campaigns",
      value: stats?.totalCampaigns ?? 0,
      change: "All time",
    },
  ];

  const campaignChartData = [
    { name: "Draft", count: stats?.draftCampaigns ?? 0 },
    { name: "Active", count: stats?.activeCampaigns ?? 0 },
    { name: "Completed", count: stats?.completedCampaigns ?? 0 },
  ];

  const revenueChartData = [
    {
      month: "Total",
      value: (stats?.totalInfluencers ?? 0) + (stats?.totalClients ?? 0) + (stats?.totalCampaigns ?? 0),
    },
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {user?.email?.split("@")[0] || "there"}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Here's an overview of your influencer marketing campaigns and data.
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, i) => (
          <Card
            key={i}
            className="p-6 hover:shadow-lg transition-shadow animate-slide-up"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {stat.value}
                </p>
                <p className="text-xs text-accent font-medium mt-2">
                  {stat.change}
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <stat.icon className="w-6 h-6 text-primary" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 animate-slide-up" style={{ animationDelay: "200ms" }}>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Campaign Status
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={campaignChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6 animate-slide-up" style={{ animationDelay: "250ms" }}>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Growth Overview
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* Activity Summary */}
      {!loading && stats && (
        <Card className="p-6 animate-slide-up" style={{ animationDelay: "300ms" }}>
          <h3 className="text-lg font-semibold text-foreground mb-4">
            At a Glance
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-border">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <p className="text-foreground text-sm">
                <strong>{stats.totalCampaigns}</strong> campaign{stats.totalCampaigns !== 1 ? "s" : ""} total (
                {stats.activeCampaigns} active, {stats.draftCampaigns} draft, {stats.completedCampaigns} completed)
              </p>
            </div>
            <div className="flex items-center gap-4 pb-4 border-b border-border">
              <div className="w-2 h-2 bg-accent rounded-full" />
              <p className="text-foreground text-sm">
                <strong>{stats.totalInfluencers}</strong> influencer{stats.totalInfluencers !== 1 ? "s" : ""} in your network
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <p className="text-foreground text-sm">
                <strong>{stats.totalClients}</strong> client{stats.totalClients !== 1 ? "s" : ""} partnering with you
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}