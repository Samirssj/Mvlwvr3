import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Crown, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Plans() {
  const navigate = useNavigate();

  const plans = [
    {
      name: "Gratis",
      price: "S/0",
      period: "Siempre",
      icon: Zap,
      features: [
        "Contenido básico",
        "Calidad SD",
        "Sin anuncios",
        "Sin acceso a contenido premium",
      ],
      cta: "Plan Actual",
      variant: "outline" as const,
    },
    {
      name: "Premium",
      price: "S/29.90",
      period: "al mes",
      icon: Crown,
      features: [
        "Todo el catálogo sin límites",
        "Calidad HD y 4K",
        "Sin anuncios",
        "Sin restricciones ",
        "Acceso anticipado a estrenos",
      ],
      cta: "Suscribirse Ahora",
      variant: "default" as const,
      highlighted: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Elige tu <span className="bg-gradient-electric bg-clip-text text-transparent">Plan</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Disfruta del mejor contenido sin compromisos. Cancela cuando quieras.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`p-8 ${
                  plan.highlighted
                    ? "border-primary bg-card glow-effect"
                    : "border-border bg-card"
                }`}
              >
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <plan.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-primary">{plan.price}</span>
                    <span className="text-muted-foreground">/{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${
                    plan.highlighted
                      ? "bg-primary hover:bg-primary/90 glow-effect"
                      : ""
                  }`}
                  variant={plan.variant}
                  // Antes: onClick={() => navigate("/auth?mode=signup")}
                  onClick={() => navigate("/checkout")}
                >
                  {plan.cta}
                </Button>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              * Los precios se ajustan automáticamente según tu país.
              <br />
              Métodos de pago: Yape, PayPal y más.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
