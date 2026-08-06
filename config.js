// Supabase 的 publishable key 可以安全地用于浏览器；不要在这里填写 service_role key。
window.APP_CONFIG = {
  supabaseUrl: "https://hjzjheodfuxlzwdvludu.supabase.co",
  supabasePublishableKey: "sb_publishable_g8D5KhIOcrd4os5_ZUUh4w_SgJnlEK1",
  // 部署 Supabase Edge Function 后填写，例如："/functions/v1/weather"
  weatherEndpoint: "https://hjzjheodfuxlzwdvludu.supabase.co/functions/v1/weather",
  // 在 Supabase Edge Function 中使用同一组 VAPID 密钥；这里只放公开钥匙。
  pushPublicKey: "",
};
