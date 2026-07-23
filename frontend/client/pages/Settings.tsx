import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useKeycloakAuth } from "@/lib/keycloak-auth";
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
} from "lucide-react";

export default function Settings() {
  const { user, logout } = useKeycloakAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteCode] = useState("KUPH-2026-ABC123");

  const teams = [
    { id: "1", email: "user@example.com", role: "admin", joined: "2026-01-15" },
    {
      id: "2",
      email: "colleague@example.com",
      role: "member",
      joined: "2026-02-20",
    },
    {
      id: "3",
      email: "viewer@example.com",
      role: "viewer",
      joined: "2026-03-10",
    },
  ];

  const plans = [
    {
      name: "Free",
      price: "$0",
      features: ["5 campaigns", "Basic analytics", "Email support"],
      current: false,
    },
    {
      name: "Pro",
      price: "$199",
      features: ["Unlimited campaigns", "Advanced analytics", "Priority support", "Team collaboration"],
      current: true,
    },
    {
      name: "Max",
      price: "$499",
      features: ["Everything in Pro", "API access", "Custom integrations", "Dedicated account manager"],
      current: false,
    },
  ];

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
                  defaultValue="Your Agency Name"
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end">
                <Button className="bg-primary text-white">Save Changes</Button>
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
              {teams.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div>
                    <p className="font-medium text-foreground">{member.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Joined {member.joined}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded text-xs font-semibold capitalize">
                      {member.role}
                    </span>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
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
                <Button className="bg-accent text-white flex gap-2">
                  <Plus className="w-4 h-4" />
                  Send Invite
                </Button>
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
              <p className="text-2xl font-bold text-foreground">Pro</p>
              <p className="text-sm text-muted-foreground mt-1">
                $199/month - Renews on July 15, 2026
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
                  {plan.features.map((feature, i) => (
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
              {[
                { action: "Logged in", time: "2 hours ago" },
                { action: "Updated campaign", time: "1 day ago" },
                { action: "Added team member", time: "3 days ago" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 border-b border-border last:border-0"
                >
                  <p className="text-foreground text-sm">{item.action}</p>
                  <p className="text-xs text-muted-foreground">{item.time}</p>
                </div>
              ))}
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
