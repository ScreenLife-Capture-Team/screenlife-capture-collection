# ScreenLife Research Platform

## Overview
ScreenLife is a research platform designed to systematically capture and analyze smartphone usage patterns through periodic screenshots. The platform implements industry-standard encryption protocols to ensure secure data collection and transmission. This repository contains both the data collection Android application and the research data management infrastructure.

The repository is organized into two main components:

1. **Collection** - Contains the Android application and cloud infrastructure for secure data collection
2. **Labelling** - Contains tools and interfaces for research data analysis and labeling

## Important Notice
This platform is strictly for authorized research purposes only. Users must have formal consent to participate in research studies utilizing this platform. If you have not provided formal consent, please do not attempt to use or install the application.

## Technical Architecture

### Android Application
The collection app is built with Kotlin using modern Android architecture components:
- MediaProjection API for secure screen capture
- WorkManager for reliable background upload services
- Encrypted local storage for data security
- WiFi and device state management
- Background service auto-start capability
- Push notification system for participant communication

### Cloud Infrastructure
The platform uses Google Cloud Platform for secure data storage and processing. Key components:
- Cloud Functions for data processing
- Cloud Storage for encrypted data
- Authentication and access control systems
- Research management interface

## Setup Requirements

### Prerequisites
1. `node` (> v20.17.0)
2. `npm` (> v10.8.2)
3. `gcloud` CLI tools
4. `git` (recommended)
5. Android development environment for app modifications

### Cloud Environment Setup
Configure your GCP project:
   - Run `npm run helper` and follow the guided setup
   - This will configure necessary cloud resources and security settings
   - You'll need GCP project owner permissions for initial setup

### Technical Knowledge Requirements
To work with this repository, you should be familiar with:
- Modern Android development (Kotlin, AndroidX libraries)
- Node.js and TypeScript for cloud functions
- Google Cloud Platform services
- Security best practices for handling research data
- Git version control

For detailed setup instructions, please refer to the respective README files in the [collection](./collection/readme.md) and [labelling](./labelling/readme.md) directories.