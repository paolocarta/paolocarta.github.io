---
title: "Using ArgoCD ApplicationSet templating to conditionally apply SyncPolicies"
date: 2025-03-29
description: "How to use ArgoCD ApplicationSet templatePatch to conditionally apply syncPolicy based on the environment, enabling automatic sync on dev/test and manual sync on prod."
tags: ["kubernetes", "argocd", "gitops"]
author: "Paolo Carta"
draft: false
---

ApplicationSets can be really useful to generate several applications, for instance when using multiple environments. This can be achieved by using generators such as the list, git or cluster ones.

Sometimes the application generated might be different from one environment to another. For instance, we might want automatic sync on `dev` and `test`, but manual sync in the `prod` environment.

This article shows how to use an ApplicationSet with `templatePatch` to conditionally apply `syncPolicy` based on the environment. This example assumes you're using a List or Git generator that includes an `env` field (e.g., `test`, `prod`) for each application.

> **ArgoCD version required:** >= v2.10.0

## ApplicationSet Manifest

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: apps-appset
spec:
  goTemplate: true
  generators:
    - list:
        elements:
          - env: dev
            namespace: dev-apps
          - env: test
            namespace: test-apps
          - env: prod
            namespace: prod-apps
  template:
    metadata:
      name: 'my-app-{{.env}}'
    spec:
      project: apps
      source:
        repoURL: https://github.com/my-org/gitops.git
        targetRevision: HEAD
        path: 'apps/my-app/overlays/{{.env}}'
      destination:
        server: https://kubernetes.default.svc
        namespace: '{{.namespace}}'
  templatePatch: |
    {{- if ne .env "prod" }}
    spec:
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
    {{- end }}
```

Notice the `goTemplate: true` field, which enables Go templating. The inline `templatePatch` uses a conditional expression so the `syncPolicy` snippet is only rendered for environments that are not `prod`.

## Notes

- `.env` refers to the field from the generator (`list.elements` in this case).
- For `prod`, `syncPolicy` is omitted, so sync will be manual.
- You can expand this logic further using `else` conditions, `with`, and other Go template constructs, since `templatePatch` uses standard Go templating syntax.

## Conclusions

We demonstrated a sample usage of the `templatePatch` functionality in ArgoCD ApplicationSets. You can adapt it to your needs depending on your project requirements.
