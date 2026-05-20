---
title: "Behavior of ConfigMaps in Kubernetes When We Update Them"
date: 2024-11-13
description: "What actually happens when you update a ConfigMap in Kubernetes depends on how you're using it. This article clarifies the behavior for volume mounts, environment variables, and how to automate restarts with Reloader."
tags: ["kubernetes", "configmap"]
author: "Paolo Carta"
draft: false
---

Working with Kubernetes I noticed some confusion when talking about what happens when a ConfigMap gets updated.

This article would like to explain my understanding about this behaviour.

## Using Volume Mounts

When a ConfigMap is mounted as a volume, Kubernetes eventually will update the files in the volume if you are not using a subpath. However, the application needs to detect these changes and reload the configuration. Some apps for instance just load the config at startup and not dynamically.

Example of configmap mounted as a volume in a container:

```yaml
volumes:
- name: config-volume
  configMap:
    name: my-config
```

To leverage this:

- **App Configuration Reload:** If your application supports reloading configuration from files dynamically, you can take advantage of this capability.

## Environment Variables

When using ConfigMap values as environment variables, changes to the ConfigMap won't be reflected until the pod is restarted.

Example:

```yaml
env:
- name: LOG_LEVEL
  valueFrom:
    configMapKeyRef:
      name: my-config
      key: logLevel
```

In this case, you'll need to implement a mechanism that watches for ConfigMap changes and triggers a pod restart. One approach is to use an external controller, as we will explain below.

## Additional: Using an External Config Reloader

You can use external tools like [Reloader](https://github.com/stakater/Reloader) to automatically reload pods when ConfigMaps or Secrets change.

The Reloader is basically a Kubernetes controller that watches for changes in ConfigMaps or Secrets. Any change triggers a rolling restart of the affected pods which belong to a Deployment for instance.

Example annotation to add to a Deployment:

```yaml
metadata:
  annotations:
    reloader.stakater.com/match: "true"
```

The installed controller watches the ConfigMaps and Secrets and ensures that the deployment is reloaded when a change is detected.

---

Drop me a line if you want to walk through any of these in the context of your specific setup.