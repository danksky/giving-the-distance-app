locals {
  resolved_sources = {
    for env, source in var.sources : env => merge(source, {
      data_region = try(source.data_region, null) != null ? source.data_region : var.default_data_region
      team_name   = try(source.team_name, null) != null ? source.team_name : var.better_stack_team_name
    })
  }
}

provider "logtail" {
  api_token = var.logtail_api_token
}

resource "logtail_source" "app" {
  for_each = local.resolved_sources

  name               = each.value.name
  platform           = each.value.platform
  data_region        = each.value.data_region
  logs_retention     = try(each.value.logs_retention, null)
  metrics_retention  = try(each.value.metrics_retention, null)
  ingesting_paused   = try(each.value.ingesting_paused, false)
  live_tail_pattern  = try(each.value.live_tail_pattern, null)
  source_group_id    = try(each.value.source_group_id, null)
  team_name          = try(each.value.team_name, null)
  vrl_transformation = try(each.value.vrl_transformation, null)
}
