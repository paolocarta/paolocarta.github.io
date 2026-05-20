---
title: "Configmaps and Secrets Reloader in Kubernetes"
date: 2024-11-20
description: "How to use the Reloader controller to automatically trigger rolling restarts of Kubernetes workloads when ConfigMaps or Secrets are updated, eliminating the need for manual pod restarts."
tags: ["kubernetes", "configmap"]
author: "Paolo Carta"
draft: false
---

After talking about change propagation in configmaps [here](/blog/configmaps-behavior-kubernetes), I would like to go deeper into the [Reloader controller](https://github.com/stakater/Reloader).

## What is ConfigMap Reloader?

ConfigMap Reloader is an open-source Kubernetes controller that automatically triggers rolling upgrades when ConfigMaps or Secrets are updated. It is useful in scenarios where your application relies on external configuration files.

Without a tool like ConfigMap Reloader, you might need to manually delete or restart your pods to have your app using the new configuration, which can be cumbersome and prone to error, especially in larger deployments.

## How Does ConfigMap Reloader Work?

ConfigMap Reloader works by monitoring changes in the ConfigMaps and Secrets used within your pods managed by a Deployment for instance. When it detects a change, it triggers a rolling update of the pods, ensuring that the new configuration is reflected.

Here's a step-by-step overview of how ConfigMap Reloader works:

1. **Monitor ConfigMaps/Secrets**: ConfigMap Reloader continuously watches for changes in the specified ConfigMaps and Secrets in the Kubernetes cluster.
2. **Detect Changes**: When a change is detected — whether it's a modification, deletion, or addition — the reloader takes note.
3. **Triggers Rolling Update**: ConfigMap Reloader then triggers a rolling restart of the affected pods. This ensures that the new configuration is applied without any downtime.
4. **Changes are picked up**: The restarted pods pick up the updated ConfigMaps or Secrets upon startup, ensuring that the latest configurations are in effect.

## How to use ConfigMap Reloader in Your Kubernetes Cluster

Using ConfigMap Reloader into your Kubernetes environment is a simple process. Here's a basic guide to get you started:

### Deploy the Reloader

First, you need to deploy the Reloader into your Kubernetes cluster.

Since sometimes there are issues with tagging in the container registry, I recommend downloading a specific version. At the time of writing I cloned the repo at [this link](https://github.com/stakater/Reloader/releases/tag/v1.0.121). It uses version 1.0.121.

After that, you can go to the folder `./deployments/kubernetes` and build your installation manifest with [Kustomize](https://kustomize.io/):

```bash
kustomize build . > reloader-install.yaml
kubectl apply -f reloader-install.yaml
```

```
kubectl get pod

NAME                                READY   STATUS    RESTARTS  AGE
reloader-reloader-8c4c8b6f9-b2b6g   1/1     Running   0         43s
```

### Add resources properly annotated

To make sure that the Reloader refreshes objects like Deployments on ConfigMap and Secrets updates, you need to annotate it properly:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  annotations:
    reloader.stakater.com/auto: "true"
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:latest
        ports:
          - containerPort: 80
        volumeMounts:
          - name: config-volume
            mountPath: /usr/share/nginx/html/
      volumes:
      - name: config-volume
        configMap:
          name: my-configmap
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: my-configmap
data:
  index.html: |
    <html>
    …
    </html>
```

Let's deploy the manifest above and verify the status in our cluster:

```
k get pod

NAME                                   READY      STATUS    RESTARTS   AGE
nginx-deployment-7dc5695798-8xzm7      1/1        Running    0         8m13s
nginx-deployment-7dc5695798-lnmhc      1/1        Running    0         8m13s
nginx-deployment-7dc5695798-mpqnm      1/1        Running    0         8m13s
reloader-reloader-8c4c8b6f9-b2b6g      1/1        Running    0         19m
```

### Verify Operation updating a ConfigMap

After deploying the reloader and annotating your Deployment, update the ConfigMap and observe how ConfigMap Reloader triggers a restart of the associated pods.

Let's apply a modified version of the configmap:

```
k apply -f my-configmap-modified.yaml
configmap/my-configmap configured
```

We can observe that a rolling update has been triggered getting all Pods with the kubectl CLI:

```
k get pod

NAME                                   READY    STATUS              RESTARTS   AGE
nginx-deployment-6c55697669-jfgg2      0/1      ContainerCreating   0          2s
nginx-deployment-7dc5695798-8xzm7      1/1      Running             0          23m
nginx-deployment-7dc5695798-lnmhc      1/1      Running             0          23m
nginx-deployment-7dc5695798-mpqnm      1/1      Running             0          23m
```

```
k get pod

NAME                                   READY   STATUS              RESTARTS   AGE
nginx-deployment-6c55697669-bthxt      0/1     ContainerCreating   0          1s
nginx-deployment-6c55697669-g6rmg      1/1     Running             0          4s
nginx-deployment-6c55697669-jfgg2      1/1     Running             0          7s
nginx-deployment-7dc5695798-lnmhc      1/1     Running             0          23m
```

## Additional

You can also restrict this discovery to only ConfigMap or Secret objects that are tagged with a special annotation. To take advantage of that, annotate your deployments like this:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  annotations:
    reloader.stakater.com/search: "true"
```

The Reloader will trigger the rolling upgrade upon modification of any ConfigMap or Secret annotated like this:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: my-configmap
  annotations:
    reloader.stakater.com/match: "true"
```

Theoretically we could also restrict the reloading to specific configmaps or secrets by name. However I do not like this approach since it's more coupled. Moreover, adding a configmap would need adapting the annotation value in the deployment.

---

Drop me a line if you want to walk through any of these in the context of your specific setup.