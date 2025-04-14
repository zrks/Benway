terraform {
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }

  required_version = ">= 1.0"
}

provider "digitalocean" {
  token = var.do_token
}

variable "do_token" {
  description = "DigitalOcean API Token"
  type        = string
  sensitive   = true
}

variable "ssh_key_id" {
  description = "DigitalOcean SSH key ID"
  type        = string
}

resource "digitalocean_droplet" "cheap_droplet" {
  name   = "minimal-droplet"
  region = "fra1"               # Frankfurt region
  size   = "s-1vcpu-512mb-10gb" # Cheapest plan (1 vCPU, 512mb RAM)
  image  = "ubuntu-24-10-x64"   # Ubuntu image

  backups = false

  ssh_keys = [var.ssh_key_id] # Add your SSH key for access

  tags = ["web", "dev"]

  user_data = file("${path.module}/init.sh")
  # user_data = templatefile("${path.module}/cloud-init.tpl", {
  #   vault_addr      = "https://<your-vault-name>.vault.hashicorp.cloud"
  #   vault_namespace = "admin"
  #   role_id         = var.vault_role_id
  #   secret_id       = var.vault_secret_id
  # })
}

output "droplet_ip" {
  value = digitalocean_droplet.cheap_droplet.ipv4_address
}
