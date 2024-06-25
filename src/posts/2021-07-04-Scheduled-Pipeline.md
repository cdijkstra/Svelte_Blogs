---
layout: post
title:  "Creating a scheduled pipeline for noteworthy notifications"
date: '2021-07-04 13:30:00 +0100'
tags: Pipelines DevOps
image: cron.png
---

## Cronjob pipeline
Releases for critical Azure components have occurred, and you were not aware of them. Ay!
Wouldn't you like to get an automatically notified (on Slack, Outlook or using another webhook) whenever a new version gets supported?

Let's say we want to be automatically informed whenever a new *Kubernetes version* in AKS becomes available, and will use a scheduled pipeline for that.

First we need to find out which possible upgrades are available (see [my blog on Azure CLI filters](https://cdijkstra.github.io/Blog/devops/jq/2021/05/22/Azure-Cli-Querying-Tips.html) for more details on Azure Cli filters).
When AKS version 1.16.13 is installed, Azure CLI returns:
```bash
$ az aks get-upgrades -g rg-kubernetes-01 -n k8s-demo --query 'controlPlaneProfile.upgrades[?isPreview==null].kubernetesVersion'
[
  "1.16.15",
  "1.17.9",
  "1.17.11"
]
```
In other words, we see that the AKS cluster can be upgraded to 1.16.15 but also to a newer major version! Let's first create notifications about both minor and major upgrades.
## Getting automatic notifications about upgrades
![](Images/s/k8spipeline.png)
Azure pipeline are well-suited to notify about upgrades, because we 1) can schedule these, 2) can perform a simple bash script and rest API calls. What should it look like?
* Firstly, there is a *time-trigger* (cronjob) such that it runs regularly,
* Then an `az aks get-upgrades` task retrieves available AKS upgrades,
* Lastly, in case of available upgrades, post these to your rest API.

Let's start constructing our pipeline in Azure Devops. 
We want the pipeline to be *scheduled* and not to be triggered by pull requests and pushes to any branches. This means our first part of the pipeline will look like
```yaml
pool:
  vmImage: 'ubuntu-latest'
trigger: none # !
pr: none      # Otherwise it's also triggered by code changes!
schedules:
- cron: "0 8 * * Mon" # Check available upgrades every monday at 9:00AM
  branches:
    include:
    - master
```

Typing in `az cli` in the assistant gives us the `AzureCLI@2` task that allows us to use `az` commands. This is preferable over a bash script, since the `az login` using the service principal happens automatically. We need an Azure Resource Manager (ARM) service connection for this task. 

```yaml
steps:
  - task: AzureCLI@2
    displayName: Getk8sUpgrades
    inputs:
      azureSubscription: azureconnection
      scriptType: pscore
      scriptLocation: inlineScript
      inlineScript: |
        $upgrades = az aks get-upgrades -g rg-kubernetes-01 -n k8s-demo --query 'controlPlaneProfile.upgrades[?isPreview==null.kubernetesVersion' -o tsv
```
Now let's test whether this variable can be accessed in the next step...
```yaml
- task: Bash@3
    name: Test_variable_is_received
    inputs:
      targetType: 'inline'
      script: |
        echo "Upgrades='$(Upgrades)'"
```
This print `Upgrades=''`, indicating that the variable is not received. 🧐

The next step is to set the versions as an **output variable** so this variable can be used in the ensuing step.
## Setting a multi-job output variable
In order to use the variable `upgrades` in the post step, we have to set it as [a multi-job output variable](https://docs.microsoft.com/en-us/azure/devops/pipelines/process/variables?view=azure-devops&tabs=yaml%2Cbatch). When adding the line 
```bash
Write-Output("##vso[task.setvariable variable=Upgrades;]$upgrades")
```
to the powershell script (this can also be done to a bash script), we can use the variable in the next step.
```yaml
- task: Bash@3
    name: Test_variable_is_received
    inputs:
      targetType: 'inline'
      script: |
        echo "Posting update to VictorOps, upgrade versions: $(Upgrades)"
```
and we obtain `"Posting update to VictorOps, upgrade versions: 1.16.15, 1.17.9, 1.17.11"`
Note: we can only access this variable in the *next* step, if we need it even later we need to declare stage-dependencies. This is not necessary here :) Now let's use the `InvokeRESTAPI` step to actually post something!

```yaml
 - task: InvokeRESTAPI@1
    name: Post_nonpreview_upgrades
    inputs:
      connectionType: 'connectedServiceName'
      serviceConnection: 'VictorOps' # Can also be Slack/Outlook/etc
      method: 'POST'
      body: '{ 
        "data": "Kubernetes upgrade", 
        "entity_display_name": "Kubernetes can be upgraded to non-preview versions $(Upgrades)", 
        (...) 
      }'
```
This works like a charm!👌 
![](Images/s/victoropsNotification.png)

## Some improvements
First make it work, then make it pretty. Time for some last improvements:
* The first improvement is that we're setting some variables to keep the steps nice and simple. For instance:
```
queryFilterPreviewVersions: '--query controlPlaneProfile.upgrades[?isPreview==null].kubernetesVersion'
```
* After upgrading to the most recent k8s version, notifications will still be sent.
Not sending the messages when no upgrades are available is achieved by choosing a suitable `condition:` on the last task. We can check if `variables.Upgrades` is empty and abort the pipeline if so. We therefore find `condition: ne(variables.Upgrades, '')`. We should keep in mind that we ae overwriting the default condition `succeeded()` (run if the previous task succeeded) and we want to keep that, so we write two condition combined in an `and(X, Y)` statement: `condition: and(succeeded(), ne(variables.Upgrades, ''))`.

In the end we have obtained the following pipeline, which satisfies our conditions!

```yaml
pool:
  vmImage: 'ubuntu-16.04'
trigger: none
pr: none
schedules:
- cron: "0 8 * * Mon"
  displayName: Check available upgrades every monday at 9:00AM
  branches:
    include:
    - master
variables:
  akscluster: 'aks-cluster'
  resourcegroup: 'resource-group'
  queryFilterPreviewVersions: '--query controlPlaneProfile.upgrades[?isPreview==null].kubernetesVersion'
steps:
 - task: AzureCLI@2
    name: Obtain_upgrades
    inputs:
      azureSubscription: 'SageDeploymentDev'
      scriptType: 'pscore'
      scriptLocation: 'inlineScript'
      inlineScript: |
        $upgrade = az aks get-upgrades -g $(resourcegroup) -n $(akscluster) $(queryFilterPreviewVersions) -o tsv
        Write-Output("##vso[task.setvariable variable=Upgrades;]$upgrade")
 - task: InvokeRESTAPI@1
    condition: and(succeeded(), ne(variables.Upgrades, '')) #  Only continue if versions were found
    name: Post_nonpreview_upgrades
    inputs:
      connectionType: 'connectedServiceName'
      serviceConnection: 'VictorOps'
      method: 'POST'
      body: '{ 
        "data": "Kubernetes upgrade", 
        "entity_display_name": "Kubernetes can be upgraded to non-preview versions $(Upgrades)", 
        (...) 
      }'
```
