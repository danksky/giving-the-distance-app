# Terraform: Better Stack

This directory is the Terraform starting point for infra that belongs with the app repo.

## What this manages today

- Better Stack Telemetry sources for this app
- One source each for `preview` and `production` by default

## What this does not manage yet

- Vercel projects, domains, or environment variables
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
