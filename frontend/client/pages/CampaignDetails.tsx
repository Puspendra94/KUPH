import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  Link as LinkIcon,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useKeycloakAuth } from "@/lib/keycloak-auth";
import { apiRequest } from "@/lib/api";

interface CampaignDetail {
  id: string;
  name: string;
  clientId?: string;
  brief?: string;
  status: string;
  createdAt: string;
  agencyId?: string;
  client?: { id: string; name?: string };
  shortlist?: Array<{
    id: string;
    influencerId: string;
    pitchStatus: string;
    influencer?: { name: string };
  }>;
  deals?: Array<{
    id: string;
    influencerId: string;
    workflowStatus: string;
    fee?: number;
    influencer?: { name: string; customAttributes?: Record<string, unknown> };
  }>;
}

export default function CampaignDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useKeycloakAuth();
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCampaign = async () => {
      if (!token || !id) return;
      try {
        const data = await apiRequest<CampaignDetail>(`/campaigns/${id}`, { token });
        setCampaign(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load campaign");
      } finally {
        setLoading(false);
      }
    };

    void loadCampaign();
  }, [token, id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="p-6">
        <Button variant="ghost" className="mb-4 -ml-2" onClick={() => navigate("/campaigns")}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Campaigns
        </Button>
        <Card className="p-12 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-foreground font-medium">Failed to load campaign</p>
          <p className="text-sm text-muted-foreground mt-1">{error || "Campaign not found"}</p>
        </Card>
      </div>
    );
  }

  const shortlist = campaign.shortlist || [];
  const deals = campaign.deals || [];
  const clientName = campaign.client?.name || campaign.clientId || "Unknown client";
  const shortlistCount = shortlist.length;
  const dealsClosed = deals.filter((d) => d.workflowStatus === "approved" || d.workflowStatus === "Active").length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" className="mb-4 -ml-2" onClick={() => navigate("/campaigns")}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Campaigns
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{campaign.name}</h1>
            <p className="text-muted-foreground mt-2">{clientName}</p>
            {campaign.brief && (
              <p className="text-sm text-muted-foreground mt-2">{campaign.brief}</p>
            )}
          </div>
          <span className={`px-4 py-2 rounded-lg font-semibold text-sm ${
            campaign.status === "Active" ? "bg-green-100 text-green-800" :
            campaign.status === "Completed" ? "bg-blue-100 text-blue-800" :
            "bg-gray-100 text-gray-800"
          }`}>
            {campaign.status || "Draft"}
          </span>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Influencers</p>
            <p className="text-xl font-bold text-foreground">{shortlistCount}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Deals</p>
            <p className="text-xl font-bold text-foreground">{deals.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Deals Closed</p>
            <p className="text-xl font-bold text-foreground">{dealsClosed}</p>
          </Card>
        </div>
      </div>

      {/* Workflow Tabs */}
      <Tabs defaultValue="shortlist" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="shortlist">Shortlist</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
        </TabsList>

        {/* Tab 1: Shortlist */}
        <TabsContent value="shortlist">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Influencer Shortlist</h3>
              <Button size="sm" className="bg-gradient-to-r from-primary to-accent text-white">
                <LinkIcon className="w-4 h-4 mr-2" />
                Generate Magic Link
              </Button>
            </div>

            {shortlist.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No influencers shortlisted yet</p>
            ) : (
              <div className="space-y-4">
                {shortlist.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary" />
                      <div>
                        <p className="font-semibold text-foreground">
                          {item.influencer?.name || item.influencerId || "Unknown"}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      item.pitchStatus === "approved" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {item.pitchStatus || "pending"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Tab 2: Deals */}
        <TabsContent value="deals">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">Deal Workflow</h3>

            {deals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No deals yet</p>
            ) : (
              <div className="space-y-4">
                {deals.map((deal) => (
                  <Card key={deal.id} className="p-4 border-l-4 border-l-primary">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {deal.workflowStatus === "approved" || deal.workflowStatus === "Active" ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : deal.workflowStatus === "negotiating" ? (
                            <Clock className="w-5 h-5 text-blue-600" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-gray-600" />
                          )}
                          <p className="font-semibold text-foreground">
                            {deal.influencer?.name || deal.influencerId || "Unknown"}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">{deal.workflowStatus || "pending"}</p>
                        {deal.fee && <p className="text-sm font-semibold text-accent mt-2">Fee: ${deal.fee.toLocaleString()}</p>}
                      </div>
                      <Button variant="outline" size="sm">Update</Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Tab 3: Assets */}
        <TabsContent value="assets">
          <Card className="p-12 text-center">
            <div className="w-12 h-12 bg-muted rounded-lg mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">📁</span>
            </div>
            <p className="text-foreground font-medium">No assets uploaded yet</p>
            <p className="text-muted-foreground text-sm mt-2">Upload campaign assets and media files here</p>
            <Button className="mt-4 bg-gradient-to-r from-primary to-accent text-white">Upload Asset</Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}