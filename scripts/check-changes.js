#!/usr/bin/env node

/**
 * Session Initialization Script
 * Run this at the start of each session to check for admin changes
 * Usage: node scripts/check-changes.js
 */

const fetch = require("node-fetch");
const dotenv = require("dotenv");

dotenv.config();

const API_URL = process.env.API_URL || "http://localhost:3000";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Yasin2014Home";

async function getCookie() {
  try {
    const res = await fetch(`${API_URL}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: ADMIN_PASSWORD }),
    });
    const data = await res.json();
    return data.cookie || ADMIN_PASSWORD;
  } catch {
    return ADMIN_PASSWORD;
  }
}

async function checkChanges() {
  console.log("\n📋 === Checking for Admin Changes ===\n");

  try {
    const cookie = await getCookie();

    const res = await fetch(`${API_URL}/api/session/init`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: `admin_auth=${cookie}`,
      },
    });

    if (!res.ok) {
      console.error("❌ Failed to fetch changes:", res.status);
      return;
    }

    const data = await res.json();

    console.log(`📅 Session Initialized: ${data.timestamp}`);
    console.log(`📊 Unsynced Changes: ${data.unsynced_changes}\n`);

    // Display stats by entity type
    if (data.statistics.by_entity_type.length > 0) {
      console.log("📈 Changes by Entity Type:");
      data.statistics.by_entity_type.forEach((stat) => {
        console.log(`   • ${stat.entityType}: ${stat.changeCount} changes`);
        console.log(`     └─ Last: ${new Date(stat.lastChange).toLocaleString()}`);
      });
      console.log();
    }

    // Display activity by admin/bot
    if (data.statistics.by_admin.length > 0) {
      console.log("👤 Activity by Admin/Bot (last 24h):");
      data.statistics.by_admin.forEach((admin) => {
        console.log(`   • ${admin.changedBy}: ${admin.totalChanges} changes`);
        console.log(`     └─ Last: ${new Date(admin.lastActivity).toLocaleString()}`);
      });
      console.log();
    }

    // Display current critical settings
    console.log("⚙️ Current Settings:");
    console.log(`   • Tax Tier Standard: ${data.current_settings.tax_tier_standard || "N/A"}%`);
    console.log(`   • Tax Tier Reduced: ${data.current_settings.tax_tier_reduced || "N/A"}%`);
    console.log(`   • Tax Tier Special: ${data.current_settings.tax_tier_special || "N/A"}%`);
    console.log(`   • Member Discount: ${data.current_settings.member_discount || "0"}%`);
    console.log(`   • Loyalty Min Orders: ${data.current_settings.loyalty_min_orders || "0"}`);
    console.log(`   • Loyalty Discount: ${data.current_settings.loyalty_discount || "0"}%`);
    console.log(`   • Active Gateway: ${data.current_settings.active_gateway || "none"}`);
    console.log();

    // Display inventory status
    const inv = data.inventory_status;
    console.log("📦 Inventory Status:");
    console.log(`   • Total Products: ${inv.total_products || 0}`);
    console.log(`   • Total Categories: ${inv.total_categories || 0}`);
    console.log(`   • Pending Orders: ${inv.pending_orders || 0}`);
    console.log(`   • Pending Shipments: ${inv.pending_shipments || 0}`);
    console.log();

    // Display recent critical changes
    if (data.recent_changes.length > 0) {
      console.log("🔔 Recent Changes (unsynced):");
      data.recent_changes.slice(0, 10).forEach((change) => {
        const time = new Date(change.changedAt).toLocaleString();
        console.log(
          `   ${change.action.toUpperCase()} ${change.entityType}#${change.entityId || "global"}`
        );
        console.log(`   └─ ${change.oldValue || "—"} → ${change.newValue || "—"}`);
        console.log(`   └─ By: ${change.changedBy} at ${time}`);
      });

      if (data.recent_changes.length > 10) {
        console.log(`   ... and ${data.recent_changes.length - 10} more changes`);
      }
      console.log();
    } else {
      console.log("✅ No unsynced changes.\n");
    }

    // Mark as synced
    if (data.recent_changes.length > 0) {
      const changeIds = data.recent_changes.map((c) => c.id);
      await fetch(`${API_URL}/api/session/init`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `admin_auth=${cookie}`,
        },
        body: JSON.stringify({ changeIds }),
      });
      console.log(`✅ Marked ${changeIds.length} changes as synced.\n`);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

checkChanges();
