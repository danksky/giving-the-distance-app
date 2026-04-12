variable "vercel_api_token" {
  description = "Vercel API token used by Terraform to manage the linked Vercel project."
  type        = string
  sensitive   = true
}

variable "vercel_project_environment_variables" {
  description = "Managed Vercel project environment variables keyed by a stable Terraform identifier."
  type = map(object({
    key        = string
    value      = string
    target     = set(string)
    git_branch = optional(string)
    sensitive  = optional(bool, false)
    comment    = optional(string)
  }))
  default = {}
}
