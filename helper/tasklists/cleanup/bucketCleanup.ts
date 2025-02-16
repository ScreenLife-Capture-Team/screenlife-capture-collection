import { confirm } from "@inquirer/prompts";
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);
const fs = require("fs").promises;
const path = require("path");

export const deleteCloudBucket = async () => {
  // Read project config
  const configPath = path.join(__dirname, "../../project.json");
  const config = JSON.parse(await fs.readFile(configPath, "utf8"));
  const { projectId, bucketId } = config;

  const confirmed = await confirm({
    message: "Are you sure you want to delete the Cloud Storage Bucket? This action cannot be undone.",
  });

  if (!confirmed) return;

  console.log("\nDeleting Cloud Storage Bucket...");
  
  try {
    await execPromise(
      `gcloud storage rm --recursive gs://${bucketId}`
    );
    console.log("Cloud Storage Bucket deleted successfully");
  } catch (error) {
    console.error("Error deleting Cloud Storage Bucket:", error);
    throw error;
  }
};
