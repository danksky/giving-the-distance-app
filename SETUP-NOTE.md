# Setup Note for GPX Storage Feature

## ⚠️ TypeScript Errors (Normal)

You may see some TypeScript errors in your IDE related to `gpxBlobUrl`. These are expected and will resolve automatically when you:

1. **Restart your TypeScript server** in VS Code/Cursor:

   - Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
   - Type "TypeScript: Restart TS Server"
   - Press Enter

2. **Or reload your IDE window**:
   - Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
   - Type "Developer: Reload Window"
   - Press Enter

The errors occur because:

- Prisma client has been regenerated with the new schema
- Your IDE's TypeScript server hasn't picked up the changes yet
- A simple restart fixes this

## ✅ What to Do Next

### 1. Restart TypeScript Server (Optional)

Fix IDE errors by restarting the TypeScript server (see above).

### 2. Add Environment Variable (Required)

```bash
# Add to your .env file
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxxxxxxxxxx"
```

Get from: Vercel Dashboard → Storage → Blob → Your Store

### 3. Run Database Migration (Required)

When your database is configured, run:

```bash
npm run db:push
```

Or manually run the SQL from:
`prisma/migrations/20251217_add_gpx_blob_url/migration.sql`

### 4. Deploy (Required)

```bash
git add .
git commit -m "Add GPX storage functionality"
git push
```

## 📖 Documentation

Start here:

- **`GPX-QUICK-START.md`** - Quick setup guide (recommended first read)
- **`GPX-STORAGE.md`** - Full documentation
- **`IMPLEMENTATION-GPX-STORAGE.md`** - Implementation summary

## ✨ That's It!

The feature is fully implemented and ready to use once you:

1. Add the `BLOB_READ_WRITE_TOKEN` env variable
2. Run the database migration
3. Deploy

GPX files will then be automatically downloaded and stored for all new activities!
