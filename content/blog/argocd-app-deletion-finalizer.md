---
title: "Application Cleanup with the ArgoCD Deletion Finalizer"
date: 2024-11-27
description: "How to use the ArgoCD deletion finalizer to automatically clean up Kubernetes resources when an Application is deleted, including cascading deletes for the App of Apps pattern."
tags: ["kubernetes", "argocd", "devops"]
author: "Paolo Carta"
draft: false
---

In Kubernetes, finalizers prevent resource deletion before the cleanup has been successfully completed by the responsible controllers.

ArgoCD supports its own finalizer as well in order to perform cleanup operations when deleting an Application custom resource. You can add a finalizer annotation on any Argo CD application.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  finalizers:
    # The default behavior is foreground cascading deletion
    - resources-finalizer.argocd.argoproj.io
```

When deleting an application with this finalizer, the ArgoCD application controller will perform a cascading delete of the application's resources.

The default propagation policy for cascading deletion is foreground cascading deletion.

Argo CD performs background cascading deletion when the following annotation is set (please note the difference with the previous one):

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  finalizers:
    # The default behavior is foreground cascading deletion
    - resources-finalizer.argocd.argoproj.io/background
```

Adding the finalizer enables cascading deletes also when implementing the App of Apps pattern. In this case, if you delete the parent Application it will also delete the child Application objects.

Anyway, be careful where you place finalizers. The presence of a finalizer instructs Argo CD that when a deletion occurs, it needs to delete several other resources as well. Make sure this is what you want for the resource that gets annotated.
