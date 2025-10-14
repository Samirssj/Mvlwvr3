// Supabase Edge Function: confirm-payment
// Runtime: Deno (deployed with Supabase Functions)
// This function shows where to read your secrets (SendGrid + config) safely.
// Later we will extend this to confirm a payment, activate subscription, and send emails.
// NOTE: We disable TS checking in the IDE because this file runs under Deno, not Node/Vite.
// @ts-nocheck

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type ConfirmPaymentPayload = {
  paymentId?: string;
  notify?: boolean;
};

const corsHeaders: Record<string, string> = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

async function hmac(tokenSecret: string, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(tokenSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  const bytes = new Uint8Array(sig);
  // to hex
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
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
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`SendGrid error: ${t}`);
  }
}

serve(async (req: Request) => {
  // Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const CONFIRM_TOKEN_SECRET = Deno.env.get("CONFIRM_TOKEN_SECRET") ?? "";
  const FRONTEND_URL = Deno.env.get("FRONTEND_URL") ?? "";

  // READ SECRETS FROM ENV (configured in Supabase Functions → Secrets)
  const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY") ?? "";
  const EMAIL_FROM = Deno.env.get("EMAIL_FROM") ?? "";
  const EMAIL_ADMIN = Deno.env.get("EMAIL_ADMIN") ?? "";

  if (!SENDGRID_API_KEY || !EMAIL_FROM || !EMAIL_ADMIN || !SUPABASE_URL || !SERVICE_ROLE || !CONFIRM_TOKEN_SECRET) {
    return new Response(
      JSON.stringify({
        error: "Missing required secrets (SENDGRID_API_KEY, EMAIL_FROM, EMAIL_ADMIN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CONFIRM_TOKEN_SECRET)",
      }),
      { status: 500, headers: corsHeaders }
    );
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  // GET => confirm via pid/token
  if (req.method === "GET") {
    const url = new URL(req.url);
    const pid = url.searchParams.get("pid") || "";
    const token = url.searchParams.get("token") || "";
    if (!pid || !token) {
      return new Response(JSON.stringify({ error: "Missing pid or token" }), { status: 400, headers: corsHeaders });
    }
    const expected = await hmac(CONFIRM_TOKEN_SECRET, pid);
    if (expected !== token) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: corsHeaders });
    }
    // Update payment confirmed
    const { data: pay, error: perr } = await supabase.from("payments").update({ is_confirmed: true, confirmed_at: new Date().toISOString() }).eq("id", pid).select("id, user_id, amount, currency").maybeSingle();
    if (perr || !pay) {
      return new Response(JSON.stringify({ error: perr?.message || "Payment not found" }), { status: 400, headers: corsHeaders });
    }
    // Renew subscription 1 month
    const now = new Date();
    const expires = new Date();
    expires.setMonth(expires.getMonth() + 1);
    await supabase.from("subscriptions").upsert({ user_id: pay.user_id, plan: "premium", starts_at: now.toISOString(), expires_at: expires.toISOString(), is_active: true });
    await supabase.from("admin_logs").insert({ user_id: pay.user_id, action: "confirm_payment", details: { payment_id: pid } });

    // Get user email
    const { data: profile } = await supabase.from("profiles").select("email").eq("id", pay.user_id).maybeSingle();
    const toUser = profile?.email;
    // Send confirmation emails
    try {
      const expDate = expires.toISOString().slice(0,10);
      const userHtml = `
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b1220;padding:24px;color:#e5e7eb;font-family:Inter,Arial,Helvetica,sans-serif">
          <tr><td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="background:#0f172a;border:1px solid #1f2937;border-radius:12px">
              <tr><td style="padding:24px">
                <h2 style="margin:0 0 8px 0;color:#0040ff">Pago confirmado</h2>
                <p style="margin:0 0 12px 0;color:#9ca3af">Tu suscripción premium ya está activa.</p>
                <p style="margin:0 0 4px 0;color:#cbd5e1">Vigencia hasta <strong>${expDate}</strong></p>
                <p style="margin:0 0 16px 0;color:#cbd5e1">Pago: <strong>${pay.amount} ${pay.currency}</strong></p>
                <a href="${FRONTEND_URL || ""}/" style="display:inline-block;background:#0040ff;color:#ffffff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600">Ir a ver contenido</a>
              </td></tr>
            </table>
          </td></tr>
        </table>`;
      const adminHtml = `
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b1220;padding:24px;color:#e5e7eb;font-family:Inter,Arial,Helvetica,sans-serif">
          <tr><td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="background:#0f172a;border:1px solid #1f2937;border-radius:12px">
              <tr><td style="padding:24px">
                <h2 style="margin:0 0 8px 0;color:#0040ff">Pago confirmado (manual)</h2>
                <p style="margin:0 0 12px 0;color:#9ca3af">ID: ${pid}</p>
                <p style="margin:0 0 4px 0;color:#cbd5e1">Usuario: ${toUser || pay.user_id}</p>
                <p style="margin:0 0 16px 0;color:#cbd5e1">Monto: <strong>${pay.amount} ${pay.currency}</strong></p>
              </td></tr>
            </table>
          </td></tr>
        </table>`;
      if (toUser) await sendEmail(SENDGRID_API_KEY, EMAIL_FROM, toUser, "Suscripción activada", userHtml);
      await sendEmail(SENDGRID_API_KEY, EMAIL_FROM, EMAIL_ADMIN, "Pago confirmado", adminHtml);
    } catch (_) {}

    // Redirect to success page if FRONTEND_URL is configured
    if (FRONTEND_URL) {
      const location = `${FRONTEND_URL}/payment-success?pid=${encodeURIComponent(pid)}`;
      return new Response(null, { status: 302, headers: { Location: location, ...corsHeaders } });
    }
    // Fallback JSON
    return new Response(JSON.stringify({ ok: true, payment_id: pid }), { status: 200, headers: corsHeaders });
  }

  // POST => For future admin/manual flows if needed
  let body: ConfirmPaymentPayload;
  try {
    body = (await req.json()) as ConfirmPaymentPayload;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: corsHeaders });
  }
  return new Response(JSON.stringify({ ok: true, received: body }), { status: 200, headers: corsHeaders });
});
