# ?? Telegram Bot Integration

Complete setup guide for Telegram notifications and daily reports.

---

## ?? Step 1: Create a Telegram Bot

### Option A: Using BotFather (Recommended)

1. Open Telegram and search for `@BotFather`
2. Send `/start` then `/newbot`
3. Choose a name (e.g., "Berk-HomaVM Bot")
4. Choose a username (e.g., "berk_homeavm_bot") - must end with "_bot"
5. BotFather will give you a **token** 

### Option B: In Code

```bash
curl https://api.telegram.org/bot<YOUR_TOKEN>/getMe
```

---

## ?? Step 2: Get Your Chat ID

1. Find your bot by username in Telegram
2. Send /start to it
3. Open: https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
4. Look for "chat":{"id":123456789,...} - that is your Chat ID

---

## ?? Step 3: Set Environment Variables

### Local Development (.env.local)

```
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
TELEGRAM_CHAT_ID=987654321
```

### Production (Vercel)

Add to environment variables in dashboard

---

## ? Step 4: Test Connection

### API Test

```bash
curl -X GET http://localhost:3000/api/admin/telegram/test \
  -H "Cookie: admin_auth=$ADMIN_PASSWORD"
```

### Send Test Alert

```bash
curl -X POST http://localhost:3000/api/admin/telegram/test \
  -H "Cookie: admin_auth=$ADMIN_PASSWORD" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","message":"Works!","severity":"info"}'
```

---

## ?? Send Daily Reports

```bash
curl -X POST http://localhost:3000/api/admin/reports/send \
  -H "Cookie: admin_auth=$ADMIN_PASSWORD" \
  -H "Content-Type: application/json" \
  -d '{
    "reportDate":"2026-08-17",
    "businessName":"berk-homeavm",
    "method":"telegram"
  }'
```

---

## ?? Available Functions

### sendDailyReportToTelegram()
Send formatted daily report

### sendTelegramAlert()
Send alert with severity level (info/warning/critical)

### sendTelegramWithButtons()
Send message with clickable buttons

### testTelegramConnection()
Test bot connection

---

## ?? Automated Daily Reports

### Cron Script (scripts/send-daily-report.js)

```javascript
const fetch = require("node-fetch");

async function sendDailyReport() {
  const date = new Date().toISOString().split("T")[0];
  const password = process.env.ADMIN_PASSWORD;

  const res = await fetch("http://localhost:3000/api/admin/reports/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": `admin_auth=${password}`,
    },
    body: JSON.stringify({
      reportDate: date,
      businessName: "berk-homeavm",
      method: "telegram",
    }),
  });

  console.log(await res.json());
}

sendDailyReport();
```

Add to crontab: `0 8 * * * cd /path && node scripts/send-daily-report.js`

---

## ?? Automatic Alerts

```typescript
import { sendTelegramAlert } from "@/lib/telegram";

if (failedOrders > 5) {
  await sendTelegramAlert(
    "High Failed Orders",
    `${failedOrders} orders failed`,
    "critical"
  );
}
```

---

## Resources

- Telegram Bot API: https://core.telegram.org/bots/api
- BotFather: https://core.telegram.org/bots#botfather

Setup complete!
