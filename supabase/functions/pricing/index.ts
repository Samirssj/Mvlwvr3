// @ts-nocheck
// Edge Function: pricing
// Returns { amount, currency, country }
// Rule: if country === 'PE' => PEN 29.90, else USD 7.99
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

  // Try to detect country from headers (Vercel / proxies)
  const countryHeader = req.headers.get("x-vercel-ip-country") || req.headers.get("x-country") || "PE";
  const country = (countryHeader || "PE").toUpperCase();

  let amount = 7.99;
  let currency = "USD";
  if (country === "PE") {
    amount = 29.9;
    currency = "PEN";
  }

  return new Response(JSON.stringify({ amount, currency, country }), { status: 200, headers: cors });
});
