import { useEffect, useState } from "react";

import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, QrCode } from "lucide-react";

type Method = "yape_qr" | "paypal_qr";


export default function Checkout() {
  const { toast } = useToast();
  const [method, setMethod] = useState<Method>("yape_qr");

  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Precio por país desde Edge Function pricing
  const [amount, setAmount] = useState<number>(29.9);
  const [currency, setCurrency] = useState<string>("PEN");
  const [country, setCountry] = useState<string>("PE");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    fetch("/functions/v1/pricing")
      .then(response => response.json())
      .then(data => {
        setAmount(data.amount);
        setCurrency(data.currency);
        setCountry(data.country);
      });
  }, []);

  const submit = async () => {
    if (!userId) {
      toast({ variant: "destructive", title: "Debes iniciar sesión para pagar." });
      return;
    }

    setLoading(true);
    try {
      const payment_details: Record<string, any> = { country };

      // Mapear a valores permitidos por la BD:
      const dbPaymentMethod: "yape" | "yape_qr" | "paypal" = method === "yape_qr" ? "yape_qr" : "paypal";

      const { data, error } = await supabase.from("payments").insert({
        user_id: userId,
        amount,
        currency,
        payment_method: dbPaymentMethod, // usar el mapeo
        payment_details,
        is_confirmed: false,
      }).select("id").single();

      if (error) throw error;

      toast({
        title: "Pago registrado",
        description: "Hemos notificado al administrador para confirmar tu pago.",
      });

      // Notificar al admin por correo con link de confirmación
      try {
        await fetch("/functions/v1/notify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId: data.id }),
        });
      } catch {}
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error al registrar pago", description: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-2xl space-y-6">
        <h1 className="text-3xl font-bold">Suscripción Premium</h1>
        <p className="text-muted-foreground">
          Precio: <strong>{currency === 'PEN' ? `S/ ${amount.toFixed(2)}` : `$ ${amount.toFixed(2)} ${currency}`}</strong> al mes. Se activará cuando el pago sea confirmado.
        </p>
        <Card className="p-6 bg-card border-border space-y-4">
          <div>
            <Label className="mb-2 block">Método de pago</Label>
            <RadioGroup value={method} onValueChange={(v) => setMethod(v as Method)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yape_qr" id="yape_qr" />
                <Label htmlFor="yape_qr" className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" /> Yape QR
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="paypal_qr" id="paypal_qr" />
                <Label htmlFor="paypal_qr" className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" /> PayPal QR
                </Label>
              </div>
            </RadioGroup>
          </div>

          {method === "yape_qr" && (
            <div className="space-y-2">
              <Label>Escanea este QR en tu app de Yape</Label>
              <div className="aspect-square w-60 border border-border rounded-md overflow-hidden">
                <img src="/Qr-Yape.svg" className="w-full h-full object-cover" alt="QR Yape" />
              </div>
              <p className="text-xs text-muted-foreground">Monto: {currency === 'PEN' ? `S/ ${amount.toFixed(2)}` : `$ ${amount.toFixed(2)} ${currency}`}</p>
            </div>
          )}

          {method === "paypal_qr" && (
            <div className="space-y-2">
              <Label>Escanea este QR con PayPal</Label>
              <div className="aspect-square w-60 border border-border rounded-md overflow-hidden">
                <img src="/Qr-Paypal.svg" className="w-full h-full object-cover" alt="QR PayPal" />
              </div>
              <p className="text-xs text-muted-foreground">Monto: {currency === 'PEN' ? `S/ ${amount.toFixed(2)}` : `$ ${amount.toFixed(2)} ${currency}`}</p>
            </div>
          )}

          <div className="pt-2">
            <Button onClick={submit} disabled={loading} className="bg-primary hover:bg-primary/90 glow-effect w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Procesando...
                </>
              ) : (
                "Registrar pago"
              )}
            </Button>
          </div>
        </Card>

        <Card className="p-4 bg-card border-border">
          <p className="text-sm text-muted-foreground">
            Tras registrar el pago, el administrador recibirá una notificación para confirmar manualmente.
            Al confirmarse, tu plan se activará por 1 mes.
          </p>
        </Card>
      </div>
    </div>
  );
}