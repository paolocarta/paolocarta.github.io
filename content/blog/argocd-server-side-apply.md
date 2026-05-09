---
title: "ArgoCD Server Side Apply for bulky CRDs"
date: 2024-11-28
description: "How to fix the 'Too long: must have at most 262144 bytes' error in ArgoCD by enabling server-side apply for large CRDs."
tags: ["kubernetes", "argocd", "devops"]
author: "Paolo Carta"
draft: false
---

In this post, I'll explain the reason for the issue with ArgoCD on Kubernetes: "Too long: must have at most 262144 bytes". After that we will see how to fix it.

By default, ArgoCD performs a `kubectl apply` operation to apply the configuration stored in Git. This is a client side operation that is using the `kubectl.kubernetes.io/last-applied-configuration` annotation to store the previous resource state as JSON. This is used to compute the patch to apply to a resource.

In some cases the resource is too big to fit in 256kB, which is the max annotation size. For instance, this is the case of some CRDs, for instance the Prometheus one, which can be quite big. To solve this issue, server-side apply can be used to avoid it since the annotation is not used in this case.

Server side apply can be used with the kubectl by just adding the server side flag.

```bash
kubectl apply --server-side -f my-file
```

This is also supported by ArgoCD's Application settings in the syncOptions `ServerSideApply=true`:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: prometheus
spec:
  project: in-cluster
  source:
    repoURL: https://gitlab.com/pcarta/devops-environments/common
    targetRevision: main
    path: monitoring/prometheus/
  destination:
    name: in-cluster
    namespace: monitoring
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - ...
      - ServerSideApply=true   # INFO: because of CRDs too long
```

The option can actually be set also on the individual resources as an annotation:

```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: prometheuses.monitoring.coreos.com
  annotations:
    argocd.argoproj.io/sync-options: ServerSideApply=true
```

This can be useful in case you just want to apply the CRD with ServerSide enabled. In fact, it could cause some issues for a few resources, especially with ArgoCD which might struggle computing the diff.

---

Drop me a line if you want to walk through any of these in the context of your specific setup.