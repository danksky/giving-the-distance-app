#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const environmentSpecs = [
  {
    name: "local",
    file: ".env.local",
    expectedUrl: "http://localhost:3000",
    requiredKeys: [
      "NEXTAUTH_URL",
      "NEXTAUTH_SECRET",
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET",
      "STRAVA_CLIENT_ID",
      "STRAVA_CLIENT_SECRET",
    ],
    recommendedKeys: [
      "ENABLE_STRAVA_DESCRIPTION_UPDATES",
      "ADMIN_EMAILS",
      "STRAVA_WEBHOOK_VERIFY_TOKEN",
      "SLACK_BOT_TOKEN",
      "SLACK_CHANNEL",
      "BLOB_READ_WRITE_TOKEN",
    ],
  },
  {
    name: "preview",
    file: ".env.preview",
    expectedUrl: "https://beta.givingthedistance.org",
    requiredKeys: [
      "NEXTAUTH_URL",
      "NEXTAUTH_SECRET",
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET",
      "STRAVA_CLIENT_ID",
      "STRAVA_CLIENT_SECRET",
      "STRAVA_WEBHOOK_VERIFY_TOKEN",
    ],
    recommendedKeys: [
      "ENABLE_STRAVA_DESCRIPTION_UPDATES",
      "ADMIN_EMAILS",
      "SLACK_BOT_TOKEN",
      "SLACK_CHANNEL",
      "BLOB_READ_WRITE_TOKEN",
    ],
  },
  {
    name: "production",
    file: ".env.production",
    expectedUrl: "https://givingthedistance.org",
    requiredKeys: [
      "NEXTAUTH_URL",
      "NEXTAUTH_SECRET",
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET",
      "STRAVA_CLIENT_ID",
      "STRAVA_CLIENT_SECRET",
      "STRAVA_WEBHOOK_VERIFY_TOKEN",
    ],
    recommendedKeys: [
      "ENABLE_STRAVA_DESCRIPTION_UPDATES",
      "ADMIN_EMAILS",
      "SLACK_BOT_TOKEN",
      "SLACK_CHANNEL",
      "BLOB_READ_WRITE_TOKEN",
    ],
  },
];

const databaseKeyOptions = ["DATABASE_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL"];

function parseEnvFile(filePath) {
  const contents = fs.readFileSync(filePath, "utf8");
  const values = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) {
      continue;
    }

    let [, key, value] = match;
    value = value.trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

function getDatabaseValue(values) {
  for (const key of databaseKeyOptions) {
    if (values[key]?.trim()) {
      return values[key].trim();
    }
  }

  return "";
}

function getDatabaseHost(values) {
  const raw = getDatabaseValue(values);

  if (!raw) {
    return "";
  }

  try {
    return new URL(raw).host;
  } catch {
    return "(unparseable)";
  }
}

function collectFileStatus(spec) {
  const filePath = path.join(root, spec.file);

  if (!fs.existsSync(filePath)) {
    return {
      ...spec,
      exists: false,
      values: {},
      missingRequired: [...spec.requiredKeys, "DATABASE_URL | POSTGRES_PRISMA_URL | POSTGRES_URL"],
      missingRecommended: spec.recommendedKeys,
      databaseHost: "",
    };
  }

  const values = parseEnvFile(filePath);
  const missingRequired = spec.requiredKeys.filter((key) => !values[key]?.trim());

  if (!getDatabaseValue(values)) {
    missingRequired.push("DATABASE_URL | POSTGRES_PRISMA_URL | POSTGRES_URL");
  }

  const missingRecommended = spec.recommendedKeys.filter((key) => !values[key]?.trim());

  return {
    ...spec,
    exists: true,
    values,
    missingRequired,
    missingRecommended,
    databaseHost: getDatabaseHost(values),
  };
}

function yesNo(value) {
  return value ? "yes" : "no";
}

function printList(label, values) {
  if (values.length === 0) {
    console.log(`  ${label}: none`);
    return;
  }

  console.log(`  ${label}: ${values.join(", ")}`);
}

function printEnvironmentStatus(status) {
  console.log(`${status.name} (${status.file})`);

  if (!status.exists) {
    console.log("  present: no");
    console.log("");
    return;
  }

  console.log("  present: yes");
  console.log(`  NEXTAUTH_URL: ${status.values.NEXTAUTH_URL || "(missing)"}`);
  console.log(`  NEXTAUTH_URL matches expectation: ${yesNo(status.values.NEXTAUTH_URL === status.expectedUrl)}`);
  console.log(`  database host: ${status.databaseHost || "(missing)"}`);
  console.log(`  Google client configured: ${yesNo(Boolean(status.values.GOOGLE_CLIENT_ID))}`);
  console.log(`  Strava client id: ${status.values.STRAVA_CLIENT_ID || "(missing)"}`);
  printList("missing required", status.missingRequired);
  printList("missing recommended", status.missingRecommended);
  console.log("");
}

function compare(label, left, right, expectedEqual) {
  const same = left === right;
  const pass = expectedEqual ? same : !same;
  console.log(`  ${label}: ${pass ? "pass" : "check"} (${same ? "same" : "different"})`);
  return pass;
}

const statuses = environmentSpecs.map(collectFileStatus);

console.log("Giving the Distance configuration audit");
console.log("");

for (const status of statuses) {
  printEnvironmentStatus(status);
}

const local = statuses.find((status) => status.name === "local");
const preview = statuses.find((status) => status.name === "preview");
const production = statuses.find((status) => status.name === "production");

console.log("Parity checks");

let hasFailure = false;

if (local?.exists && preview?.exists) {
  hasFailure = !compare(
    "local and preview share Google OAuth client",
    local.values.GOOGLE_CLIENT_ID,
    preview.values.GOOGLE_CLIENT_ID,
    true
  ) || hasFailure;
  hasFailure = !compare(
    "local and preview share Strava app",
    local.values.STRAVA_CLIENT_ID,
    preview.values.STRAVA_CLIENT_ID,
    true
  ) || hasFailure;
  hasFailure = !compare(
    "local and preview share database host",
    local.databaseHost,
    preview.databaseHost,
    true
  ) || hasFailure;
}

if (preview?.exists && production?.exists) {
  hasFailure = !compare(
    "preview and production use different Google OAuth clients",
    preview.values.GOOGLE_CLIENT_ID,
    production.values.GOOGLE_CLIENT_ID,
    false
  ) || hasFailure;
  hasFailure = !compare(
    "preview and production use different Strava apps",
    preview.values.STRAVA_CLIENT_ID,
    production.values.STRAVA_CLIENT_ID,
    false
  ) || hasFailure;
  hasFailure = !compare(
    "preview and production use different database hosts",
    preview.databaseHost,
    production.databaseHost,
    false
  ) || hasFailure;
}

console.log("");
console.log("Notes");
console.log("  Next.js auto-loads .env.local for local development.");
console.log("  .env.preview and .env.production are best treated as pulled snapshots for remote environments and one-off maintenance tasks.");
console.log("  The app normalizes Vercel POSTGRES_* variables to DATABASE_URL in lib/db.ts.");

for (const status of statuses) {
  if (!status.exists || status.missingRequired.length === 0) {
    continue;
  }

  hasFailure = true;
}

process.exitCode = hasFailure ? 1 : 0;
