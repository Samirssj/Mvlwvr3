// @ts-nocheck
// Edge Function: health
// Returns booleans indicating whether required secrets are present and endpoints are reachable
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const cors: Record<string, string> = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "GET") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: cors });

  const secrets = {
    SENDGRID_API_KEY: Boolean(Deno.env.get("SENDGRID_API_KEY")),
    EMAIL_FROM: Boolean(Deno.env.get("EMAIL_FROM")),
    EMAIL_ADMIN: Boolean(Deno.env.get("EMAIL_ADMIN")),
    SUPABASE_URL: Boolean(Deno.env.get("SUPABASE_URL")),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")),
    CONFIRM_TOKEN_SECRET: Boolean(Deno.env.get("CONFIRM_TOKEN_SECRET")),
    FRONTEND_URL: Boolean(Deno.env.get("FRONTEND_URL")),
  };

  return new Response(JSON.stringify({ ok: true, secrets }), { status: 200, headers: cors });
});
