import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Crown, Mail, Globe, Loader2 } from "lucide-react";
import { Session } from "@supabase/supabase-js";

export default function Profile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setSession(session);
      loadProfile(session.user.id);
    });

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          navigate("/auth");
          return;
        }
        setSession(session);
        loadProfile(session.user.id);
      }
    );

    return () => authSubscription.unsubscribe();
  }, [navigate]);

  const loadProfile = async (userId: string) => {
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      const { data: subData } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .single();

      setProfile(profileData);
      setSubscription(subData);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isPremium = subscription?.plan === "premium" && subscription?.is_active;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="h-20 w-20 rounded-full bg-gradient-electric flex items-center justify-center glow-effect">
              <User className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{profile?.full_name || "Usuario"}</h1>
              <p className="text-muted-foreground">{profile?.email}</p>
            </div>
          </div>

          {/* Subscription Card */}
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className={isPremium ? "h-6 w-6 text-primary" : "h-6 w-6 text-muted-foreground"} />
                <div>
                  <h3 className="text-lg font-semibold">
                    Plan {isPremium ? "Premium" : "Gratis"}
                  </h3>
                  {isPremium && subscription?.expires_at && (
                    <p className="text-sm text-muted-foreground">
                      Expira: {new Date(subscription.expires_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              {!isPremium && (
                <Button
                  onClick={() => navigate("/plans")}
                  className="bg-primary hover:bg-primary/90 glow-effect"
                >
                  Actualizar a Premium
                </Button>
              )}
            </div>
          </Card>

          {/* Profile Info */}
          <Card className="p-6 bg-card border-border">
            <h3 className="text-xl font-semibold mb-4">Información Personal</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Correo Electrónico</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Input
                    value={profile?.email || ""}
                    disabled
                    className="bg-secondary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>País</Label>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <Input
                    value={profile?.country_code === "PE" ? "Perú" : profile?.country_code || "No especificado"}
                    disabled
                    className="bg-secondary"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 bg-card border-border text-center">
              <p className="text-3xl font-bold text-primary">0</p>
              <p className="text-sm text-muted-foreground">Vistas esta semana</p>
            </Card>
            <Card className="p-6 bg-card border-border text-center">
              <p className="text-3xl font-bold text-primary">0</p>
              <p className="text-sm text-muted-foreground">Favoritos</p>
            </Card>
            <Card className="p-6 bg-card border-border text-center">
              <p className="text-3xl font-bold text-primary">0</p>
              <p className="text-sm text-muted-foreground">Listas</p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
