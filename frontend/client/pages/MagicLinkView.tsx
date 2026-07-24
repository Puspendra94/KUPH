import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiRequest } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Loader2, AlertCircle, CheckCircle2, Building2, Calendar, Users } from "lucide-react";

export default function MagicLinkView() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Invalid magic link token.");
      setLoading(false);
      return;
    }

    const loadCampaignMagic = async () => {
      try {
        const res = await apiRequest<any>(`/public/campaigns/magic/${token}`);
        setData(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to resolve campaign magic link");
      } finally {
        setLoading(false);
      }
    };

    void loadCampaignMagic();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full p-6 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Access Link Expired</h2>
          <p className="text-sm text-muted-foreground">{error || "This magic link is invalid or has expired."}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-primary uppercase">Client Portal</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mt-1">{data.name || "Campaign Portal"}</h1>
        </div>
        <div className="px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-xs font-semibold uppercase">
          LIVE STATUS
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground font-medium">Target Audience</p>
          <p className="text-lg font-bold text-foreground mt-1">{data.targetAudience || "General"}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground font-medium">Shortlisted Creators</p>
          <p className="text-lg font-bold text-foreground mt-1">{data.deals?.length || 0} Deals</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground font-medium">Status</p>
          <p className="text-lg font-bold text-primary capitalize mt-1">{data.status || "Active"}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Deals & Creator Shortlist</h3>
        {(!data.deals || data.deals.length === 0) ? (
          <p className="text-sm text-muted-foreground">No creator deals attached to this campaign yet.</p>
        ) : (
          <div className="space-y-3">
            {data.deals.map((deal: any) => (
              <div key={deal.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <p className="font-semibold text-foreground">{deal.influencer?.name || "Influencer"}</p>
                  <p className="text-xs text-muted-foreground">Stage: {deal.stage}</p>
                </div>
                <span className="text-sm font-bold text-primary">${deal.budget || 0}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
