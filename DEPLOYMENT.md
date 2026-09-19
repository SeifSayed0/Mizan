# ميزان — حزمة المشروع الكاملة

هذه الحزمة تحتوي على الواجهة والسيرفر وتكامل Supabase. لا ترفع `client/index.html` وحده إذا أردت النشر والتصويت وتسجيل دخول المالك.

## التشغيل المحلي

```bash
pnpm install
pnpm dev
```

افتح الرابط الذي يظهر في الطرفية، مثل `http://localhost:3000`.

## النشر على Render أو Railway

ارفع محتويات هذا المجلد كاملًا إلى GitHub، ثم أنشئ Web Service باستخدام:

```text
Build Command: pnpm install --frozen-lockfile && pnpm build
Start Command: pnpm start
```

أضف متغيرات البيئة التالية في إعدادات الاستضافة، ولا تضعها داخل `index.html` أو GitHub:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
VITE_OAUTH_PORTAL_URL
VITE_APP_ID
OAUTH_SERVER_URL
JWT_SECRET
OWNER_OPEN_ID
```

## إعداد Supabase

افتح Supabase Dashboard ثم SQL Editor، والصق محتوى `supabase_mizan.sql` وشغّله مرة واحدة.

## ملاحظة عن Vercel

رفع ملف `client/index.html` فقط على Vercel ينشر واجهة Static، لكنه لا ينشر `/api/mizan/*`. لتشغيل كل الوظائف يجب نشر السيرفر أيضًا كـWeb Service أو تحويله إلى Serverless Functions.
