# Terraform: Better Stack

This directory is the Terraform starting point for infra that belongs with the app repo.

## What this manages today

- Better Stack Telemetry sources for this app
- One source each for `preview` and `production` by default
- The linked Vercel project
- The app's custom Vercel domains
- The project's current Vercel environment variables
- The Backblaze B2 bucket used for database backups

## What this does not manage yet

- DNS records outside Vercel
- Non-app Vercel team resources
- App-side logging code

## Authentication

Terraform should authenticate to Better Stack with a management token, not a source token.

Use one of these patterns:

```bash
export TF_VAR_logtail_api_token="your-better-stack-telemetry-api-token"
```

Or place it in an ignored `terraform.tfvars` file:

```hcl
logtail_api_token = "your-better-stack-telemetry-api-token"
```

For CI, store it in your secret manager and expose it as `TF_VAR_logtail_api_token`.

Vercel provider auth is stored the same way:

```bash
export TF_VAR_vercel_api_token="your-vercel-api-token"
```

Backblaze B2 provider auth is also stored as Terraform input variables:

```bash
export TF_VAR_backblaze_application_key_id="your-backblaze-management-key-id"
export TF_VAR_backblaze_application_key="your-backblaze-management-application-key"
```

Use a Backblaze management-capable key here, not the restricted GitHub Actions upload key. The GitHub Actions key is intentionally narrower than what Terraform needs to manage bucket settings.

## Important security note

`logtail_source.token` is stored in Terraform state because Better Stack returns it as part of the managed resource.
Treat the Terraform backend as sensitive infrastructure data.

If you are not using a remote backend yet, add one before broad team usage.

## First-time setup

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform plan
terraform apply
```

## After apply

Fetch the generated source tokens:

```bash
terraform output -json better_stack_source_tokens
```

Then assign them to the matching Vercel environments:

- Preview Vercel env: `BETTER_STACK_SOURCE_TOKEN`
- Production Vercel env: `BETTER_STACK_SOURCE_TOKEN`

For local development, add the preview or development source token to `.env.local` only if you want local logs to flow to Better Stack.

## Customization

Edit `terraform.tfvars` to change:

- source names
- region
- retention
- team targeting when needed

The default source `platform` is `javascript`, which fits this Next.js app well.
The default data region is `germany`, since Better Stack region availability is account-specific and this workspace currently only has `germany` enabled.

## Existing Vercel resources

`terraform/import-vercel-existing.sh` imports the current linked Vercel project, custom domains, and environment variables into local Terraform state so Terraform reflects what already exists instead of trying to recreate it.

## Existing Backblaze bucket

This repo now includes the existing backups bucket in Terraform:

- Bucket name: `giving-the-distance-backups`
- Bucket ID: `c4beae1f364c9d2993dd0d1d`

The config expects:

- private bucket type (`allPrivate`)
- default server-side encryption enabled with `SSE-B2` / `AES256`
- file lock not configured

To import the existing bucket into Terraform state:

```bash
cd terraform
terraform init
terraform import b2_bucket.backups c4beae1f364c9d2993dd0d1d
```

The import ID above is the Backblaze bucket ID. This is based on the official provider source, which uses passthrough import state and reads the resource back by `bucket_id`.
