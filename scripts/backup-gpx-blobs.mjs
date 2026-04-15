#!/usr/bin/env node

import { list } from '@vercel/blob';
import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const requiredEnvVars = [
  'BLOB_READ_WRITE_TOKEN',
  'B2_BUCKET',
  'B2_KEY_ID',
  'B2_APPLICATION_KEY',
  'B2_ENDPOINT',
];

for (const name of requiredEnvVars) {
  if (!process.env[name]?.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

const blobToken = process.env.BLOB_READ_WRITE_TOKEN
  .replace(/\r/g, '')
  .replace(/\n/g, '')
  .replace(/\\n/g, '');
const blobPrefix = process.env.GPX_BLOB_PREFIX ?? 'gpx/';
const backupPrefix = (process.env.BLOB_BACKUP_PREFIX ?? 'vercel-blob').replace(/^\/+|\/+$/g, '');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

process.env.AWS_ACCESS_KEY_ID = process.env.B2_KEY_ID;
process.env.AWS_SECRET_ACCESS_KEY = process.env.B2_APPLICATION_KEY;
process.env.AWS_DEFAULT_REGION = process.env.B2_REGION ?? 'us-east-005';
process.env.AWS_EC2_METADATA_DISABLED = 'true';

async function aws(args, { allowFailure = false } = {}) {
  try {
    return await execFileAsync('aws', ['--endpoint-url', process.env.B2_ENDPOINT, ...args], {
      maxBuffer: 20 * 1024 * 1024,
    });
  } catch (error) {
    if (allowFailure) {
      return null;
    }
    throw error;
  }
}

async function listAllBlobs(prefix) {
  const blobs = [];
  let cursor;

  do {
    const result = await list({
      token: blobToken,
      prefix,
      cursor,
      limit: 1000,
    });
    blobs.push(...result.blobs);
    cursor = result.cursor;
    if (!result.hasMore) {
      break;
    }
  } while (cursor);

  return blobs.sort((a, b) => a.pathname.localeCompare(b.pathname));
}

function makeDestinationKey(pathname) {
  return backupPrefix ? `${backupPrefix}/${pathname}` : pathname;
}

async function shouldUpload(blob, key) {
  const response = await aws(
    ['s3api', 'head-object', '--bucket', process.env.B2_BUCKET, '--key', key, '--output', 'json'],
    { allowFailure: true },
  );

  if (!response) {
    return true;
  }

  const metadata = JSON.parse(response.stdout || '{}').Metadata ?? {};
  return (
    metadata['source-uploaded-at'] !== blob.uploadedAt.toISOString() ||
    metadata['source-size'] !== String(blob.size)
  );
}

async function uploadBlob(blob, key, tmpDir) {
  const response = await fetch(blob.url);
  if (!response.ok) {
    throw new Error(`Failed to download blob ${blob.pathname}: ${response.status} ${response.statusText}`);
  }

  const body = Buffer.from(await response.arrayBuffer());
  const tempFile = path.join(tmpDir, path.basename(blob.pathname));
  await writeFile(tempFile, body);

  await aws([
    's3',
    'cp',
    tempFile,
    `s3://${process.env.B2_BUCKET}/${key}`,
    '--metadata',
    `source-uploaded-at=${blob.uploadedAt.toISOString()},source-size=${blob.size}`,
    '--content-type',
    'application/gpx+xml',
  ]);
}

async function uploadManifest(summary, tmpDir) {
  const latestKey = `${backupPrefix}/manifests/gpx-latest.json`;
  const snapshotKey = `${backupPrefix}/manifests/gpx-${timestamp}.json`;
  const manifestPath = path.join(tmpDir, 'gpx-manifest.json');
  await writeFile(manifestPath, JSON.stringify(summary, null, 2));

  await aws(['s3', 'cp', manifestPath, `s3://${process.env.B2_BUCKET}/${latestKey}`, '--content-type', 'application/json']);
  await aws(['s3', 'cp', manifestPath, `s3://${process.env.B2_BUCKET}/${snapshotKey}`, '--content-type', 'application/json']);
}

async function main() {
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'gpx-backup-'));

  try {
    const blobs = await listAllBlobs(blobPrefix);
    const summary = {
      backupType: 'gpx-blobs',
      sourcePrefix: blobPrefix,
      destinationPrefix: backupPrefix,
      blobCount: blobs.length,
      uploadedCount: 0,
      skippedCount: 0,
      totalBytes: 0,
      startedAt: new Date().toISOString(),
      completedAt: null,
      files: [],
    };

    for (const blob of blobs) {
      const key = makeDestinationKey(blob.pathname);
      const uploadNeeded = await shouldUpload(blob, key);
      summary.totalBytes += blob.size;

      if (!uploadNeeded) {
        summary.skippedCount += 1;
        summary.files.push({
          pathname: blob.pathname,
          size: blob.size,
          uploadedAt: blob.uploadedAt.toISOString(),
          status: 'skipped',
          destinationKey: key,
        });
        continue;
      }

      await uploadBlob(blob, key, tmpDir);
      summary.uploadedCount += 1;
      summary.files.push({
        pathname: blob.pathname,
        size: blob.size,
        uploadedAt: blob.uploadedAt.toISOString(),
        status: 'uploaded',
        destinationKey: key,
      });
    }

    summary.completedAt = new Date().toISOString();
    await uploadManifest(summary, tmpDir);

    const summaryOutput = [
      `GPX blobs scanned: ${summary.blobCount}`,
      `Uploaded: ${summary.uploadedCount}`,
      `Skipped: ${summary.skippedCount}`,
      `Destination prefix: ${backupPrefix}/`,
    ].join('\n');

    console.log(summaryOutput);
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
}

await main();
