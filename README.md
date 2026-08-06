# 明日复明日

不催促、不评判。今天没做完的，明天还可以继续。

## 2.1 功能

- 每天变化的温和文案与完成鼓励
- 未完成任务顺延后可撤回（刷新页面后短时间内仍可撤回）
- 任务可设置和编辑日期、具体时间，并在打开网站时显示站内提醒
- 重要日子、倒数日、生日/纪念日每年重复与提前提醒
- 登录字段级错误提示、反馈提交状态与短时间防重复提交
- 手机端布局与静态资源版本缓存处理
- 古典文学句子与作品出处
- PWA 安装、离线页面与通知权限基础
- 城市天气展示框架（接入天气 Edge Function 后显示真实天气）

## 本地预览

使用任意静态文件服务器打开项目，例如：

```powershell
py -m http.server 4173
```

## 启用登录与云端同步

1. 在 Supabase 创建项目。
2. 打开 SQL Editor，运行 `supabase/schema.sql`。
3. 在 Project Settings > API 中复制 Project URL 和 Publishable key。
4. 填入 `config.js`：

```js
window.APP_CONFIG = {
  supabaseUrl: "https://YOUR_PROJECT.supabase.co",
  supabasePublishableKey: "YOUR_PUBLISHABLE_KEY",
};
```

只能使用 publishable/anon key，绝不能把 `service_role` key 放入前端代码。

5. 在 Authentication > URL Configuration 中添加线上站点地址和本地地址。
6. 如果希望注册后直接登录，可在 Authentication 中关闭邮箱确认。

### 从旧版本升级

已经运行过旧版 `schema.sql` 的项目，请改为在 SQL Editor 运行一次
`supabase/upgrade-2.1.sql`。它只会增加任务提醒时间字段和“重要日子”表，
不会删除已有任务。

### 第三批配置

- `manifest.webmanifest`、`icon.svg`、`sw.js` 和 `offline.html` 用于安装与离线基础能力。
- `config.js` 的 `weatherEndpoint` 需要填写你部署的天气 Edge Function 地址；不要把天气服务密钥写进前端。
- 天气函数示例位于 `supabase/functions/weather/index.ts`，部署前在 Supabase Secrets 中设置 `QWEATHER_KEY`。

## 天气与设备推送上线

天气函数部署后，`config.js` 已使用：

`https://hjzjheodfuxlzwdvludu.supabase.co/functions/v1/weather`

在 Supabase Edge Functions 中部署 `weather`，并在 Secrets 中设置 `QWEATHER_KEY`。

设备推送还需要生成一组 VAPID 密钥。将公钥填入 `config.js` 的 `pushPublicKey`；私钥只保存到 Supabase Secrets，不要提交到 GitHub：

- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`（例如 `mailto:你的开发者邮箱`）
- `CRON_SECRET`

然后部署 `supabase/functions/push-reminders/index.ts`。在 Supabase SQL Editor 执行 `supabase/upgrade-2.1.sql`，其中包含推送订阅和通知去重表。

最后在 Supabase Cron 中每分钟调用：

`https://hjzjheodfuxlzwdvludu.supabase.co/functions/v1/push-reminders`

请求头带上 `x-cron-secret: 你的 CRON_SECRET`。用户登录后，在设置里点击“允许提醒”，浏览器才会创建设备推送订阅。
- `supabase/upgrade-2.1.sql` 同时准备了用户偏好和推送订阅表，真正的后台推送还需要配置 VAPID 密钥、Edge Function 和 Cron。
- PWA 推送在 iPhone 上需要用户先把网站添加到主屏幕，再主动允许通知。

## 开发者反馈后台

反馈只有 `app_metadata.role = developer` 的账号可读取。请在 Supabase 服务端为开发者账号设置该字段，切勿通过前端的 `user_metadata` 授权。

## 数据与隐私

- 未登录时，任务和重要日子保存在浏览器 localStorage。
- 首次登录后，本地任务自动迁移到当前账号。
- 登录后，任务与重要日子通过启用了 RLS 的 Supabase 表同步。
- 反馈不会自动包含用户的待办内容。
- 删除账号采用申请流程，开发者需在后台核验后执行删除。
