---
title: "A Kubernetes Production Readiness Checklist"
date: 2023-01-15
description: "The checks I run before declaring a Kubernetes cluster production-ready, drawn from real engagements."
tags: ["kubernetes", "production", "reliability"]
author: "Paolo Carta"
draft: false
---

Declaring a cluster "production-ready" is often more of a vibe than a rigorous process. After running this exercise with a dozen or so clients, I've converged on a checklist that covers the things that actually bite people — not an exhaustive spec, but a focused set of high-signal checks.

## Resource requests and limits

Every container should have CPU and memory **requests** set. Limits are more nuanced — memory limits are important to prevent OOMKills cascading, but CPU limits can cause unnecessary throttling if set too low. At minimum: set requests on everything, set memory limits with some headroom, and measure actual usage before tuning CPU limits.

```yaml
resources:
  requests:
    cpu: "100m"
    memory: "128Mi"
  limits:
    memory: "256Mi"
```

## Pod Disruption Budgets

PDBs prevent too many replicas of a service from being unavailable simultaneously during voluntary disruptions (node drains, rolling upgrades). A cluster with no PDBs will happily drain all nodes of a deployment at once.

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: my-app-pdb
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: my-app
```

## Health probes

`readinessProbe` tells Kubernetes when a pod is ready to receive traffic. `livenessProbe` tells it when to restart a pod. Using liveness probes incorrectly (too aggressive timeouts, probing too early) is one of the most common causes of flapping deployments.

A safe starting point: set `readinessProbe` on every pod, and only add `livenessProbe` if you have a specific need — and test the failure behaviour before going to production.

## Node autoscaling

Cluster Autoscaler or Karpenter should be configured to handle burst demand and scheduled scale-down. Check that your node groups have appropriate taints and labels, and that your pods have matching tolerations and affinity rules.

## RBAC and network policies

Default deny network policies between namespaces, and service accounts with least-privilege RBAC bindings. These are easy to add early and painful to retrofit.

## Observability

At a minimum: Prometheus scraping cluster metrics, Grafana dashboards for node CPU/memory/disk, and alerts for pod crashlooping and node pressure. Centralised log aggregation (Loki, CloudWatch, Elasticsearch) makes incident response orders of magnitude faster.

---

Drop me a line if you want to walk through any of these in the context of your specific setup.
