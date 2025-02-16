import { confirm } from "@inquirer/prompts";
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);
const fs = require("fs").promises;
const path = require("path");

export const deleteFirestoreDatabase = async () => {
  // Read project config
  const configPath = path.join(__dirname, "../../project.json");
  const config = JSON.parse(await fs.readFile(configPath, "utf8"));
  const { projectId } = config;

  const confirmed = await confirm({
    message:
      "Are you sure you want to delete the Firestore Database? This action cannot be undone.",
  });

  if (!confirmed) return;

  console.log("\nDeleting Firestore Database...");

  try {
    await execPromise(
      `gcloud firestore databases delete --project=${projectId} --database="(default)" --quiet`
    );
    console.log("Firestore Database deleted successfully");
  } catch (error) {
    console.error("Error deleting Firestore Database:", error);
    throw error;
  }
};
