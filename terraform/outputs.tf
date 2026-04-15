output "better_stack_sources" {
  description = "Managed Better Stack source metadata by environment."
  value = {
    for env, source in logtail_source.app : env => {
      id             = source.id
      name           = source.name
      platform       = source.platform
      data_region    = source.data_region
      ingesting_host = source.ingesting_host
      table_name     = source.table_name
      team_id        = source.team_id
    }
  }
}

output "better_stack_source_tokens" {
  description = "Source tokens by environment. Copy these into the matching Vercel environment variables."
  sensitive   = true
  value = {
    for env, source in logtail_source.app : env => source.token
  }
}

output "backblaze_backup_bucket" {
  description = "Managed Backblaze B2 bucket metadata for database backups."
  value = {
    bucket_id   = b2_bucket.backups.bucket_id
    bucket_name = b2_bucket.backups.bucket_name
    bucket_type = b2_bucket.backups.bucket_type
  }
}
