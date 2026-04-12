locals {
  vercel_project_id   = "prj_JvYqS6Lrow54bjkb9NELW9p53uQ0"
  vercel_project_name = "giving-the-distance-app"
  vercel_team_id      = "team_oTT19Jmu6sLX5Cx4EgLCajgK"

  vercel_project_domains = {
    production_apex = {
      domain = "givingthedistance.org"
    }
    preview_beta = {
      domain     = "beta.givingthedistance.org"
      git_branch = "preview"
    }
  }
}

provider "vercel" {
  api_token = var.vercel_api_token
  team      = local.vercel_team_id
}

resource "vercel_project" "app" {
  name                                              = local.vercel_project_name
  framework                                         = "nextjs"
  auto_assign_custom_domains                        = true
  automatically_expose_system_environment_variables = true
  customer_success_code_visibility                  = false
  directory_listing                                 = false
  function_failover                                 = false
  git_fork_protection                               = true
  git_lfs                                           = false
  on_demand_concurrent_builds                       = false
  preview_deployments_disabled                      = false
  prioritise_production_builds                      = true
  skew_protection                                   = "12 hours"

  git_comments = {
    on_commit       = false
    on_pull_request = true
  }

  git_repository = {
    type              = "github"
    repo              = "danksky/giving-the-distance-app"
    production_branch = "production"
  }

  resource_config = {
    fluid                    = true
    function_default_regions = ["iad1"]
  }

  oidc_token_config = {
    issuer_mode = "team"
  }

  vercel_authentication = {
    deployment_type = "none"
  }

  lifecycle {
    ignore_changes = [
      build_machine_type,
      enable_preview_feedback,
      node_version,
      oidc_token_config,
      preview_comments,
      protection_bypass_for_automation_secret,
      serverless_function_region,
    ]
  }
}

resource "vercel_project_domain" "app" {
  for_each = local.vercel_project_domains

  project_id = vercel_project.app.id
  domain     = each.value.domain
  git_branch = try(each.value.git_branch, null)
}

resource "vercel_project_environment_variable" "better_stack_source_token" {
  for_each = {
    preview    = logtail_source.app["preview"].token
    production = logtail_source.app["production"].token
  }

  project_id = vercel_project.app.id
  key        = "BETTER_STACK_SOURCE_TOKEN"
  value      = each.value
  target     = [each.key]
  sensitive  = true
}

resource "vercel_project_environment_variable" "managed" {
  for_each = var.vercel_project_environment_variables

  project_id = vercel_project.app.id
  key        = each.value.key
  value      = each.value.value
  target     = each.value.target
  git_branch = try(each.value.git_branch, null)
  sensitive  = try(each.value.sensitive, false)
  comment    = try(each.value.comment, null)
}
