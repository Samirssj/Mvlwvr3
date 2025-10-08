// Supabase Edge Function: confirm-payment
// Runtime: Deno (deployed with Supabase Functions)
// This function shows where to read your secrets (SendGrid + config) safely.
// Later we will extend this to confirm a payment, activate subscription, and send emails.
// NOTE: We disable TS checking in the IDE because this file runs under Deno, not Node/Vite.
// @ts-nocheck

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type ConfirmPaymentPayload = {
  paymentId?: string;
  notify?: boolean;
};

const corsHeaders: Record<string, string> = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  // Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  // READ SECRETS FROM ENV (configured in Supabase Functions → Secrets)
  const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY") ?? "";
  const EMAIL_FROM = Deno.env.get("EMAIL_FROM") ?? "";
  const EMAIL_ADMIN = Deno.env.get("EMAIL_ADMIN") ?? "";

  if (!SENDGRID_API_KEY || !EMAIL_FROM || !EMAIL_ADMIN) {
    return new Response(
      JSON.stringify({
        error:
          "Missing required secrets. Please set SENDGRID_API_KEY, EMAIL_FROM, EMAIL_ADMIN in Supabase Functions Secrets.",
      }),
      { status: 500, headers: corsHeaders }
    );
  }

  let body: ConfirmPaymentPayload;
  try {
    body = (await req.json()) as ConfirmPaymentPayload;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      message: "confirm-payment function is reachable and secrets are loaded.",
      received: body,
      emailFrom: EMAIL_FROM,
      emailAdmin: EMAIL_ADMIN,
    }),
    { status: 200, headers: corsHeaders }
  );
});
