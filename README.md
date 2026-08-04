# 明日复明日

不催促、不评判。今天没做完的，明天还可以继续。

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
6. 默认开启邮箱确认时，用户需要点击邮件中的链接才能完成注册。

## 开发者反馈后台

反馈只有 `app_metadata.role = developer` 的账号可读取。请在 Supabase 服务端为开发者账号设置该字段，切勿通过前端的 `user_metadata` 授权。

## 数据与隐私

- 未登录时，任务保存在浏览器 localStorage。
- 首次登录后，本地任务自动迁移到当前账号。
- 登录后，任务通过启用了 RLS 的 Supabase 表同步。
- 反馈不会自动包含用户的待办内容。
- 删除账号采用申请流程，开发者需在后台核验后执行删除。
