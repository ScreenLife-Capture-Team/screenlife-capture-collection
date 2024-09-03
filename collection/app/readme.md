# ScreenLife Capture - Collection App

## App Setup

### Prerequisites
Before you begin, ensure you have met the following requirements:

- **Android Studio**: Make sure you have Android Studio installed. The recommended version can be found in the `build.gradle` file of the project.
- **JDK**: Java Development Kit (JDK) 11 or higher is required.
- **Android SDK**: Ensure that the required Android SDK platforms and build tools are installed.


### Open the Project in Android Studio
1. Launch Android Studio.
2. Select **Open an Existing Project** from the welcome screen or go to `File > Open...`.
3. Navigate to the project directory (this folder) and click **OK**.
4. Android Studio will start syncing the project. If it prompts you to install additional tools or plugins, follow the instructions to complete the setup.

### Sync Gradle
Once the project is open, Android Studio should automatically start syncing the Gradle files. If it doesn't:

1. Go to `File > Sync Project with Gradle Files`.
2. Wait for the sync to complete. This process may take a few minutes depending on your internet speed and the complexity of the project.

### Build the APK
To build the APK:

1. Go to `Build > Build Bundle(s) / APK(s) > Build APK(s)`.
2. Android Studio will start the build process. Once completed, you will see a notification in the bottom-right corner.
3. Click on **Locate** to find the generated APK file, typically located in `app/build/outputs/apk/`.

## Running the Application
You can install the generated APK on a physical device or an emulator:

1. Transfer the APK to your device.
2. Enable installation from unknown sources if prompted.
3. Install the APK and launch the application.

## Troubleshooting
- **Gradle Sync Issues**: If you encounter problems with Gradle sync, try the following:
  - Ensure you have a stable internet connection.
  - Go to `File > Invalidate Caches / Restart...` and restart Android Studio.
- **Build Failures**: Check the `Build` tab at the bottom of Android Studio for error messages. Common issues might include missing dependencies or incorrect SDK versions.
