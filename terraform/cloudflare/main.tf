terraform {
  required_version = ">= 1.10.0"
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }
}

# Set CLOUDFLARE_API_TOKEN from the macOS Keychain; never store it in state or Git.
provider "cloudflare" {}

locals {
  zone_id = "989f581ea9900d6474c1192801705717"
}

resource "cloudflare_dns_record" "apex" {
  zone_id = local.zone_id
  name    = "givingthedistance.org"
  type    = "A"
  content = "216.198.79.1"
  ttl     = 1
  proxied = true
}

import {
  to = cloudflare_dns_record.apex
  id = "989f581ea9900d6474c1192801705717/83d3bad5c03b14ccb311c9560effef89"
}

resource "cloudflare_dns_record" "beta" {
  zone_id = local.zone_id
  name    = "beta.givingthedistance.org"
  type    = "CNAME"
  content = "27945dfc237fdb07.vercel-dns-017.com"
  ttl     = 1
  proxied = true
}

import {
  to = cloudflare_dns_record.beta
  id = "989f581ea9900d6474c1192801705717/2f61f63d9551702263533dad2d43e821"
}

resource "cloudflare_dns_record" "domain_connect" {
  zone_id = local.zone_id
  name    = "_domainconnect.givingthedistance.org"
  type    = "CNAME"
  content = "_domainconnect.domains.squarespace.com"
  ttl     = 1
  proxied = true
}

import {
  to = cloudflare_dns_record.domain_connect
  id = "989f581ea9900d6474c1192801705717/4fb1918127dc0a330d43426eda3546ce"
}

resource "cloudflare_dns_record" "www" {
  zone_id = local.zone_id
  name    = "www.givingthedistance.org"
  type    = "CNAME"
  content = "71e41121b5511eed.vercel-dns-017.com"
  ttl     = 1
  proxied = true
}

import {
  to = cloudflare_dns_record.www
  id = "989f581ea9900d6474c1192801705717/b0b7e62ea4bc19a017c605bf8cf07bca"
}

resource "cloudflare_dns_record" "mail_forward_mx2" {
  zone_id  = local.zone_id
  name     = "givingthedistance.org"
  type     = "MX"
  content  = "mx2.forwardemail.net"
  ttl      = 1
  priority = 10
}

import {
  to = cloudflare_dns_record.mail_forward_mx2
  id = "989f581ea9900d6474c1192801705717/b9bd2153f8c351c3cc66d1c63832aa9b"
}

resource "cloudflare_dns_record" "mail_forward_mx1" {
  zone_id  = local.zone_id
  name     = "givingthedistance.org"
  type     = "MX"
  content  = "mx1.forwardemail.net"
  ttl      = 1
  priority = 10
}

import {
  to = cloudflare_dns_record.mail_forward_mx1
  id = "989f581ea9900d6474c1192801705717/fa09f9c738e2b8fc826d91af2247811d"
}

resource "cloudflare_dns_record" "mail_forward_verification" {
  zone_id = local.zone_id
  name    = "givingthedistance.org"
  type    = "TXT"
  content = "\"forward-email-site-verification=FblaCoccwD\""
  ttl     = 1
}

import {
  to = cloudflare_dns_record.mail_forward_verification
  id = "989f581ea9900d6474c1192801705717/4f41fdeab2f5e67477311588497f4eab"
}

resource "cloudflare_dns_record" "google_site_verification" {
  zone_id = local.zone_id
  name    = "givingthedistance.org"
  type    = "TXT"
  content = "\"google-site-verification=O5fHC2BXdmYUkYMCTa3zVcX0XRtlisa50XOBgPHwZw8\""
  ttl     = 1
}

import {
  to = cloudflare_dns_record.google_site_verification
  id = "989f581ea9900d6474c1192801705717/0b638d81730e5cffa0b520aa02ec0496"
}

resource "cloudflare_dns_record" "resend_dkim" {
  zone_id = local.zone_id
  name    = "resend._domainkey.givingthedistance.org"
  type    = "TXT"
  content = "\"p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDziaEMCid/PpR9pVoNZP7gaFkvBWKat4W0MIcIZVaK536AqTTY+e1fsGdkZueq398b4G52pmmtUGSw2Jm2tr91SOXuCrFsCiTYIvmEfr7ieCaC7akQMn08FJ2v6ipjfdeuSAM/93Czu8vuC7PJA43IWyCTZs5a+K343nkav/h2fQIDAQAB\""
  ttl     = 1
}

import {
  to = cloudflare_dns_record.resend_dkim
  id = "989f581ea9900d6474c1192801705717/5f741667a722ec4846270365d36cc522"
}

resource "cloudflare_dns_record" "mail_forward_dkim" {
  zone_id = local.zone_id
  name    = "smtp._domainkey.givingthedistance.org"
  type    = "TXT"
  content = "\"k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC5BXRZ0X3U622FoCMyR4HBEC8CHstoOX5NT1SDQYfOCCrKJbXEYW4+HtsfUKFYEwzLoMxJMfhD/dJedAMcbcaS0TO8b/TkbCJLF3zDtCeolfDUmMkB5gDSLZep4A6l5cTcGcMD0sFSoWnI/U0Os6OKt/Uq heXjQ8w43xSWFUOJ/wIDAQAB\""
  ttl     = 1
}

import {
  to = cloudflare_dns_record.mail_forward_dkim
  id = "989f581ea9900d6474c1192801705717/eb134b20ba888626c062784c1d0a085d"
}

resource "cloudflare_dns_record" "resend_return_path" {
  zone_id = local.zone_id
  name    = "rsend.givingthedistance.org"
  type    = "CNAME"
  content = "rsend.forge.rmta.net"
  ttl     = 1
  proxied = false
}

resource "cloudflare_dns_record" "resend_sending" {
  zone_id = local.zone_id
  name    = "send.givingthedistance.org"
  type    = "CNAME"
  content = "send.forge.rmta.net"
  ttl     = 1
  proxied = false
}

import {
  to = cloudflare_dns_record.resend_return_path
  id = "989f581ea9900d6474c1192801705717/a634be30c159a637581a9d0b81eeb6f4"
}

import {
  to = cloudflare_dns_record.resend_sending
  id = "989f581ea9900d6474c1192801705717/c3b2d57d50e4fab93748b1f32ef9348d"
}

