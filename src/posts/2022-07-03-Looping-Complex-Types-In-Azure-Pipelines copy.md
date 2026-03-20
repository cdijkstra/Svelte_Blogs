---
layout: post
title: "Looping over complex objects in Azure Pipelines"
date: "2022-07-03 15:45:00 +0100"
tags:
  - DevOps
  - Pipelines
image: pipelines.png
---

## The benefit of loops in Azure Pipelines

A common scenario I encounter when building pipelines is the need to perform similar steps across multiple environments. As software developers, we value the DRY (Don't Repeat Yourself) principle—but we often overlook its relevance in Infrastructure as Code (IaC) and pipeline configuration. Fortunately, Azure Pipelines makes it easy to avoid duplication by using `object` parameters and looping over them.

We can loop over numbers, or usernames quite easily in Azure pipelines.

```yml
parameters:
  - name: users
    type: object
    default:
      - alice
      - bob
  - name: db
    type: object
    default:
    - db-one
    - db-two

steps:
  - ${{ each user in parameters.users }} :
    - ${{ each db in parameters.db }} :
      - script: add-user.sh ${{ user }} ${{ db }}
```

What many people however do not know, is that we can also loop over more complicated objects such as users containing _an email address, age, et cetera_.

We will see two examples where loops are particularly fruitful in pipelines:

1. Validating that infra deployments are syntactically correct for all to-be-deployed-to envs.
1. In CI/CD pipelines we often want to deploy to an Azure Web App or Kubernetes cluster for different environments.

## Looping within jobs - Validating an infra deployment

When using ARM or bicep templates, it is a good practice to validate if the template + corresponding parameter files are syntactically correct. We do using the `az group deployment validate --template-file <template.yml> -- parameters <parameters.{d,t,p}>` command. I like to validate if it's valid for all environments beforing continuing to any of the deployments.

What we like to create is a validation stage where a template is called which can be used for different resource groups. We have to pass the name of the RG to the template as a parameters, so we get:

```yaml
stages:
  - stage: ValidateInfra
    displayName: "Validate infra"
    jobs:
      - job: Validate_infra
        displayName: "Validate infra for all environments"
        steps:
          - template: "/Pipelines/validate-infra.yml"
            parameters:
              deployment: "<RG>"
```

The template itself contains the validation steps for the TAP phases, containing the `AzureResourceGroupDeployment@2` step with `deploymentMode: 'Validation'`. It initally looks like:

```yaml
parameters:
  - name: deployment
    type: string

steps:
  - task: AzureResourceGroupDeployment@2
    displayName: "Validate ARM Template Test"
    inputs:
      azureSubscription: "ServicePrincipalt"
      resourceGroupName: "${{ parameters.deployment }}t"
      location: "West Europe"
      csmFile: "infra/Deployment/${{ parameters.deployment }}/template.json"
      csmParametersFile: "infra/Deployment/${{ parameters.deployment }}/parameters.t.json"
      deploymentMode: "Validation"

  - task: AzureResourceGroupDeployment@2
    displayName: "Validate ARM Template Acc"
    inputs:
      azureSubscription: "ServicePrincipala"
      resourceGroupName: "${{ parameters.deployment }}a"
      location: "West Europe"
      csmFile: "infra/Deployment/${{ parameters.deployment }}/template.json"
      csmParametersFile: "infra/Deployment/${{ parameters.deployment }}/parameters.a.json"
      deploymentMode: "Validation"

  - task: AzureResourceGroupDeployment@2
    displayName: "Validate ARM Template Prod"
    inputs:
      azureSubscription: "ServicePrincipalp"
      resourceGroupName: "${{ parameters.deployment }}p"
      location: "West Europe"
      csmFile: "infra/Deployment/${{ parameters.deployment }}/template.json"
      csmParametersFile: "infra/Deployment/${{ parameters.deployment }}/parameters.p.json"
      deploymentMode: "Validation"
```

and contains very similar steps. In fact, only the environmentname (`Test`, `Acc`, `Prod`) and environmentletters (`t`, `a`, `p`) are different! We can simplify this by adding the following [object parameter](https://docs.microsoft.com/en-us/azure/devops/pipelines/process/runtime-parameters?view=azure-devops&tabs=script#parameter-data-types):

```yml
parameters:
  - name: environmentObjects
    type: object
    default:
      - environmentName: "Test"
        environmentLetter: "t"
      - environmentName: "Acc"
        environmentLetter: "a"
      - environmentName: "Prod"
        environmentLetter: "p"
```

We can then loop over this object

```yml
  - ${{ each environmentObject in parameters.environmentObjects }}:
```

and reference the parameters using the [compile-time variable expressions](https://docs.microsoft.com/en-us/azure/devops/pipelines/process/variables?view=azure-devops&tabs=yaml%2Cbatch#understand-variable-syntax)

- `${{ environmentObject.environmentName }}`,
- `${{ environmentObject.environmentLetter }}`.

We now obtain for `template.yml`

```yml
parameters:
  - name: environmentObjects
    type: object
    default:
    - environmentName: 'Test'
      environmentLetter: 't'
    - environmentName: 'Acc'
      environmentLetter: 'a'
    - environmentName: 'Prod'
      environmentLetter: 'p'

steps:
  - ${{ each environmentObject in parameters.environmentObjects }}:
    - task: AzureResourceGroupDeployment@2
      displayName: 'Validate ARM Template ${{ environmentObject.environmentName }}'
      inputs:
        azureSubscription: 'ServicePrincipal ${{ environmentObject.environmentName }}'
        resourceGroupName: '${{ parameters.deployment }}${{ environmentObject.environmentLetter }}'
        location: 'West Europe'
        csmFile: 'infra/Deployment/${{ parameters.deployment }}/template.json'
        csmParametersFile: 'infra/Deployment/${{ parameters.deployment }}/parameters.${{ environmentObject.environmentLetter }}.json'
        deploymentMode: 'Validation'
```

which looks nice, compact and - not quite unimportant - works like a charm!

## Looping over stages - Rolling out infra

A likewise need for loops arises when _deploying to different environments_. To get successful infra deployments, I need the following jobs:

- A pre-deployment script (_e.g._ setting secrets in a keyvault),
- The deployment,
- A post-deployment script (to set access policies for Kubernetes _after is is successfully deployed_),
- infra tests after each of these steps.

These ensembles of tasks differ merely in parameters such as AzDo Service Principal, k8s namespace and resource group name. I have extracted all these steps in a `rollout-infra.yml` template. We can now loop over different stages using

```yml
parameters:
  - name: environmentObjects
    type: object
    default:
    - environmentName: 'Test'
      environmentLetter: 't'
      variableGroup: 'TestSubscription'
    - environmentName: 'Dev'
      environmentLetter: 'd'
      variableGroup: 'DevelopmentSubscription'
    - environmentName: 'Prod'
      environmentLetter: 'p'
      variableGroup: 'ProductionSubscription'

stages:
  - ${{ each environmentObject in parameters.environmentObjects }}:
    - stage: ${{ environmentObject.environmentName }}
      condition: and(succeeded(), ne(variables['Build.Reason'], 'PullRequest'))
      displayName: 'Rollout infra ${{ environmentObject.environmentName }}'
      variables:
        - group: ${{ environmentObject.variableGroup }}
      jobs:
        - deployment: '${{ environmentObject.environmentAzDo }}'
          environment: '${{ environmentObject.environmentAzDo }}'
          displayName: 'Rollout infra ${{ environmentObject.environmentName }}'
          strategy:
            runOnce:
              deploy:
                steps:
                  - checkout: self

                  - template: 'rollout-infra.yml'
                    parameters:
                      deployment: 'RG${{ environmentObject.environmentLetter }}'
                      environment: '${{ environmentObject.environmentLetter }}'
```

Since the right environment name is set via the loop, we can also get our desired behavior with required approvals for deployments to prod and possible acc environments.

## Conclusion

The looping syntax `-  ${{ each par in parameters.pars }} ` provides a useful twist to pipelines where the amount of code can be minimized. Loops are not limited to simple types, we can construct more complicated objects _containing the same properties_ and loop over them. This can save a tremendous amount of lines of code and is more appealing to read and maintain.
