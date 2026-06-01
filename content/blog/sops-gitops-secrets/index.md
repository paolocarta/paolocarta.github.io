---
title: "Securing Secrets in a GitOps Environment with SOPS"
date: 2025-07-13
description: "How to use Mozilla SOPS to encrypt, version, and decrypt secrets alongside your Kubernetes manifests in a GitOps workflow, keeping sensitive values safe in Git."
tags: ["kubernetes", "gitops", "security"]
author: "Paolo Carta"
draft: false
---

Managing secrets — API keys, database credentials, certificates — safely and efficiently is one of the hardest parts of operating a cloud native infrastructure. GitOps brings reproducibility and auditability by storing all configuration in a Git repository. But how do you keep sensitive values in Git without risking exposure? In this post, I explore how Mozilla SOPS fits into GitOps to encrypt, version, and decrypt secrets alongside your Kubernetes manifests.

![Confidential](./confidential-info.jpg)

## The Challenge of Secrets in GitOps

- Storing secrets as plain text violates security best practices.
- Secret management tools (Vault, AWS Secrets Manager) can complicate the GitOps flow and break the declarative Git-centric model.
- We need a way to keep secrets in Git, encrypted end-to-end.

## Mozilla SOPS

SOPS is a tool for encrypting and decrypting YAML, JSON, and other files, using keys managed by KMS systems, Vault, PGP, and more.

Core features:

- Encrypts only the values, leaving the rest of the document intact.
- Supports multiple key sources for flexible key management.
- JSON/YAML aware.

## Setting Up SOPS for Your Repository

**1. Install SOPS**

```bash
brew install sops           # macOS
apt-get install sops        # Debian/Ubuntu
```

**2. Choose a Key Management Backend**

```bash
sops --kms arn:aws:kms:...          # AWS KMS
sops --gcp-kms projects/...         # GCP KMS
sops --pgp 0123456789ABCDEF...      # PGP
```

**3. Initialize the Configuration**

Create a `.sops.yaml` at the root of your repo:

```yaml
creation_rules:
  - path_regex: ".*\.ya?ml$"
    kms: ["arn:aws:kms:region:acct-id:key/key-id"]
    encrypted_regex: ".*"
```

This avoids specifying keys each time you use the SOPS CLI.

## Encrypting and Committing Secrets

**1. Create a secret file (`db-credentials.yaml`)**

```yaml
db:
  username: myuser
  password: mypassword
```

**2. Encrypt with SOPS**

```bash
sops --encrypt db-credentials.yaml > db-credentials.sops.yaml
```

**3. Commit to Git**

```bash
git add db-credentials.sops.yaml  # needed only the first time
git commit -m "Add encrypted DB credentials"
git push origin main
```

Before committing to Git, add a `.gitignore` to prevent accidentally pushing unencrypted files:

```gitignore
# Ignore plain secret files
*secret.yaml*
*secrets.yaml*
```

## Best Practices

- **Rotate keys regularly**: Use SOPS key rotation commands and re-encrypt files.
- **Use multiple key backends**: Allows failover if one KMS becomes unavailable.
- **Automate encryption in CI**: Fine-tune the `.sops.yaml` file and add a CI check to prevent plaintext secrets from being committed.

## Troubleshooting

- **Decryption errors**: Verify KMS permissions and local key availability.
- **Merge conflicts**: SOPS's structured diffs reduce noise, but complex merges may still require manual resolution.

## Conclusion

By combining SOPS with a GitOps workflow, you keep the benefits of declarative, Git-based deployments while ensuring that secrets remain encrypted at rest and in transit. This approach maintains auditability, traceability, and security, simplifying operations for teams.
