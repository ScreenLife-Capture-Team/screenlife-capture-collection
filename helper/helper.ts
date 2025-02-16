import colors from "yoctocolors";
import { select, Separator } from "@inquirer/prompts";
import { v2 } from "@google-cloud/run";
import { basicRequirementsTasks } from "./tasklists/basicRequirements";
import { Listr } from "listr2";
import { getFirestoreTasks } from "./tasklists/firestoreSetup";
import { getBucketTasks } from "./tasklists/bucketSetup";
import { getCloudFunctionsTasks } from "./tasklists/cloudRunFunctionsSetup";
import { deleteCloudRunFunctions } from "./tasklists/cleanup/cloudRunFunctionsCleanup";
import { deleteCloudBucket } from "./tasklists/cleanup/bucketCleanup";
import { deleteFirestoreDatabase } from "./tasklists/cleanup/firestoreCleanup";
import { getManagementInterfaceTasks } from "./tasklists/managementInterfaceSetup";
import os from "os";
import { execSync } from "child_process";
import path from "path";

const ServicesClient = v2.ServicesClient;

const main = async () => {
  console.log(
    colors.bgWhite("== Welcome to the ScreenLife Capture Helper! ==")
  );
  console.log(`OS: ${os.platform()} ${os.release()}`);
  console.log(`Node version: ${process.version}`);
  console.log(`NPM version: ${execSync("npm --version").toString().trim()}`);
  console.log("");

  // Basic
  console.log("Checking basic requirements..");
  try {
    await basicRequirementsTasks.run();
  } catch (e) {
    console.error(e);
    return;
  }

  console.log("\nBasic requirements okay 👍");

  async function runManagementInterface(): Promise<void> {
    console.log("\nStarting Management Interface...");
    try {
      const collectionPath = path.join("..", "collection");
      await execSync("npm run mi", {
        cwd: collectionPath,
        stdio: "inherit",
      });
    } catch (error) {
      console.error("Failed to start management interface:", error);
      throw error;
    }
  }

  while (true) {
    // Main options
    console.log("");

    try {
      const answer = await select({
        message: "What would you like to do?",
        choices: [
          new Separator(),
          {
            name: "Setup All",
            value: "setup-all",
          },
          new Separator(),
          {
            name: "Setup Cloud Bucket",
            value: "setup-cloud-bucket",
          },
          {
            name: "Setup Firestore Database",
            value: "setup-firestore-database",
          },
          {
            name: "Setup Cloud Run Functions",
            value: "setup-cloud-run-functions",
          },
          {
            name: "Setup Management Interface",
            value: "setup-management-interface",
          },
          new Separator(),
          {
            name: "Run Management Interface",
            value: "run-management-interface",
          },
          new Separator(),
          {
            name: "Delete Cloud Bucket",
            value: "delete-cloud-bucket",
          },
          {
            name: "Delete Firestore Database",
            value: "delete-firestore-database",
          },
          {
            name: "Delete Cloud Run Functions",
            value: "delete-cloud-run-functions",
          },
          new Separator(),
        ],
        loop: false,
        pageSize: 15,
      });

      if (answer === "setup-all") {
        try {
          console.log("\nSetting up Cloud Run Functions..");
          await new Listr(getCloudFunctionsTasks()).run();

          console.log("\nSetting up Cloud Bucket..");
          await new Listr(getBucketTasks()).run();

          console.log("\nSetting up Firestore..");
          await new Listr(getFirestoreTasks()).run();

          console.log("\nSetting up Management Interface..");
          await new Listr(getManagementInterfaceTasks()).run();

          console.log("Setup is done 👍");
        } catch (e) {
          return;
        }
      }

      if (answer === "setup-cloud-run-functions") {
        try {
          console.log("\nSetting up Cloud Run Functions..");
          await new Listr(getCloudFunctionsTasks()).run();
        } catch (e) {
          return;
        }
      }

      if (answer === "setup-cloud-bucket") {
        try {
          console.log("\nSetting up Cloud Bucket..");
          await new Listr(getBucketTasks()).run();
        } catch (e) {
          return;
        }
      }

      if (answer === "setup-firestore-database") {
        try {
          console.log("\nSetting up Firestore..");
          await new Listr(getFirestoreTasks()).run();
        } catch (e) {
          return;
        }
      }

      if (answer === "setup-management-interface") {
        try {
          console.log("\nSetting up Management Interface..");
          await new Listr(getManagementInterfaceTasks()).run();
        } catch (e) {
          return;
        }
      }

      if (answer === "run-management-interface") {
        await runManagementInterface();
      } else if (answer === "delete-cloud-bucket") {
        try {
          await deleteCloudBucket();
        } catch (e) {
          return;
        }
      }

      if (answer === "delete-cloud-run-functions") {
        try {
          await deleteCloudRunFunctions();
        } catch (e) {
          return;
        }
      }

      if (answer === "delete-firestore-database") {
        try {
          await deleteFirestoreDatabase();
        } catch (e) {
          return;
        }
      }
    } catch (err: any) {
      if ((err.name = "ExitPromptError")) {
        break;
      }
      console.log(err);
    }
  }
};

main();
