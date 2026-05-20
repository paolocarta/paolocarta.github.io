---
title: "DevOps on Small Teams: What Actually Matters"
date: 2023-11-20
description: "Small teams don't have the bandwidth for enterprise DevOps theatre. Here's what to focus on."
tags: ["ci/cd", "small-teams"]
author: "Paolo Carta"
draft: false
---

A two-person startup has different DevOps needs than a 200-person engineering org, and treating them the same is a reliable way to waste a lot of time. After working with teams at various stages, here's what I've found actually moves the needle when you're small.

## Invest early in fast, reliable CI

Every hour of flaky CI is an hour of developer attention tax paid daily. A test suite that takes 20 minutes and occasionally fails for no reason will destroy your team's confidence in the pipeline and, eventually, in tests themselves.

Prioritise: fast feedback (under 5 minutes for a typical PR), deterministic runs (no flakiness), and clear failure output. Parallelise early. Cache aggressively.

## Trunk-based development over complex branching

Long-lived feature branches create integration debt. Trunk-based development with feature flags is harder to set up but pays dividends — smaller diffs, easier reviews, fewer merge conflicts.

## Infrastructure as Code from day one

"We'll migrate it later" almost never happens. Start with Terraform or Pulumi from the first cloud resource. It costs a bit of time upfront and saves enormous pain when you inevitably need to recreate environments, onboard new engineers, or audit what you're actually running.

## Pick boring technology

The most important DevOps principle for a small team: don't introduce operational complexity you don't have the bandwidth to manage. Use managed databases. Use hosted Kubernetes if you can. Save the interesting architecture for problems that are genuinely your competitive advantage.

## On-call culture over tooling

No amount of tooling replaces a healthy on-call culture. Rotate fairly, run blameless post-mortems, and fix the underlying issues rather than just the symptoms. A team that learns from incidents gets noticeably more reliable over time.

---

None of this is revolutionary. The hard part is sticking to it when there's pressure to move fast.
