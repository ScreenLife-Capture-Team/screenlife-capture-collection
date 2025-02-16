import { confirm } from "@inquirer/prompts";
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);
const fs = require("fs").promises;
const path = require("path");

export const deleteCloudRunFunctions = async () => {
  // Read project config
  const configPath = path.join(__dirname, "../../project.json");
  const config = JSON.parse(await fs.readFile(configPath, "utf8"));
  const { projectId, region } = config;

  const confirmed = await confirm({
    message:
      "Are you sure you want to delete all Cloud Run Functions? This action cannot be undone.",
  });

  if (!confirmed) return;

  console.log("\nDeleting Cloud Run Functions...");

  try {
    const { stdout } = await execPromise(
      `gcloud functions list --regions=${region} --project=${projectId} --format="value(name)"`
    );

    const functions = stdout.split("\n").filter((f) => f);

    for (const func of functions) {
      console.log(`Deleting function: ${func}`);
      await execPromise(
        `gcloud functions delete ${func} --region=${region} --project=${projectId} --quiet`
      );
    }

    console.log("Cloud Run Functions deleted successfully");
  } catch (error) {
    console.error("Error deleting Cloud Run Functions:", error);
    throw error;
  }
};
