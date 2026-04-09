#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const fileSpecs = {
  ".env.local": {
    header: [
      "# Local development env",
      "# Keep this file small and intentional.",
      "# Next.js auto-loads .env.local when you run the app locally.",
    ],
    keys: [
      "DATABASE_URL",
      "DIRECT_URL",
      "NEXTAUTH_URL",
      "NEXTAUTH_SECRET",
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET",
      "STRAVA_CLIENT_ID",
      "STRAVA_CLIENT_SECRET",
      "STRAVA_WEBHOOK_VERIFY_TOKEN",
      "ENABLE_STRAVA_DESCRIPTION_UPDATES",
      "ADMIN_EMAILS",
      "SLACK_BOT_TOKEN",
      "SLACK_CHANNEL",
      "BLOB_READ_WRITE_TOKEN",
      "BLOB_STORE_ID",
      "NEXT_PUBLIC_APP_URL",
    ],
  },
  ".env.preview": {
    header: [
      "# Sanitized snapshot of Vercel Preview env vars",
      "# This file is for inspection and maintenance tasks only.",
      "# Auto-provided Vercel/Turbo metadata vars are intentionally omitted.",
    ],
    keys: [
      "NEXTAUTH_URL",
      "NEXTAUTH_SECRET",
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET",
      "STRAVA_CLIENT_ID",
      "STRAVA_CLIENT_SECRET",
      "STRAVA_WEBHOOK_VERIFY_TOKEN",
      "ENABLE_STRAVA_DESCRIPTION_UPDATES",
      "DATABASE_URL",
      "DIRECT_URL",
      "POSTGRES_PRISMA_URL",
      "POSTGRES_URL",
      "POSTGRES_URL_NON_POOLING",
      "ADMIN_EMAILS",
      "SLACK_BOT_TOKEN",
      "SLACK_CHANNEL",
      "BLOB_READ_WRITE_TOKEN",
      "BLOB_STORE_ID",
      "NEXT_PUBLIC_APP_URL",
    ],
  },
  ".env.production": {
    header: [
      "# Sanitized snapshot of Vercel Production env vars",
      "# This file is for inspection and maintenance tasks only.",
      "# Auto-provided Vercel/Turbo metadata vars are intentionally omitted.",
    ],
    keys: [
      "NEXTAUTH_URL",
      "NEXTAUTH_SECRET",
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET",
      "STRAVA_CLIENT_ID",
      "STRAVA_CLIENT_SECRET",
      "STRAVA_WEBHOOK_VERIFY_TOKEN",
      "ENABLE_STRAVA_DESCRIPTION_UPDATES",
      "DATABASE_URL",
      "DIRECT_URL",
      "POSTGRES_PRISMA_URL",
      "POSTGRES_URL",
      "POSTGRES_URL_NON_POOLING",
      "ADMIN_EMAILS",
      "SLACK_BOT_TOKEN",
      "SLACK_CHANNEL",
      "BLOB_READ_WRITE_TOKEN",
      "BLOB_STORE_ID",
      "NEXT_PUBLIC_APP_URL",
    ],
  },
};

function parseEnvFile(filePath) {
  const contents = fs.readFileSync(filePath, "utf8");
  const values = new Map();

  for (const rawLine of contents.split(/\r?\n/)) {
    const match = rawLine.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;
    values.set(key, rawValue);
  }

  return values;
}

function sanitizeFile(relativePath) {
  const spec = fileSpecs[relativePath];

  if (!spec) {
    throw new Error(`No sanitization spec found for ${relativePath}`);
  }

  const filePath = path.join(root, relativePath);

  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${relativePath} (file not found)`);
    return;
  }

  const values = parseEnvFile(filePath);
  const lines = [...spec.header, ""];

  for (const key of spec.keys) {
    const value = values.get(key);
    if (typeof value === "string" && value.length > 0) {
      lines.push(`${key}=${value}`);
    }
  }

  lines.push("");
  fs.writeFileSync(filePath, `${lines.join("\n")}`, "utf8");
  console.log(`Sanitized ${relativePath}`);
}

const files = process.argv.slice(2);
const targets = files.length > 0 ? files : Object.keys(fileSpecs);

for (const target of targets) {
  sanitizeFile(target);
}
