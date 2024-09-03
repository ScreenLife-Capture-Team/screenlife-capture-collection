# ScreenLife Capture - Collection

## Overview
Here are the general steps when collecting data using ScreenLife Capture:

1. Setup the required cloud resources (i.e. create a Google Cloud Platform account, create a Cloud Bucket, setup required Cloud Functions).
2. Setup the Management Interface (MI) and create a project.
3. Generate / obtain the Android App (APK).
4. Register participants using the MI.
5. Every morning, the App will upload existing images to the Cloud Bucket.
6. Upon completion of the project, the participant should remove the App from their device.

## Setup Cloud Resources
1. [Create a Google Cloud Platform](https://cloud.google.com/) account.
2. Create a Project.
   1. Note the "Project ID"
   2. [Enable the following APIs](https://console.cloud.google.com/apis/dashboard):
      1. Cloud Firestore API
      2. Cloud Functions API
      3. Cloud Build API
3. [Create a Google Cloud Bucket](https://www.youtube.com/watch?v=gRMQT66tFLU).
   1. Note the Google Cloud Bucket ID used.
   2. For "Location type", choose "Region" and find the region closest to your study.
   3. You can use the default selections for the rest of the options.
4. [Create a Firestore Database](https://console.cloud.google.com/firestore)
   1. For the Database ID, leave it as "(default)"
   2. For "Location type", choose "Region" and find the region closest to your study.
5. Add the required permission to the Default Service Account
   1. In the left-hand navigation pane, go to IAM & Admin > IAM.
   2. Look for the Default Service Account, typically named in the format: `PROJECT_ID@appspot.gserviceaccount.com`
   3. Click "GRANT ACCESS"
   4. Under "New principals", select the Default Service Account, and under "Role", select "Service Account Token Creator"
   5. Click "Save"
   > Technical Note: This is required to allow the Cloud Functions to create pre-signed URLs
6. [Install `gcloud`](https://cloud.google.com/sdk/docs/downloads-interactive).
7. Authenticate `gcloud` by using the command `gcloud auth login`.
8. Set the project on `gcloud` by running `gcloud config set project <projectId>`
9.  Set the application's default credentials by running `gcloud auth application-default login`
10. Deploy the required cloud functions: 
   1. Update the Bucket ID in `/collection/cloud-functions/src/index.ts`.
   2. Run `npm run install-cf` in this folder, `/collection`
   > Note: Please check if you are required to run the above command by checking the "Installing Dependancies" section in the [root's README](../readme.md).
   3. Run `npm run deploy-cf` in this folder, `/collection`
   4. Note the "httpsTrigger"'s base URL (e.g. https://asia-southeast1-project-12345678.cloudfunctions.net).
      - This URL will typically end with ".net" or ".com", ignore the actual name of the function (e.g. "submitManifest")

## Setup Management Interface
1. Install the required dependancies for the management interface using the command npm run install-mi in this folder, /collection.
2. Update the Bucket ID in `/collection/management-interface/server/config/default.json`.
3. Run the command `npm run mi` in this folder, `/collection` to start the management interface
4. Open the management interface in the browser at "http://localhost:3000"
> If you encounter an error with the code "EADDRINUSE", please check the "Common Issues" section for troubleshooting steps.
5. To shutdown the platform, use `Ctrl+C` in the terminal.

## Create Project and Register a Participant
1. In the Management Interface, create a new project, and fill in the base url appropriately. 
2. Send the APK to the participant's device.
3. In the Management Interface, click "Register Participant", and scan the QR code using the ScreenLife Capture app on the participant's device.
4. The app and Management Interface should verify that the user has been registered.

## Common Issues

#### Missing Script
`npm ERR! Missing script: deploy-cf`

If you receive an error similar to the above, it indicates that you are performing the command in the wrong folder. Please read the instructions again and retry the command in the appropriate folder. To ensure that you are in the correct folder, you can check the folder's `package.json` file, which would include the script's name under the `scripts` section.

#### "Unable to retrieve repository metadata"
`ResponseError: status=[403], code=[Ok], message=[Unable to retrieve the repository metadata for projects/<...>/repositories/gcf-artifacts. Ensure that the Cloud Functions service account has 'artifactregistry.repositories.list' and 'artifactregistry.repositories.get' permissions. You can add the permissions by granting the role 'roles/artifactregistry.reader'.]`

If you receive an error similar to the above, try to run the command again after waiting for a few minutes.

#### "Default service account doesn't exist"
`ResponseError: status=[400], code=[Ok], message=[Default service account '<...>@appspot.gserviceaccount.com' doesn't exist. Please recreate this account or specify a different account. Please visit https://cloud.google.com/functions/docs/troubleshooting for in-depth troubleshooting documentation.]`

The above error seems to occur when trying to deploy a Cloud Function that already exists. This issue seems to have only manifested in August 2024, as deploying an already existing function has been working for many years. The work-around is to delete the existing Cloud Function, either through the Web Console or through `gcloud functions delete {{function-name}}`.

#### EADDRINUSE
`[server] code: 'EADDRINUSE'`

This error indicates that the server is trying to listen on a port that another app is already listening on. This usually means that you are trying to run two instances of the server at the same time. Please try closing all terminals, or restart the machine.

#### Error: 5 NOT_FOUND
This error indicates that there is an issue with connecting to the Cloud Firestore. Please ensure that you have created a Firestore database on the project, and that the ID is `(default)`.

#### Error: 7 PERMISSION_DENIED
This error indicates that a particular GCP service / API has not been enabled. Enable the required API at [this link](https://console.cloud.google.com/apis/dashboard).

#### SQLITE_ERROR
```[server] error: BadRequest: select `operations`.* from `operations` order by `ccreatedAt` desc limit 10 - SQLITE_ERROR: no such table: operations```

The error above implies that the SQLITE database is missing or malformed. Ensure that the file `local.sqlite` exists in `/collection/management-interface/server`. If not, you can run the command `npm run migrate` in the above folder.

