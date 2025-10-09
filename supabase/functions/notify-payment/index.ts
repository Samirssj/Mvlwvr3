// @ts-nocheck
// Edge Function: notify-payment
// Sends email to admin with a signed confirm link for a given paymentId
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors: Record<string, string> = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function hmac(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function sendEmail(apiKey: string, fromStr: string, to: string, subject: string, html: string) {
  const name = fromStr.replace(/<.*>/, "").trim() || "Mvlwvr3";
  const email = fromStr.match(/<(.*)>/)?.[1] || fromStr;
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email, name },
      subject,
      content: [{ type: "text/html", value: html }],
    }),
  });
  if (!res.ok) throw new Error(await res.text());
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: cors });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const CONFIRM_TOKEN_SECRET = Deno.env.get("CONFIRM_TOKEN_SECRET") ?? "";
  const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY") ?? "";
  const EMAIL_FROM = Deno.env.get("EMAIL_FROM") ?? "";
  const EMAIL_ADMIN = Deno.env.get("EMAIL_ADMIN") ?? "";
  const PROJECT_REF = Deno.env.get("PROJECT_REF") ?? ""; // optional, else derive from URL

  if (!SUPABASE_URL || !SERVICE_ROLE || !CONFIRM_TOKEN_SECRET || !SENDGRID_API_KEY || !EMAIL_FROM || !EMAIL_ADMIN) {
    return new Response(JSON.stringify({ error: "Missing required secrets" }), { status: 500, headers: cors });
  }

  const { paymentId } = await req.json();
  if (!paymentId) return new Response(JSON.stringify({ error: "paymentId required" }), { status: 400, headers: cors });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
  const { data: pay, error } = await supabase.from("payments").select("id, user_id, amount, currency, payment_method").eq("id", paymentId).maybeSingle();
  if (error || !pay) return new Response(JSON.stringify({ error: error?.message || "Payment not found" }), { status: 400, headers: cors });

  const token = await hmac(CONFIRM_TOKEN_SECRET, paymentId);
  const base = `https://${PROJECT_REF || new URL(SUPABASE_URL).host.split(".")[0]}.functions.supabase.co`;
  const link = `${base}/confirm-payment?pid=${paymentId}&token=${token}`;

  const html = `
    <h2>Nuevo pago recibido</h2>
    <p>Método: ${pay.payment_method} | Monto: ${pay.amount} ${pay.currency}</p>
    <p>Confirmar manualmente:</p>
    <p><a href="${link}" style="display:inline-block;padding:10px 16px;background:#1e293b;color:#fff;border-radius:8px;text-decoration:none">Confirmar pago</a></p>
  `;

  await sendEmail(SENDGRID_API_KEY, EMAIL_FROM, EMAIL_ADMIN, "Nuevo pago pendiente", html);
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: cors });
});
