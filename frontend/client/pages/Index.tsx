import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Zap, Users, TrendingUp, Sparkles } from "lucide-react";

export default function Index() {
  const features = [
    {
      icon: Users,
      title: "Influencer Management",
      description: "Build and manage your influencer database with custom attributes",
    },
    {
      icon: TrendingUp,
      title: "Campaign Analytics",
      description: "Track campaign performance with real-time KPI dashboards",
    },
    {
      icon: Zap,
      title: "Deal Workflow",
      description: "Streamline negotiations with granular workflow status tracking",
    },
    {
      icon: Sparkles,
      title: "Brand Collaboration",
      description: "Share shortlists with brands and manage approvals seamlessly",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              KUPH
            </span>
          </div>
          <div className="flex gap-3">
            <Link to="/login">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button className="bg-gradient-to-r from-primary to-accent text-white">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center space-y-8">
            <div className="inline-block">
              <div className="px-4 py-2 border border-primary/20 bg-primary/5 rounded-full">
                <p className="text-sm font-semibold text-primary">
                  ✨ The Modern Influencer Marketing Platform
                </p>
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
              Scale Your Influencer{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Marketing Campaigns
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Manage influencers, clients, and campaigns in one platform. Build
              stronger partnerships and close more deals with our intuitive
              workflow system.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="bg-gradient-to-r from-primary to-accent text-white">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button size="lg" variant="outline">
                Watch Demo
              </Button>
            </div>

            {/* Social proof */}
            <div className="pt-12 border-t border-border">
              <p className="text-sm text-muted-foreground mb-4">
                Trusted by leading agencies
              </p>
              <div className="flex items-center justify-center gap-8 flex-wrap">
                {["TechCorp", "Fashion Co", "Beauty Brands", "FoodTech"].map(
                  (brand) => (
                    <div key={brand} className="text-sm font-semibold text-muted-foreground">
                      {brand}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-32 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Everything You Need
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              Built for modern agencies managing complex influencer ecosystems
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <Card
                key={i}
                className="p-6 hover:shadow-lg transition-shadow group animate-slide-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Simple, Transparent Pricing
            </h2>
            <p className="text-muted-foreground mt-4">
              Scale your agency without breaking the bank
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Starter",
                price: "$0",
                description: "Perfect for getting started",
                features: ["5 campaigns", "100 influencers", "Basic analytics"],
              },
              {
                name: "Pro",
                price: "$199",
                description: "For growing agencies",
                features: [
                  "Unlimited campaigns",
                  "Unlimited influencers",
                  "Advanced analytics",
                  "Team collaboration",
                ],
                highlighted: true,
              },
              {
                name: "Enterprise",
                price: "Custom",
                description: "For large teams",
                features: [
                  "Everything in Pro",
                  "API access",
                  "Custom integrations",
                  "Dedicated support",
                ],
              },
            ].map((plan, i) => (
              <Card
                key={i}
                className={`p-8 ${
                  plan.highlighted ? "border-primary border-2" : ""
                } relative animate-slide-up`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-6 px-3 py-1 bg-primary text-white text-xs font-bold rounded-full">
                    POPULAR
                  </div>
                )}
                <h3 className="text-2xl font-bold text-foreground">
                  {plan.name}
                </h3>
                <p className="text-muted-foreground text-sm mt-2">
                  {plan.description}
                </p>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">
                    {plan.price}
                  </span>
                  {plan.price !== "Custom" && (
                    <span className="text-muted-foreground ml-2">/month</span>
                  )}
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="text-sm text-muted-foreground">
                      ✓ {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full mt-8 ${
                    plan.highlighted
                      ? "bg-primary text-white"
                      : "border border-border"
                  }`}
                >
                  Get Started
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-primary/5 to-accent/5 border-t border-border">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Ready to transform your agency?
          </h2>
          <p className="text-muted-foreground text-lg">
            Join agencies worldwide using KUPH to scale their influencer
            marketing operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="bg-gradient-to-r from-primary to-accent text-white">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">K</span>
              </div>
              <span className="font-bold text-sm text-foreground">KUPH</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 KUPH. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition">
                Privacy
              </a>
              <a href="#" className="hover:text-foreground transition">
                Terms
              </a>
              <a href="#" className="hover:text-foreground transition">
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
