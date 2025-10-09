import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useMemo } from "react";

export default function PaymentSuccess() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const pid = params.get("pid");

  useEffect(() => {
    // optional: could fetch payment details if you want to show more info
  }, [pid]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-2xl">
        <Card className="p-8 text-center space-y-4 bg-card border-border">
          <div className="flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold">Pago confirmado</h1>
          <p className="text-muted-foreground">
            Tu suscripción premium ha sido activada correctamente.
            {pid ? ` (ID: ${pid})` : null}
          </p>
          <div className="pt-2">
            <Button asChild className="bg-primary hover:bg-primary/90">
              <a href="/">Ir al inicio</a>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
