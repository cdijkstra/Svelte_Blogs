---
layout: post
title:  "Mastering JMESPath queries in the Azure CLI"
date: '2021-05-22 15:45:00 +0100'
tags: DevOps Azure jq jmespath
image: jmespath.png
---

## Mastering JMESPath queries in the Azure CLI
Both the Azure CLI and pwsh commandlet interacts with the Azure REST API and allows us to retrieve information about deployed resources in the terminal.
For instance, we can find out which Azure Kubernetes upgrades are available through\
`az aks get-upgrades --resource-group <rg-name> --name <aks-name>` \
but it may not be easy to filter the *relevant information* out of the returned info. I will show you how to do that in this blog.

Aforementioned command returnssomething like:
```
{
  "agentPoolProfiles": [
    {
      "kubernetesVersion": "1.16.13",
      "name": null,
      "osType": "Linux",
      "upgrades": [
        {
          "isPreview": null,
          "kubernetesVersion": "1.17.7"
        },
        {
          "isPreview": null,
          "kubernetesVersion": "1.17.9"
        }
      ]
    }
  ],
  "controlPlaneProfile": {
    "kubernetesVersion": "1.16.13",
    "name": null,
    "osType": "Linux",
    "upgrades": [
      {
        "isPreview": null,
        "kubernetesVersion": "1.17.7"
      },
      {
        "isPreview": true,
        "kubernetesVersion": "1.17.9"
      }
    ]
  },
  (...)
}
```
We are interested in the *versions the cluster can be upgraded to* (if available), so let's obtain these versions.
A solution would be to pipe the output to `jq`, [a sed-like command tool for json output](https://stedolan.github.io/jq/), to obtain the right json properties of the controlPlaneProfile.\
\
Indeed, adding the following pipe to the to the `az aks` command `| jq '.controlPlaneProfile.upgrades[].kubernetesVersion'`gives us the desired output. For instance:
```
"1.17.7"
"1.17.9"
```
## Azure cli querying
We can also use the built-in `--query` flag to obtain the right json properties of the controlPlaneProfile by setting `--query 'controlPlaneProfile.upgrades[].kubernetesVersion'`. Why? One benefit is clear, we don't need to pipe any output and use a simple one-liner. But there are more advantages! 
### Filtering the output
Another advantage is that this way of querying data is pretty powerful, let's say that we want to filer all the preview versions. We can [filter arrays](https://docs.microsoft.com/en-us/cli/azure/query-azure-cli?view=azure-cli-latest#filter-arrays) by only displaying values whenever isPreview is set to null.\
\
The upgrades array can be filtered using the `[?...]` json query operator (called a JMESPath operator). Eliminating the preview version is then done as follows \
`--query 'controlPlaneProfile.upgrades[?isPreview==null].kubernetesVersion'`\
and now only returns 
```
"1.17.7"
``` 
All logical operators and comparison operators are supported and additionally some built-in functions like `floor`, `join`, `max`, `contains` and many [other functions](https://jmespath.org/specification.html#built-in-functions). 
Quite nice already, isn't it?

Moreover we can change the output format, the default being json. If we want to do something with the output in a script or pipeline the **tab separated output** would be more useful: ` -o tsv`.\
We can now set the bash variable 
```
availableNonpreviewUpgrades=`az aks get-upgrades -g <rg-name> -n <aks-name> --query controlPlaneProfile.upgrades[?isPreview==null].kubernetesVersion -o tsv`
```
and we can now display the available upgrades with something along the lines of
```
echo "Available upgrades for AKS: $availableNonpreviewUpgrades"
```
