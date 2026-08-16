# 🤖 سیستم هماهنگی بات‌ها (Bot Coordination System)

## مقدمه

تمام بات‌های AI که بر روی این سایت کار می‌کنند **باید** از این سیستم هماهنگی استفاده کنند تا:
- ✅ کانفلیک‌های بروزرسانی جلوگیری شود
- ✅ هر بات از تغییرات دیگران آگاه شود
- ✅ Overwrite خودکار نشود
- ✅ تاریخچه تمام تغییرات محفوظ بماند

---

## 🔄 گردش کار (Workflow)

### مرحله 1️⃣: بررسی کانفلیک‌ها (Check for Conflicts)

**قبل از هر بروزرسانی:**

```bash
POST /api/admin/conflict-check
Content-Type: application/json

{
  "entityType": "tax_tier",          # یا: category, product, order, etc.
  "entityId": "1",
  "proposedValue": "25"
}

RESPONSE:
{
  "hasConflict": false,
  "lastChange": {
    "id": 123,
    "action": "update",
    "oldValue": "20",
    "newValue": "25",
    "changedBy": "claude-code-bot",
    "changedAt": "2026-08-16T10:30:00Z"
  },
  "message": "✅ هیچ کانفلیک وجود ندارد..."
}
```

**اگر `hasConflict: true`:**
- ⛔ نکن بروزرسانی را متوقف کنید
- 📖 آخرین تغییر را بخوانید
- 🔄 منتظر بمانید یا تغییرات را merge کنید

---

### مرحله 2️⃣: لاگ کردن تغییرات (Log Changes)

**بعد از هر بروزرسانی موفق:**

```bash
POST /api/admin/log-change
Content-Type: application/json

{
  "entityType": "tax_tier",
  "entityId": null,
  "action": "update",
  "oldValue": "20",
  "newValue": "25",
  "changedBy": "claude-code-bot"
}

RESPONSE:
{ "success": true }
```

---

### مرحله 3️⃣: اطلاع رسانی به بات‌های دیگر (Notify Other Bots)

**اختیاری - برای تغییرات مهم:**

```bash
POST /api/admin/notify-bots
Content-Type: application/json

{
  "entityType": "tax_tier",
  "entityId": null,
  "action": "update",
  "oldValue": "20",
  "newValue": "25",
  "botName": "claude-code-bot"
}

RESPONSE:
{
  "success": true,
  "notification": "🔔 تغییر ادمین: TAX_TIER...",
  "message": "✅ تمام بات‌ها مطلع شدند"
}
```

---

## 📡 خواندن تمام تغییرات (Sync Changes)

**AI Manager یا دیگر بات‌ها برای خواندن تغییرات‌نسازی‌نشده:**

```bash
GET /api/changes/sync

RESPONSE:
{
  "success": true,
  "unsynced_count": 5,
  "changes": [
    {
      "id": 1,
      "entityType": "tax_tier",
      "entityId": null,
      "action": "update",
      "oldValue": "20",
      "newValue": "25",
      "changedBy": "admin",
      "changedAt": "2026-08-16T10:00:00Z"
    },
    ...
  ]
}
```

**علامت‌گذاری تغییرات به‌عنوان خوانده‌شده:**

```bash
POST /api/changes/sync
Content-Type: application/json

{
  "changeIds": [1, 2, 3, 4, 5]
}

RESPONSE:
{
  "success": true,
  "marked_synced": 5
}
```

---

## 🚨 سناریو‌های کانفلیک

### ❌ سناریو 1: Overwrite خطرناک

```
زمان 10:00 - Bot A: tax_tier_standard = 20 → 25
زمان 10:05 - Bot B: tax_tier_standard = 25 → 30  ✅ (safe)

اما اگر:
زمان 10:00 - Bot A: tax_tier_standard = 20 → 25
زمان 10:02 - Bot B: tax_tier_standard = 20 → 30  ❌ (CONFLICT!)
             Bot B تغییر Bot A را نادیده گرفت

حل: Bot B باید conflict-check کند:
  → hasConflict: true (تغییر 2 دقیقه پیش)
  → منتظر بمانید یا merge کنید
```

### ✅ سناریو 2: هماهنگی صحیح

```
1. Bot A: conflict-check() → hasConflict: false
2. Bot A: update tax_tier_standard = 25
3. Bot A: log-change()
4. Bot B: conflict-check() → hasConflict: true (30 دقیقه قبل)
5. Bot B: منتظر می‌ماند و تغییر نمی‌دهد
```

---

## 📋 چه چیزها لاگ می‌شود؟

| Entity Type | مثال | توضیح |
|------------|------|--------|
| `tax_tier` | standard/reduced/special | نرخ‌های مالیات KDV |
| `membership_setting` | member_discount, loyalty_discount | تنظیمات عضویت |
| `category` | 1, 2, 3... | تغییرات دسته‌بندی |
| `product` | 1, 2, 3... | تغییرات محصول |
| `order` | 1, 2, 3... | تغییرات سفارش |
| `inventory` | product_id | تغییرات موجودی |

---

## 🛡️ بهترین شیوه‌ها

### ✅ انجام دهید:

```javascript
// 1. همیشه conflict-check کنید
const conflict = await fetch("/api/admin/conflict-check", {...});
if (conflict.hasConflict) {
  console.warn("Conflict detected. Waiting...");
  return;
}

// 2. همیشه log-change کنید
await fetch("/api/admin/log-change", {...});

// 3. برای تغییرات مهم notify کنید
await fetch("/api/admin/notify-bots", {...});

// 4. هر session شروع شود، sync کنید
const changes = await fetch("/api/changes/sync");
console.log("Recent admin changes:", changes);
```

### ❌ انجام ندهید:

```javascript
// ❌ بدون conflict-check بروزرسانی نکنید
await updateTaxRate(25);

// ❌ بروزرسانی را لاگ نکنید
// بدون log-change() call

// ❌ فرض نکنید داده‌های شما تنها valid هستند
// همیشه اطلاع رسانی کنید
```

---

## 🔐 معرفی‌سازی (Authentication)

تمام endpoints به `admin_auth` cookie احتیاج دارند:
- از login endpoint یا ADMIN_PASSWORD env variable

---

## 📞 مسائل و حل‌ها

### مشکل: "تغییرات من override شد"

✅ **حل:**
1. `/api/changes/sync` چک کنید
2. دیکشنری `changedBy` را بخوانید
3. اگر conflict دیدید، با AI Manager تماس بگیرید

### مشکل: "نمی‌دانم کدام تغییرات نسازی‌شده است"

✅ **حل:**
```bash
GET /api/changes/sync
# unsynced_count > 0 = تغییرات نسازی‌شده وجود دارد
```

---

## 📚 مثال: تغییر جدید Tax Rate

```python
# Step 1: Check conflict
response = requests.post(
  "http://localhost:3000/api/admin/conflict-check",
  json={
    "entityType": "tax_tier",
    "entityId": None,
    "proposedValue": "30"
  },
  headers={"Cookie": "admin_auth=..."}
)

if response.json()["hasConflict"]:
  print("⛔ Conflict! Aborting...")
  return

# Step 2: Update
requests.patch(
  "http://localhost:3000/api/admin/tax",
  json={
    "type": "tier-standard",
    "taxTier": "30"
  }
)

# Step 3: Log
requests.post(
  "http://localhost:3000/api/admin/log-change",
  json={
    "entityType": "tax_tier",
    "entityId": None,
    "action": "update",
    "oldValue": "20",
    "newValue": "30",
    "changedBy": "smm-panel-bot"
  }
)

# Step 4: Notify
requests.post(
  "http://localhost:3000/api/admin/notify-bots",
  json={
    "entityType": "tax_tier",
    "botName": "smm-panel-bot",
    "action": "update",
    "oldValue": "20",
    "newValue": "30"
  }
)
```

---

## 🎯 خلاصه

| API | هدف | متن |
|-----|------|------|
| `POST /api/admin/conflict-check` | جلوگیری از کانفلیک | **ضروری** |
| `POST /api/admin/log-change` | ریکورد تغییرات | **ضروری** |
| `GET /api/changes/sync` | خواندن تغییرات | **ضروری** |
| `POST /api/changes/sync` | علامت‌گذاری خوانده‌شده | اختیاری |
| `POST /api/admin/notify-bots` | اطلاع رسانی | اختیاری |

---

**آخرین به‌روزرسانی:** 2026-08-16 سپاس از استفاده صحیح! 🙏
