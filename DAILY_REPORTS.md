# 📊 Daily Business Reports System

Automatic daily reports for all business operations. Reports include business health status, alerts, and key metrics.

---

## 🚀 API Endpoints

### 1️⃣ **Generate Daily Report**

```bash
GET /api/admin/reports/daily
```

**Response:**
```json
{
  "success": true,
  "reportDate": "2026-08-16",
  "report": {
    "name": "Berk-HomaVM (Household Products Store)",
    "status": "healthy",
    "stats": {
      "totalProducts": 156,
      "totalOrders": 342,
      "pendingOrders": 8,
      "totalRevenue": 125000,
      "failedOrders": 2
    },
    "alerts": [
      "⚠️ 2 failed orders found",
      "⚠️ Cargo webhook not configured"
    ],
    "recentChanges": 5
  },
  "reportText": "📊 **Berk-HomaVM...\n..."
}
```

**Auto-stored in database:** `admin_reports` table

---

### 2️⃣ **Get Report History**

```bash
GET /api/admin/reports/history?days=7&business=berk-homeavm
```

**Query Parameters:**
- `days`: Number of days to look back (default: 7)
- `business`: Filter by business name (optional)

**Response:**
```json
{
  "success": true,
  "days": 7,
  "businessName": "berk-homeavm",
  "totalReports": 7,
  "byDate": {
    "2026-08-16": [
      {
        "id": 1,
        "businessName": "berk-homeavm",
        "content": "📊 **Berk-HomaVM...",
        "status": "healthy",
        "sentToUser": false
      }
    ]
  }
}
```

---

### 3️⃣ **Send Report to User**

```bash
POST /api/admin/reports/send
Content-Type: application/json

{
  "reportDate": "2026-08-16",
  "businessName": "berk-homeavm",
  "method": "telegram"  // or: email, log, all
}
```

**Methods:**
- `telegram` - Send via Telegram Bot (requires integration)
- `email` - Send via Email Service (requires integration)
- `log` - Just log to database
- `all` - Send via all configured methods

**Response:**
```json
{
  "success": true,
  "report": {
    "date": "2026-08-16",
    "business": "berk-homeavm",
    "status": "healthy"
  },
  "sentVia": {
    "telegram": {"success": true},
    "email": {"success": true},
    "log": {"success": true}
  },
  "timestamp": "2026-08-16T10:30:00Z"
}
```

---

## 📋 Report Content

Each report includes:

### **Status Indicator**
- ✅ `healthy` - No issues
- ⚠️ `warning` - 1-2 alerts
- 🚨 `critical` - 3+ alerts

### **Statistics**
- Total products
- Total orders (all-time)
- Pending shipments
- Daily revenue
- Failed orders

### **Alerts** (Automatically Detected)
- Failed orders
- Pending shipments
- Missing payment gateway
- Missing cargo webhook
- Low inventory (if applicable)
- Configuration issues

### **Activity**
- Number of changes logged today
- Recent admin actions

---

## 🔄 Automatic Daily Scheduling

To run reports automatically every day at **8 AM UTC**:

### Option 1: Using `/schedule` skill (Recommended)

```bash
/schedule create-daily-report \
  --cron "0 8 * * *" \
  --command "curl http://localhost:3000/api/admin/reports/daily"
```

### Option 2: External Cron Service

Use a service like AWS Lambda, Google Cloud Scheduler, or cron.io:

```bash
# Every day at 8 AM
0 8 * * * curl -X GET http://your-domain.com/api/admin/reports/daily \
  -H "Cookie: admin_auth=$ADMIN_PASSWORD" | \
  curl -X POST http://your-domain.com/api/admin/reports/send \
    -H "Cookie: admin_auth=$ADMIN_PASSWORD" \
    -H "Content-Type: application/json" \
    -d '{"reportDate":"$(date +%Y-%m-%d)","businessName":"berk-homeavm","method":"email"}'
```

### Option 3: Node.js Script

```javascript
// scripts/daily-report.js
const fetch = require("node-fetch");

async function runDailyReport() {
  const date = new Date().toISOString().split("T")[0];
  const cookie = process.env.ADMIN_PASSWORD;

  // Generate report
  const reportRes = await fetch("http://localhost:3000/api/admin/reports/daily", {
    headers: { Cookie: `admin_auth=${cookie}` },
  });

  // Send report
  await fetch("http://localhost:3000/api/admin/reports/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `admin_auth=${cookie}`,
    },
    body: JSON.stringify({
      reportDate: date,
      businessName: "berk-homeavm",
      method: "all",
    }),
  });

  console.log(`✅ Daily report sent for ${date}`);
}

runDailyReport().catch(console.error);
```

**Then schedule with cron:**
```bash
0 8 * * * node /path/to/scripts/daily-report.js
```

---

## 📊 Database Schema

### `admin_reports` Table

```sql
CREATE TABLE admin_reports (
  id SERIAL PRIMARY KEY,
  report_date DATE NOT NULL,
  business_name VARCHAR(100) NOT NULL,
  report_content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'healthy',  -- healthy, warning, critical
  sent_to_user BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(report_date, business_name)
);

CREATE INDEX idx_admin_reports_date ON admin_reports(report_date DESC);
CREATE INDEX idx_admin_reports_business ON admin_reports(business_name, report_date DESC);
```

---

## 🔌 Integration Points

### Telegram Integration (TODO)

```javascript
// In /api/admin/reports/send
const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
  method: "POST",
  body: JSON.stringify({
    chat_id: chatId,
    text: report.report_content,
    parse_mode: "Markdown",
  }),
});
```

### Email Integration (TODO)

```javascript
// Using SendGrid / Mailgun / AWS SES
const transporter = nodemailer.createTransport({
  service: "gmail", // or your provider
  auth: {
    user: process.env.EMAIL_FROM,
    pass: process.env.EMAIL_PASSWORD,
  },
});

await transporter.sendMail({
  from: process.env.EMAIL_FROM,
  to: "msn.necoo@gmail.com",
  subject: `Daily Report - ${reportDate}`,
  text: report.report_content,
  html: `<pre>${report.report_content}</pre>`,
});
```

---

## 📈 Metrics Tracked

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| Total Products | Number of products in catalog | None |
| Total Orders | All-time order count | None |
| Pending Shipments | Orders awaiting shipment | > 5 |
| Daily Revenue | Today's sales in TRY | None |
| Failed Orders | Orders with status=failed | > 0 |
| Payment Gateway | Is a gateway configured? | Must be set |
| Cargo Webhook | Is webhook URL configured? | Must be set |
| Changes Logged | Admin actions today | None |

---

## 🎯 Usage Example

### Morning Check-in

```bash
# 1. Generate today's report
curl http://localhost:3000/api/admin/reports/daily \
  -H "Cookie: admin_auth=$ADMIN_PASSWORD"

# 2. Check last 7 days
curl "http://localhost:3000/api/admin/reports/history?days=7" \
  -H "Cookie: admin_auth=$ADMIN_PASSWORD"

# 3. Send if critical status
curl http://localhost:3000/api/admin/reports/send \
  -X POST \
  -H "Cookie: admin_auth=$ADMIN_PASSWORD" \
  -H "Content-Type: application/json" \
  -d '{
    "reportDate": "2026-08-16",
    "businessName": "berk-homeavm",
    "method": "email"
  }'
```

---

## 🚀 Future Enhancements

- [ ] Multi-business summary (all 3 businesses in one report)
- [ ] Compare day-over-day performance
- [ ] Trend analysis (revenue, order count)
- [ ] Predictive alerts (low inventory predictions)
- [ ] Mobile dashboard
- [ ] Slack/Discord integration
- [ ] SMS alerts for critical issues
- [ ] Custom report templates
- [ ] Scheduled email digest

---

**Last Updated:** 2026-08-16  
**Status:** ✅ Ready to use
