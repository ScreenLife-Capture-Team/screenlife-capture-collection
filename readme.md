# ScreenLife Capture

## Overview
This repository contains the source code for the ScreenLife Capture project. The repository is split into two main sections:

1. Collection - for components related to the "collection" phase of a study
2. Labelling - for components related to the "labelling" phase of a study

Please find more details in each section.

## Setup

### Prerequisites
To run the various components of this monorepo, please ensure you have the following installed:

1. `node` (> v20.17.0) required
2. `npm` (> v10.8.2) required
3. `gcloud` required (for the collection components)
4. `git` is highly recommended to be able to update the repo for the latest features / bug fixes

### Installing Dependancies
If you would like to run an individual component of the monorepo (e.g. running the management interface, deploying cloud functions, or running the labelling platform), please follow the installation command within their respective sections. You will be asked to install dependancies for that indiviual component using `npm run install-<component>` in their respective folders.

If you would like to install the dependancies for all components (or if you are simply not sure what you will be running on the repository), please use the command `npm run install-all` in the root folder. After doing this, you will not need to perform the individual installation commands.

For instructions on how to proceed after installing the dependancies for all components, please navigate to the [collection](./collection/readme.md) or [labelling](./labelling/readme.md) READMEs.