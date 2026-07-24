import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useKeycloakAuth } from "@/lib/keycloak-auth";
import { apiRequest } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Users,
  CreditCard,
  Activity,
  AlertTriangle,
  Plus,
  Copy,
  Trash2,
  Check,
  Loader2,
} from "lucide-react";

export default function Settings() {
  const { user, token, logout } = useKeycloakAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");

  const [agencyName, setAgencyName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("KUPH-2026-ABC123");
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [currentSub, setCurrentSub] = useState<any>(null);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteSent, setInviteSent] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (!token) return;

    const loadSettingsData = async () => {
      try {
        const [agencyRes, membersRes, plansRes, currentSubRes, activityRes] =
          await Promise.allSettled([
            apiRequest<any>("/agency/me", { token }),
            apiRequest<any[]>("/agency/members", { token }),
            apiRequest<any[]>("/subscription/plans", { token }),
            apiRequest<any>("/subscription/current", { token }),
            apiRequest<any[]>("/agency/activity-log", { token }),
          ]);

        if (agencyRes.status === "fulfilled" && agencyRes.value) {
          setAgencyName(agencyRes.value.name || "My Agency");
          if (agencyRes.value.id) setInviteCode(`KUPH-${agencyRes.value.id.slice(0, 8).toUpperCase()}`);
        }

        if (membersRes.status === "fulfilled" && Array.isArray(membersRes.value)) {
          setTeamMembers(membersRes.value);
        }

        if (plansRes.status === "fulfilled" && Array.isArray(plansRes.value)) {
          setPlans(plansRes.value);
        }

        if (currentSubRes.status === "fulfilled" && currentSubRes.value) {
          setCurrentSub(currentSubRes.value);
        }

        if (activityRes.status === "fulfilled" && Array.isArray(activityRes.value)) {
          setActivityLogs(activityRes.value);
        }
      } catch (err) {
        console.error("Failed to load settings data", err);
      } finally {
        setLoading(false);
      }
    };

    void loadSettingsData();
  }, [token]);

  const handleSaveProfile = async () => {
    if (!token || !agencyName) return;
    try {
      await apiRequest("/agency/me", {
        method: "PUT",
        token,
        body: JSON.stringify({ name: agencyName }),
        headers: { "Content-Type": "application/json" },
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save agency profile", err);
    }
  };

  const handleSendInvite = async () => {
    if (!token || !inviteEmail) return;
    try {
      await apiRequest("/agency/invite", {
        method: "POST",
        token,
        body: JSON.stringify({ email: inviteEmail }),
        headers: { "Content-Type": "application/json" },
      });
      setInviteSent(true);
      setInviteEmail("");
      setTimeout(() => setInviteSent(false), 3000);
    } catch (err) {
      console.error("Failed to send invite", err);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account and preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="profile" className="flex gap-2">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="team" className="flex gap-2">
            <Users className="w-4 h-4" />
            Team
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex gap-2">
            <CreditCard className="w-4 h-4" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex gap-2">
            <Activity className="w-4 h-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="danger" className="flex gap-2">
            <AlertTriangle className="w-4 h-4" />
            Danger
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Profile Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Agency Name
                </label>
                <Input
                  type="text"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                {savedSuccess && (
                  <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                    <Check className="w-4 h-4" /> Agency profile saved!
                  </span>
                )}
                <Button onClick={handleSaveProfile} className="bg-primary text-white ml-auto">
                  Save Changes
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Team Members
            </h3>

            <div className="space-y-4 mb-6">
              {teamMembers.length === 0 ? (
                <div className="p-4 border border-border rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{user?.email}</p>
                    <p className="text-sm text-muted-foreground">Primary Admin</p>
                  </div>
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded text-xs font-semibold uppercase">
                    ADMIN
                  </span>
                </div>
              ) : (
                teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-foreground">{member.user?.email || member.email || user?.email}</p>
                      <p className="text-sm text-muted-foreground">
                        {member.role || "ADMIN"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-primary/10 text-primary rounded text-xs font-semibold capitalize">
                        {member.role || "ADMIN"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-border pt-6">
              <h4 className="font-semibold text-foreground mb-4">Invite Member</h4>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@example.com"
                    className="mt-1"
                  />
                </div>
                <div className="flex items-center justify-between">
                  {inviteSent && (
                    <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                      <Check className="w-4 h-4" /> Invitation sent!
                    </span>
                  )}
                  <Button onClick={handleSendInvite} className="bg-accent text-white flex gap-2 ml-auto">
                    <Plus className="w-4 h-4" />
                    Send Invite
                  </Button>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-6 mt-6">
              <h4 className="font-semibold text-foreground mb-4">
                Invite Code (Share with others)
              </h4>
              <div className="flex gap-2">
                <Input value={inviteCode} disabled className="font-mono" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigator.clipboard.writeText(inviteCode)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-4">
          <Card className="p-6 mb-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Current Plan
            </h3>
            <div className="p-4 border border-primary bg-primary/5 rounded-lg">
              <p className="text-sm text-muted-foreground">Current Plan</p>
              <p className="text-2xl font-bold text-foreground">{currentSub?.planName || "Pro"}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {currentSub?.price || "$199/month"} - Renews on {currentSub?.renewalDate || "July 15, 2026"}
              </p>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`p-6 ${
                  plan.current ? "border-primary border-2" : ""
                }`}
              >
                <h4 className="text-lg font-semibold text-foreground">
                  {plan.name}
                </h4>
                <p className="text-2xl font-bold text-primary mt-2">
                  {plan.price}
                </p>
                <ul className="mt-4 space-y-2">
                  {plan.features?.map((feature: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground">
                      ✓ {feature}
                    </li>
                  ))}
                </ul>
                {plan.current ? (
                  <Button disabled className="w-full mt-4">
                    Current Plan
                  </Button>
                ) : (
                  <Button className="w-full mt-4 bg-primary text-white">
                    Upgrade
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Activity Log
            </h3>
            <div className="space-y-4">
              {activityLogs.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No recent activity recorded yet.
                </div>
              ) : (
                activityLogs.map((item, i) => (
                  <div
                    key={item.id || i}
                    className="flex items-center justify-between p-3 border-b border-border last:border-0"
                  >
                    <div>
                      <p className="text-foreground text-sm font-medium">{item.action}</p>
                      <p className="text-xs text-muted-foreground">{item.entityType}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleTimeString()}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Danger Tab */}
        <TabsContent value="danger" className="space-y-4">
          <Card className="p-6 border-destructive/20 bg-destructive/5">
            <h3 className="text-lg font-semibold text-destructive mb-4">
              Danger Zone
            </h3>
            <div className="space-y-4">
              <div className="p-4 border border-destructive/20 rounded-lg">
                <p className="font-medium text-foreground mb-2">Delete Account</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Permanently delete your account and all associated data. This
                  cannot be undone.
                </p>
                <Button variant="destructive">Delete Account</Button>
              </div>

              <div className="p-4 border border-destructive/20 rounded-lg">
                <p className="font-medium text-foreground mb-2">Leave Agency</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Leave this agency and remove yourself from all campaigns.
                </p>
                <Button variant="outline" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
