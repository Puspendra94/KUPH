import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Search,
  Plus,
  ChevronRight,
  Calendar,
  DollarSign,
  Users,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useKeycloakAuth } from "@/lib/keycloak-auth";
import { apiRequest } from "@/lib/api";

interface CampaignRecord {
  id: string;
  name?: string;
  clientId?: string;
  customAttributes?: Record<string, unknown>;
  status?: string;
  budget?: string;
  startDate?: string;
  endDate?: string;
  influencers?: number;
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export default function Campaigns() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useKeycloakAuth();

  // New campaign dialog
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [newClientId, setNewClientId] = useState("");
  const [newBrief, setNewBrief] = useState("");
  const [newCreating, setNewCreating] = useState(false);
  const [newError, setNewError] = useState("");

  const loadCampaigns = async () => {
    if (!token) return;
    try {
      const data = await apiRequest<CampaignRecord[]>("/campaigns", { token });
      setCampaigns(data || []);
    } catch (error) {
      console.error("Failed to load campaigns", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCampaigns();
  }, [token]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newName.trim()) {
      setNewError("Campaign name is required");
      return;
    }

    setNewCreating(true);
    setNewError("");

    try {
      const res = await fetch(`${API_BASE}/campaigns`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newName.trim(),
          clientId: newClientId.trim() || undefined,
          brief: newBrief.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create campaign");
      }

      setShowNewDialog(false);
      setNewName("");
      setNewClientId("");
      setNewBrief("");
      setNewError("");
      void loadCampaigns();
    } catch (err) {
      setNewError(err instanceof Error ? err.message : "Failed to create campaign");
    } finally {
      setNewCreating(false);
    }
  };

  const filtered = campaigns.filter((c) => {
    const query = searchQuery.toLowerCase();
    const name = (c.name || "").toLowerCase();
    const clientName = String((c.customAttributes?.clientName as string | undefined) || c.clientId || "").toLowerCase();
    const matchesSearch = name.includes(query) || clientName.includes(query);
    const matchesStatus = filterStatus === "all" || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Campaigns</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage influencer marketing campaigns
          </p>
        </div>
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-gradient-to-r from-primary to-accent text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>New Campaign</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateCampaign} className="space-y-4 mt-4">
              {newError && (
                <div className="flex gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{newError}</span>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="camp-name">Campaign Name *</Label>
                <Input
                  id="camp-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Summer 2026 Campaign"
                  required
                  disabled={newCreating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="camp-client">Client ID (optional)</Label>
                <Input
                  id="camp-client"
                  value={newClientId}
                  onChange={(e) => setNewClientId(e.target.value)}
                  placeholder="Client identifier"
                  disabled={newCreating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="camp-brief">Brief (optional)</Label>
                <textarea
                  id="camp-brief"
                  value={newBrief}
                  onChange={(e) => setNewBrief(e.target.value)}
                  placeholder="Campaign brief and objectives..."
                  disabled={newCreating}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px] resize-y"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline" disabled={newCreating}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  disabled={newCreating || !newName.trim()}
                  className="bg-gradient-to-r from-primary to-accent text-white"
                >
                  {newCreating ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
                  ) : (
                    "Create Campaign"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex items-center gap-2">
              <Search className="w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0"
              />
            </div>
            <div className="flex gap-2">
              {["all", "active", "draft", "completed"].map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus(status)}
                  className={
                    filterStatus === status
                      ? "bg-primary text-white"
                      : "capitalize"
                  }
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading campaigns…</p>}

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filtered.map((campaign, idx) => (
          <Link key={campaign.id} to={`/campaigns/${campaign.id}`}>
            <Card className="p-6 hover:shadow-lg transition-shadow hover:border-primary/50 cursor-pointer group">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent opacity-80 group-hover:opacity-100 transition"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    />
                    <div>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition">
                        {campaign.name || "Untitled campaign"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {(campaign.customAttributes?.clientName as string | undefined) || campaign.clientId || "No client assigned"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Budget</p>
                        <p className="font-semibold text-foreground">{campaign.budget || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Duration</p>
                        <p className="font-semibold text-foreground text-sm">
                          {campaign.startDate ? campaign.startDate.slice(5, 7) : "--"}/
                          {campaign.startDate ? campaign.startDate.slice(8, 10) : "--"} -{" "}
                          {campaign.endDate ? campaign.endDate.slice(5, 7) : "--"}/
                          {campaign.endDate ? campaign.endDate.slice(8, 10) : "--"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Influencers</p>
                        <p className="font-semibold text-foreground">{campaign.influencers ?? 0}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Status</p>
                      <span className={`px-2 py-1 rounded text-xs font-semibold capitalize ${getStatusColor(campaign.status)}`}>
                        {(campaign.status || "draft").toLowerCase()}
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition ml-4" />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card className="p-12 text-center">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No campaigns found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your search or create a new campaign
          </p>
        </Card>
      )}
    </div>
  );
}