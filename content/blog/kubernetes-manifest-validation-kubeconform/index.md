---
title: "Validate your Kubernetes manifests with Kubeconform and Kustomize in CI/CD"
date: 2024-12-12
description: "Learn how to integrate Kubeconform into your CI pipeline to automatically validate Kubernetes manifests before deployment."
tags: ["kubernetes", "ci/cd", "devops", "gitops"]
author: "Paolo Carta"
draft: false
---

## Introduction

Kubernetes manifests define how your applications and resources should be configured and managed.

To ensure that these manifests are valid and compliant with Kubernetes standards, it's crucial to validate them before deploying to any cluster. One effective way to automate this process is by using Kubeconform in your CI pipeline. This blog post will walk you through the process of integrating Kubeconform into a CI pipeline to validate your Kubernetes manifests.

## What is Kubeconform?

[Kubeconform](https://github.com/yannh/kubeconform) is a Kubernetes manifest validation tool designed to be fast, lightweight, and portable. It uses the Kubernetes JSON schemas to validate manifests against the correct API version, ensuring they are syntactically correct and conform to the required specifications.

Unlike other validation tools, Kubeconform focuses on speed and simplicity, making it an excellent choice for CI pipelines.

## Benefits of Manifest Validation

Validating Kubernetes manifests in a CI pipeline offers several benefits:

- **Early Error Detection**: Catch syntax errors or invalid configurations before they reach the cluster.
- **Compliance Assurance**: Ensure all manifests adhere to organizational or Kubernetes standards.
- **Improved Security**: Validate manifests to detect potential security misconfigurations early.

## Setting Up Kubeconform in a CI Pipeline

Let's integrate Kubeconform into a CI pipeline. We will use a generic example that can be easily adapted for various CI platforms like GitHub Actions, GitLab CI, Jenkins or others.

### Step 1: Get Kubeconform

To use Kubeconform you can either use the public Docker image, create your own one or install the tool at runtime.

For example, this is the official Docker image:

```bash
docker pull ghcr.io/yannh/kubeconform:v0.6.7
```

Or, if you prefer to download the binary:

```bash
wget -qO- https://github.com/yannh/kubeconform/releases/download/v0.6.7/kubeconform-linux-amd64.tar.gz | tar xvz -C /usr/local/bin
```

### Step 2: Configure Kubeconform (Optional)

By default, Kubeconform will check manifests against the latest Kubernetes schemas from `kubernetesjsonschema.dev`. However, you can configure it to use custom schemas if necessary. To use the default settings, you don't need any additional configuration.

### Step 3: Create a CI Job for Validation

Now, let's set up a CI job to validate Kubernetes manifests using Kubeconform. The actual validation code will be contained in a script and executed only on push to the main branch.

The job covers three steps:

- **Checkout code**: Fetches the code from the repository.
- **Install Kubeconform**: Downloads and installs Kubeconform in the runner environment.
- **Validate manifests**: Runs a custom script to identify the files changed and runs the validation on them.

Example for GitHub Actions:

```yaml
name: Validate Kubernetes Manifests

on:
  push:
    branches:
      - main

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v2

      - name: Install Kubeconform
        run: |
          wget -qO- https://github.com/yannh/kubeconform/releases/download/v0.6.7/kubeconform-linux-amd64.tar.gz | tar xvz -C /usr/local/bin

      - name: Validate manifests
        run: |
          ./validate-yaml-push.sh
```

Example for GitLab CI:

```yaml
validate_k8s_manifests:
  image: ubuntu:latest
  script:
    - apk add --no-cache curl tar
    - curl -sL https://github.com/yannh/kubeconform/releases/download/v0.6.7/kubeconform-linux-amd64.tar.gz | tar xvz -C /usr/local/bin
    - ./validate-yaml-push.sh
  only:
    - main
```

### Custom Validation Script

A script is helpful since we might have tens or even hundreds of services in a GitOps repository containing YAML manifests. We would like to avoid iterating all over all folders in the repo in order to speed up the validation process. The idea is to validate just the files which contain changes.

The most important command will be the one calling the `kubeconform` CLI:

```bash
kubeconform -verbose -output pretty -strict your-file-to-be-validated.yaml
```

Keep in mind that the script is an example — you might need a different mechanism depending on how you structure your GitOps repository.

```bash
#!/bin/bash

set -euo pipefail

# Find all folders with changes
YAML_DIRS=$(git diff --dirstat=files,0 HEAD^ | sed 's/^[ 0-9.]\+% //g' | cut -f2 -d '%')
echo "YAML dirs: '$YAML_DIRS'"

# Iterate all over the folders with changes building a single file to be validated
for DIR in ${YAML_DIRS}; do
  DIR=$(echo "$DIR" | tr -d '[:blank:]')
  echo "Processing directory: '$DIR'"

  if [ -f "$DIR/kustomization.yaml" ] ; then
    kustomize build ${DIR} > ${DIR}/val-kz-local-render-source-branch.yaml && echo '---' >> ${DIR}/val-kz-local-render-source-branch.yaml
    cat ${DIR}/val-kz-local-render-source-branch.yaml >> val-kz-global-render.yaml
  fi
done

# Perform validation
if [ -f val-kz-global-render.yaml ] ; then
  kubeconform -verbose -output pretty -strict val-kz-global-render.yaml
fi
```

The script computes the diff between the latest commit and the previous one to extract the list of folders with changes. For each folder, Kustomize renders the final output, which is appended to a global diff file. Finally, Kubeconform is called on the global file to validate all changes at once.

### Step 4: Run the CI Pipeline

Once the job is set up, push your changes to the repository to trigger the CI pipeline. The pipeline will run the validation checks and report back the results.

### Step 5: Review the Results

If the manifests are valid, the pipeline will pass and you will be able to proceed with the deployment. If there are any validation errors, they will be listed in the CI pipeline logs. You will need to fix these errors before the pipeline can proceed.

## Customizing Kubeconform Validation

Kubeconform offers several options to customize validation:

- **Custom Schema Locations**: Use the `-schema-location` option to specify custom schema locations if you need to validate against non-standard or internal schemas.
- **Schema Caching**: Enable schema caching for faster validation by using the `-cache` option.
- **Field Ignoring**: Ignore certain fields or errors by using the `-ignore-missing-schemas` or `-skip` options.

## Conclusion

Integrating Kubeconform into your CI pipeline is a powerful way to automate Kubernetes manifest validation, catching errors early, improving compliance, and enhancing security. By ensuring all manifests are validated before deployment, you can maintain higher confidence in the quality and security of your Kubernetes deployments.
