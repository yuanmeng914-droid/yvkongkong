// Supabase Edge Function: weather
// 部署后在 Supabase Secrets 中设置 QWEATHER_KEY，前端只填写函数地址。
// 参考：https://dev.qweather.com/docs/api/

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = new URL(request.url);
    const city = url.searchParams.get("city")?.trim();
    const key = Deno.env.get("QWEATHER_KEY");
    if (!city || !key) return json({ error: "weather_not_configured" }, 400);

    const geoResponse = await fetch(`https://geoapi.qweather.com/geo/v2/city/lookup?location=${encodeURIComponent(city)}&key=${encodeURIComponent(key)}`);
    if (!geoResponse.ok) return json({ error: "weather_provider_unavailable" }, 502);
    const geo = await geoResponse.json();
    const location = geo.location?.[0];
    if (!location?.id) return json({ error: "city_not_found" }, 404);

    const weatherResponse = await fetch(`https://devapi.qweather.com/v7/weather/now?location=${location.id}&key=${encodeURIComponent(key)}`);
    if (!weatherResponse.ok) return json({ error: "weather_provider_unavailable" }, 502);
    const weather = await weatherResponse.json();
    return json({
      city: location.name,
      now: { text: weather.now?.text, temp: weather.now?.temp, icon: weather.now?.icon },
      hint: "天气只负责路过，不负责安排你。",
    });
  } catch {
    return json({ error: "weather_request_failed" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
