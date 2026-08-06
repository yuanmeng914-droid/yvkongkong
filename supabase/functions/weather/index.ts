// Supabase Edge Function: weather
// Set QWEATHER_KEY in Supabase Secrets before deploying.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "GET") {
    return json({ error: "method_not_allowed" }, 405);
  }

  try {
    const requestUrl = new URL(request.url);
    const city = requestUrl.searchParams.get("city")?.trim();
    const apiKey = Deno.env.get("QWEATHER_KEY")?.trim();
    const apiHost = Deno.env.get("QWEATHER_API_HOST")?.trim();

    if (!city) return json({ error: "city_required" }, 400);
    if (!apiKey || !apiHost) return json({ error: "weather_not_configured" }, 500);

    const baseUrl = normalizeApiHost(apiHost);

    const geoUrl = new URL(`${baseUrl}/geo/v2/city/lookup`);
    geoUrl.searchParams.set("location", city);
    geoUrl.searchParams.set("lang", "zh");
    console.log("weather geo request", redactUrl(geoUrl));

    const providerHeaders = { "X-QW-Api-Key": apiKey, Accept: "application/json" };
    const geoResponse = await fetch(geoUrl, { headers: providerHeaders });
    const geoText = await geoResponse.text();
    console.log("weather geo response", {
      status: geoResponse.status,
      body: geoText,
    });

    if (!geoResponse.ok) return json({ error: "weather_provider_unavailable" }, 502);

    const geo = parseJson(geoText);
    if (!geo || geo.code !== "200") {
      const cityNotFound = geo?.code === "404";
      return json(
        { error: cityNotFound ? "city_not_found" : "weather_provider_unavailable" },
        cityNotFound ? 404 : 502,
      );
    }

    const location = geo.location?.[0];
    if (!location?.id) return json({ error: "city_not_found" }, 404);

    const weatherUrl = new URL(`${baseUrl}/v7/weather/now`);
    weatherUrl.searchParams.set("location", location.id);
    weatherUrl.searchParams.set("lang", "zh");
    console.log("weather now request", redactUrl(weatherUrl));

    const weatherResponse = await fetch(weatherUrl, { headers: providerHeaders });
    const weatherText = await weatherResponse.text();
    console.log("weather now response", {
      status: weatherResponse.status,
      body: weatherText,
    });

    if (!weatherResponse.ok) return json({ error: "weather_provider_unavailable" }, 502);

    const weather = parseJson(weatherText);
    if (!weather || weather.code !== "200") {
      return json({ error: "weather_provider_unavailable" }, 502);
    }

    return json({
      city: location.name || city,
      now: {
        text: weather.now?.text || "",
        temp: weather.now?.temp || "",
        icon: weather.now?.icon || "",
      },
      hint: "天气只负责路过，不负责安排你。",
    });
  } catch (error) {
    console.error("weather function failed", error);
    return json({ error: "weather_request_failed" }, 500);
  }
});

function redactUrl(url: URL) {
  const safe = new URL(url);
  if (safe.searchParams.has("key")) safe.searchParams.set("key", "[REDACTED]");
  return safe.toString();
}

function normalizeApiHost(value: string) {
  const host = value.replace(/\/+$/, "");
  return /^https?:\/\//i.test(host) ? host : `https://${host}`;
}

function parseJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error("weather provider returned invalid JSON", { text, error });
    return null;
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}
