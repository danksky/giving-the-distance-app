locals {
  backblaze_backup_bucket_name = "giving-the-distance-backups"
  backblaze_backup_bucket_id   = "c4beae1f364c9d2993dd0d1d"
}

provider "b2" {
  application_key_id = var.backblaze_application_key_id
  application_key    = var.backblaze_application_key
}

resource "b2_bucket" "backups" {
  bucket_name = local.backblaze_backup_bucket_name
  bucket_type = "allPrivate"

  default_server_side_encryption {
    mode      = "SSE-B2"
    algorithm = "AES256"
  }
}
