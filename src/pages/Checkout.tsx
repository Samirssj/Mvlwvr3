import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, QrCode, CreditCard, ExternalLink } from "lucide-react";

type Method = "yape" | "yape_qr" | "paypal_link" | "paypal_qr";

export default function Checkout() {
  const { toast } = useToast();
  const [method, setMethod] = useState<Method>("yape");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Yape (número + código de aprobación)
  const [yapeNumber, setYapeNumber] = useState("");
  const [yapeApproval, setYapeApproval] = useState("");

  // PayPal: enlace fijo del usuario (según tu indicación)
  const PAYPAL_LINK = "https://paypal.me/SamirRojasTamara";

  // Precio (por ahora estático S/ 29.90; i18n/moneda en paso de precios)
  const amount = 29.9;
  const currency = "PEN";

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const submit = async () => {
    if (!userId) {
      toast({ variant: "destructive", title: "Debes iniciar sesión para pagar." });
      return;
    }

    // Validaciones mínimas por método
    if (method === "yape" && (!yapeNumber || !yapeApproval)) {
      toast({ variant: "destructive", title: "Completa Yape: número y código de aprobación." });
      return;
    }
    // PayPal link/qr no requieren inputs adicionales

    setLoading(true);
    try {
      const payment_details: Record<string, any> = {};
      if (method === "yape") {
        payment_details.yape_number = yapeNumber;
        payment_details.approval_code = yapeApproval;
      } else if (method === "yape_qr") {
        payment_details.qr = true; // marcador; el QR se muestra en UI
      } else if (method === "paypal_link") {
        payment_details.link = PAYPAL_LINK;
      } else if (method === "paypal_qr") {
        payment_details.link = PAYPAL_LINK;
        payment_details.qr = true;
      }

      // Mapear a valores permitidos por la BD:
      const dbPaymentMethod: "yape" | "yape_qr" | "paypal" =
        method === "yape" ? "yape" :
        method === "yape_qr" ? "yape_qr" : "paypal";

      const { error } = await supabase.from("payments").insert({
        user_id: userId,
        amount,
        currency,
        payment_method: dbPaymentMethod, // usar el mapeo
        payment_details,
        is_confirmed: false,
      });

      if (error) throw error;

      toast({
        title: "Pago registrado",
        description:
          "Tu pago ha sido registrado. El administrador podrá confirmarlo. Alternativamente, se confirmará automáticamente en ~1 minuto.",
      });

      // Intentar disparar función de autocheck (opcional, si la tienes desplegada)
      try {
        await fetch("/functions/v1/auto-confirm", { method: "POST" });
      } catch {
        // ignorar si no está desplegada aún
      }
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
          Precio: <strong>S/ 29.90</strong> al mes. Se activará cuando el pago sea confirmado.
        </p>

        <Card className="p-6 bg-card border-border space-y-4">
          <div>
            <Label className="mb-2 block">Método de pago</Label>
            <RadioGroup value={method} onValueChange={(v) => setMethod(v as Method)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yape" id="yape" />
                <Label htmlFor="yape" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" /> Yape (número + código)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yape_qr" id="yape_qr" />
                <Label htmlFor="yape_qr" className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" /> Yape QR
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="paypal_link" id="paypal_link" />
                <Label htmlFor="paypal_link" className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" /> PayPal Link (paypal.me)
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

          {method === "yape" && (
            <div className="grid gap-3">
              <div>
                <Label>Número Yape</Label>
                <Input
                  placeholder="999 999 999"
                  value={yapeNumber}
                  onChange={(e) => setYapeNumber(e.target.value)}
                />
              </div>
              <div>
                <Label>Código de aprobación</Label>
                <Input
                  placeholder="ABC123"
                  value={yapeApproval}
                  onChange={(e) => setYapeApproval(e.target.value)}
                />
              </div>
            </div>
          )}

          {method === "yape_qr" && (
            <div className="space-y-2">
              <Label>Escanea este QR en tu app de Yape</Label>
              <div className="aspect-square w-60 border border-border rounded-md overflow-hidden">
                {/* Sustituye por un QR real generado con tu número/monto */}
                <img src="/placeholder.svg" className="w-full h-full object-cover" alt="QR Yape" />
              </div>
              <p className="text-xs text-muted-foreground">Monto: S/ 29.90</p>
            </div>
          )}

          {method === "paypal_link" && (
            <div className="space-y-2">
              <Label>Tu enlace PayPal</Label>
              <div className="flex items-center gap-2">
                <Input readOnly value={PAYPAL_LINK} />
                <a
                  href={PAYPAL_LINK}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 text-sm rounded-md border border-border hover:bg-secondary"
                >
                  Abrir
                </a>
              </div>
              <p className="text-xs text-muted-foreground">Comparte este enlace para pagos directos.</p>
            </div>
          )}

          {method === "paypal_qr" && (
            <div className="space-y-2">
              <Label>Escanea este QR con PayPal</Label>
              <div className="aspect-square w-60 border border-border rounded-md overflow-hidden">
                {/* Sustituye por un QR generado para tu enlace PAYPAL_LINK */}
                <img src="/placeholder.svg" className="w-full h-full object-cover" alt="QR PayPal" />
              </div>
              <p className="text-xs text-muted-foreground break-all">Enlace: {PAYPAL_LINK}</p>
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
            También existe una confirmación automática simulada que aprueba pagos después de ~1 minuto.
            Al confirmarse, tu plan se activará por 1 mes.
          </p>
        </Card>
      </div>
    </div>
  );
}