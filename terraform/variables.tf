variable "logtail_api_token" {
  description = "Better Stack Telemetry API token used by Terraform to manage Better Stack resources."
  type        = string
  sensitive   = true
}

variable "backblaze_application_key_id" {
  description = "Backblaze B2 management application key ID used by Terraform to manage the backups bucket."
  type        = string
  sensitive   = true
}

variable "backblaze_application_key" {
  description = "Backblaze B2 management application key used by Terraform to manage the backups bucket."
  type        = string
  sensitive   = true
}

variable "better_stack_team_name" {
  description = "Optional Better Stack team name. Useful when authenticating Terraform with a global token."
  type        = string
  default     = null
  nullable    = true
}

variable "default_data_region" {
  description = "Default Better Stack data region for created sources."
  type        = string
  default     = "germany"
}

variable "sources" {
  description = "Better Stack sources to manage for this app."
  type = map(object({
    name               = string
    platform           = optional(string, "javascript")
    data_region        = optional(string)
    logs_retention     = optional(number)
    metrics_retention  = optional(number)
    ingesting_paused   = optional(bool, false)
    live_tail_pattern  = optional(string)
    source_group_id    = optional(number)
    team_name          = optional(string)
    vrl_transformation = optional(string)
  }))

  default = {
    preview = {
      name     = "giving-the-distance-app-preview"
      platform = "javascript"
    }
    production = {
      name     = "giving-the-distance-app-production"
      platform = "javascript"
    }
  }
}
