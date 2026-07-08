# وافل الجو — نظام نقاط البيع

تطبيق موبايل متكامل لإدارة المبيعات لمحل وافل/بنكيك. مبني بـ **Expo (React Native)** والبيانات تُخزَّن في **Google Sheets** عبر **Google Apps Script**.

---

## 🏗️ هيكل المشروع

```
waffle-pos/
├── app/
│   ├── _layout.tsx          # Root layout + providers
│   ├── index.tsx            # Auth redirect
│   ├── login.tsx            # شاشة الدخول
│   ├── (user)/              # شاشات الموظف (3 تابز)
│   │   ├── sales.tsx        # شاشة البيع الرئيسية
│   │   ├── dashboard.tsx    # مبيعات اليوم
│   │   └── profile.tsx      # الحساب + إنهاء الوردية
│   └── (admin)/             # شاشات المدير (4 تابز)
│       ├── index.tsx        # لوحة التحكم
│       ├── audit.tsx        # سجل كامل المبيعات
│       ├── prices.tsx       # إدارة الأسعار
│       └── settings.tsx     # الإعدادات + إضافة موظفين
├── components/              # CountdownTimer, OrderCard, StatCard, OfflineBanner
├── constants/colors.ts      # نظام الألوان (قهوي/وافل)
├── context/                 # Auth, Network, Prices, Orders
├── hooks/                   # useColors, usePolling
├── assets/images/           # أيقونات التطبيق
├── gas/
│   └── Code.gs              # Google Apps Script Backend
├── .github/workflows/
│   └── build.yml            # GitHub Actions → APK
├── app.json
├── eas.json
└── package.json
```

---

## ⚙️ إعداد الـ Backend (Google Apps Script)

**خطوة واحدة قبل تشغيل التطبيق:**

1. **أنشئ Google Sheet جديداً** (أي اسم تريد).
2. افتح **Extensions → Apps Script**.
3. احذف كل المحتوى والصق محتوى ملف `gas/Code.gs`.
4. اضغط **Save** ثم **Run → Run function → `setupSheets`** (سيُطلب منك إذن الوصول — اقبله).
5. افتح **Deploy → New deployment**:
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - اضغط **Deploy** → انسخ الـ URL.
6. الصق هذا الـ URL في التطبيق (شاشة الدخول → إعداد رابط النظام).

**بيانات المدير الافتراضية (غيّرها فوراً):**
- البريد: `admin@waffle.sa`
- كلمة المرور: `Admin@1234`

---

## 📱 تشغيل التطبيق محلياً

```bash
# تثبيت المكتبات
npm install

# تشغيل على محاكي أندرويد
npm run android

# أو تشغيل على جهاز حقيقي عبر Expo Go
npx expo start
```

---

## 🤖 Build APK تلقائياً عبر GitHub Actions

### المتطلبات:

1. **EXPO_TOKEN** — احصل عليه من [expo.dev](https://expo.dev) → Account Settings → Access Tokens.
2. أضفه في GitHub: **Settings → Secrets → Actions → New repository secret** باسم `EXPO_TOKEN`.

### التشغيل:

- كل **push إلى main** يُطلق الـ workflow تلقائياً.
- أو شغّله يدوياً من **Actions → Build Android APK → Run workflow**.
- الـ APK يظهر في **Actions → اختر الـ run → Artifacts → waffle-app-[رقم]**.

---

## ✨ المميزات

### شاشة الموظف
- **وضع التصفح**: عرض الأسعار قبل بدء الوردية
- **شاشة البيع**: اختيار المنتج (وافل/بنكيك) + الكمية + ملاحظات
- **عداد 5 ثوانٍ** قبل تأكيد كل بيع (مع إمكانية الإلغاء)
- **مبيعاتي**: عرض وإلغاء مبيعات اليوم

### لوحة المدير
- **إحصائيات** بالإيرادات والمبيعات (اليوم / الأسبوع / الشهر)
- **من يعمل الآن** — الورديات النشطة
- **سجل كامل** مع بحث وفلترة
- **تحكم بالأسعار** — يصل لكل الموظفين فوراً
- **إضافة موظفين** جدد من داخل التطبيق

### Offline-First
- كل المبيعات تُحفظ محلياً فوراً
- تُزامَن مع Google Sheets عند الاتصال
- شريط تحذيري عند انقطاع الإنترنت
- إعادة محاولة تلقائية كل 60 ثانية

---

## 🛡️ ملاحظات أمان

- بيانات الدخول تُرسَل عبر **POST body** (ليس URL params).
- كلمات المرور مخزَّنة بنص صريح في الـ Sheets — يُنصح بتغييرها بانتظام.
- لمزيد من الأمان: أضف `ADMIN_SECRET` header في الـ GAS وتحقق منه في كل `doPost`.

---

## 📄 الترخيص

مشروع خاص — جميع الحقوق محفوظة.
