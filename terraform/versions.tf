terraform {
  required_version = ">= 1.10.0"

  required_providers {
    b2 = {
      source  = "Backblaze/b2"
      version = "~> 0.8"
    }
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
