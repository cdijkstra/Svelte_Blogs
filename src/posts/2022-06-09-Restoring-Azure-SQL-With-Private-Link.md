---
layout: post
title:  "Restoring Azure SQL DBs using Private Link"
date: '2022-06-09 11:15:00 +0100'
tags: Azure Aql Pipelines Privatelink
image: privatelinksymbol.png
---

## Transferring data across a private link
Two non-trivial situations occur when using a private link to restore a SQL database using a private link; (1) the export gets stuck on 1% and (2) the SQL credentials are modified after restoring. Let's find out how to solve those issues.

My colleagues and I are setting up a test environment for a customer that already has the Acceptance and Production environments defined in code. The IaC is written in ARM, you can expect a blog soon about how to convert that to bicep.
We could relatively easily deploy a test environment by providing `parameter.t.json` files and deploying the resource groups to a new subscription using `az deployment group -l $location --template-file template.json --parameters parameters.t.json` with a valid `$location` parameter. The cloud environment contains a SQL server group with the following characteristics:
- 4 databases ✅
- SQL failover group ✅
- Deployed without any data.

In order to retrieve data we decided to backup and restore the existing database from Acceptance (which does not contain sensitive customer data, so that should be fine to make it accessible on test).

## Possible solutions
Two options came to mind; SSMS and Azure SQL exports. I could think of these benefits and potential drawbacks;

- SQL Server Management Studio - Export Wizard 🧙‍♂️
  - **Pros**:
    * Facilitates easy cross-database data migrations, with possibility of customization as to which data should and should not be transferred. Also mappings can be made between the origin and source database, so if certain information should not be transferred (or set to NULL) this could be defined easily.
  - **Cons**:
    * Requires your laptop to do the work. In case of large data transferral, this option is not ideal.
- Azure SQL backup and restore options 🗄️
  - **Pros**:
    * The backup and restore mechanism is very easy to use. All you need is a blob storage to export the data. The database can be restored from there using the import database functionality provided by Azure SQL.

    * The cloud takes over, so no need to keep your laptop running. Particularly useful in case of big data transfers.

    * Both the import/exports action support Private Links (currently in public preview). This means that data is transferred over the Azure private backbone, eliminating the chance of accidentally exposing the data to others (unless the blob storage is publicly accessible, this should really be avoided🙅)
  - **Cons**:
    * Potential data breach when storage account is publicly accessible.
    * One more, but you'll find out below ;)

Because the export would take a while, we made SQL Azure with private link support our weapon of choice.

## First step: Exporting
The export can be created straightforwardly using the Export button on SQL database
![SQL]({{ site.baseurl }}/images/SQL.png)
Afterwards the Private Link option can be selected. Note the mentioned message: we have to manually approve the link from the Private Link tab in Azure! If not, the export remains stuck on 1\% without a message on what steps to take.

![Backup]({{ site.baseurl }}/images/backup.png)

After a few minutes, the link can be approved here:

![Private link]({{ site.baseurl }}/images/private-link.png)

The nice thing about these links is that they are removed automatically after the backup process.

## Second step: Importing
Once the backup is completed, the import can be done identically with a private link from the target SQL SERVER (not database). *The database, if it already exists, has to be deleted first*. We can then import the database, where the private link requires approval again.

## Third step (Wait, a third step?)
We expected that this would be all, but we noted an issue. *We could not log in to the database with our previously configured accounts!* Close, but no cigar.

The reason is that the export more than just the db scheme and contained data; the whole database including stored procedures and *user accounts* is restored. This means that you can only log in with the user/password (or AD users/groups if configured that way - I *do* recommend it, but that's for another time) that are stored on the source database. Rolling out the IaC again did not overwrite the log in settings, so what I recommend is the following:
- Log in with the most privileged account configured on the source database, but on the target database using SSMS.
- Reset the password of the admin user using [this manual](https://manage.accuwebhosting.com/knowledgebase/2131/How-to-change-password-for-MS-SQL-admin-user.html).
- If applicable, change passwords of other user accounts in the `Security/Users` section.

## Conclusion
Azure SQL import/export is powerful and allows for a secure way of transferring data from A to B. Is it the preferred choice when transferring large amounts of data and/or sensitive data. However, the fact that you cannot log in as you expect on the target database is rather unexpected and requires a few additional steps. Once you're aware of it, not a big problem.