import { select } from "@inquirer/prompts";
import { ListrInquirerPromptAdapter } from "@listr2/prompt-adapter-inquirer";
import { ListrTask, ListrTaskWrapper } from "listr2";

const fs = require("fs").promises;
const path = require("path");
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

export const GCP_REGIONS = [
  "asia-east1",
  "asia-northeast1",
  "asia-south1",
  "asia-southeast1",
  "australia-southeast1",
  "europe-central2",
  "europe-west1",
  "europe-west2",
  "europe-west3",
  "us-central1",
  "us-east1",
  "us-east4",
  "us-west1",
  "us-west2",
  "us-west3",
  "us-west4",
];

async function checkFirestoreExists(projectId: string) {
  try {
    const { stdout } = await execPromise(
      `gcloud firestore databases list --project=${projectId} --format="value(name)"`
    );
    return stdout.includes("(default)");
  } catch (error) {
    return false;
  }
}

interface FirestoreContext {
  projectId: string;
  region?: string;
}

async function checkAndSetRegion(
  ctx: FirestoreContext,
  task: ListrTaskWrapper<any, any, any>
): Promise<void> {
  task.output = "Loading project configuration...";
  const projectFile = path.join("project.json");
  const projectData = JSON.parse(await fs.readFile(projectFile, "utf8"));

  if (!projectData.region) {
    task.output = "Selecting region...";
    const region = await task.prompt(ListrInquirerPromptAdapter).run(select, {
      message: "Select a GCP region for Firestore:",
      choices: GCP_REGIONS.map((region) => ({
        value: region,
        name: region,
      })),
    });

    projectData.region = region;
    task.output = "Saving region configuration...";
    await fs.writeFile(projectFile, JSON.stringify(projectData, null, 2));
    task.output = `Region set to ${region}`;
  }

  ctx.region = projectData.region;
}

async function enableFirestoreAPI(
  ctx: FirestoreContext,
  task: ListrTaskWrapper<any, any, any>
): Promise<void> {
  task.output = "Enabling Firestore API...";
  await execPromise("gcloud services enable firestore.googleapis.com");
  task.output = "Firestore API enabled successfully";
}

async function createFirestoreIfNeeded(
  ctx: FirestoreContext,
  task: ListrTaskWrapper<any, any, any>
): Promise<void> {
  task.output = "Checking if Firestore exists...";
  const firestoreExists = await checkFirestoreExists(ctx.projectId);
  if (!firestoreExists) {
    task.output = "Creating Firestore database...";
    await execPromise(
      `gcloud firestore databases create --location=${ctx.region} --project=${ctx.projectId}`
    );
    task.output = "Firestore database created successfully";
  } else {
    task.output = "Firestore database already exists";
  }
}

async function validateFirestore(
  ctx: FirestoreContext,
  task: ListrTaskWrapper<any, any, any>
): Promise<void> {
  task.output = "Validating Firestore database creation...";
  const databaseCreated = await checkFirestoreExists(ctx.projectId);
  if (!databaseCreated) {
    throw new Error("Failed to validate Firestore database creation");
  }
  task.output = "Firestore database creation validated successfully";
}

async function loadProjectConfiguration(
  ctx: FirestoreContext,
  task: ListrTaskWrapper<any, any, any>
): Promise<void> {
  task.output = "Loading project configuration...";
  const projectFile = path.join("project.json");
  const projectData = JSON.parse(await fs.readFile(projectFile, "utf8"));
  ctx.projectId = projectData.projectId;
  task.title = `Project configuration loaded (${ctx.projectId})`;
}

export function getFirestoreTasks(): ListrTask[] {
  const ctx: FirestoreContext = { projectId: "" };

  return [
    {
      title: "Loading project configuration",
      task: async (ctx, task) => loadProjectConfiguration(ctx, task),
    },
    {
      title: "Configure Firestore region",
      task: async (ctx, task) => checkAndSetRegion(ctx, task),
    },
    {
      title: "Enable Firestore API",
      task: async (ctx, task) => enableFirestoreAPI(ctx, task),
    },
    {
      title: "Create Firestore database",
      task: async (ctx, task) => createFirestoreIfNeeded(ctx, task),
    },
    {
      title: "Validate Firestore database",
      task: async (ctx, task) => validateFirestore(ctx, task),
    },
  ];
}
