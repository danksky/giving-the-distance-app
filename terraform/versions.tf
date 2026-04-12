terraform {
  required_version = ">= 1.10.0"

  required_providers {
    logtail = {
      source  = "BetterStackHQ/logtail"
      version = "~> 10.10"
    }
    vercel = {
      source  = "vercel/vercel"
      version = "~> 3.5"
    }
  }
}
