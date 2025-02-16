import { ListrTask, ListrTaskWrapper } from "listr2";
import { GCP_REGIONS } from "./firestoreSetup";

const fs = require("fs").promises;
const path = require("path");
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

async function checkCloudFunctionExists(
  functionName: string,
  region: string,
  projectId: string
): Promise<boolean> {
  try {
    const { stdout } = await execPromise(
      `gcloud functions describe ${functionName} --region=${region} --project=${projectId} --format="value(name)"`
    );
    return stdout.trim().includes(functionName);
  } catch (error) {
    return false;
  }
}

interface CloudFunctionsContext {
  projectId: string;
  region?: string;
  bucketId: string;
}

async function enableRequiredAPIs(
  ctx: CloudFunctionsContext,
  task: ListrTaskWrapper<any, any, any>
): Promise<void> {
  // Enable Cloud Functions API
  task.output = "Enabling Cloud Functions API...";
  await execPromise(
    `gcloud services enable cloudfunctions.googleapis.com --project=${ctx.projectId}`
  );
  task.output = "Enabled Cloud Functions API";

  // Enable Cloud Build API
  task.output = "Enabling Cloud Build API...";
  await execPromise(
    `gcloud services enable cloudbuild.googleapis.com --project=${ctx.projectId}`
  );
  task.output = "Enabled Cloud Build API";
}

async function grantIAMPermissions(
  ctx: CloudFunctionsContext,
  task: ListrTaskWrapper<any, any, any>
): Promise<void> {
  task.output = "Retrieving project number...";
  const projectNumberResult = (await execPromise(
    `gcloud projects describe ${ctx.projectId} --format="value(projectNumber)"`
  )) as { stdout: string };
  const projectNumber = projectNumberResult.stdout.trim();
  console.log("projectNumber", projectNumber);

  task.output =
    "Granting IAM permissions to default compute service account...";
  const serviceAccount = `${projectNumber}-compute@developer.gserviceaccount.com`;
  console.log("serviceAccount", serviceAccount);
  await execPromise(
    `gcloud projects add-iam-policy-binding ${ctx.projectId} \
    --member=serviceAccount:${serviceAccount} \
    --role=roles/iam.serviceAccountTokenCreator`
  );
  task.output = "Granted IAM permissions to default compute service account";
}

async function deployCloudFunctions(
  ctx: CloudFunctionsContext,
  task: ListrTaskWrapper<any, any, any>
): Promise<void> {
  const cloudFunctionsDir = path.join("..", "collection", "cloud-functions");

  // Build the functions using TypeScript compiler
  task.output = "Building Cloud Functions...";
  await execPromise(`cd ${cloudFunctionsDir} && npx tsc`);
  task.output = "Built Cloud Functions";

  // Deploy each function
  const region = ctx.region || "asia-southeast1";
  const commonFlags = `--runtime nodejs20 --trigger-http --region ${region} --allow-unauthenticated --gen2 --set-env-vars BUCKET_ID=${ctx.bucketId}`;

  const functions = ["submitManifest", "checkManifest", "verifyRegistration"];

  for (const functionName of functions) {
    // Check if function exists
    task.output = `Checking if ${functionName} function exists...`;
    const functionExists = await checkCloudFunctionExists(
      functionName,
      region,
      ctx.projectId
    );

    if (functionExists) {
      task.output = `${functionName} function already exists, skipping deployment`;
    } else {
      task.output = `Deploying ${functionName} function...`;
      await execPromise(
        `cd ${cloudFunctionsDir} && gcloud functions deploy ${functionName} ${commonFlags}`
      );
      task.output = `Deployed ${functionName} function`;
    }

    // Deploy the function
  }
}

async function validateCloudFunctions(
  ctx: CloudFunctionsContext,
  task: ListrTaskWrapper<any, any, any>
): Promise<void> {
  const region = ctx.region || "asia-southeast1";
  const functions = ["submitManifest", "checkManifest", "verifyRegistration"];

  for (const functionName of functions) {
    task.output = `Validating ${functionName} function deployment...`;
    const functionExists = await checkCloudFunctionExists(
      functionName,
      region,
      ctx.projectId
    );
    if (!functionExists) {
      throw new Error(`Failed to validate ${functionName} function deployment`);
    }
    task.output = `${functionName} function deployment validated successfully`;
  }
}

async function checkBucketExists(
  ctx: CloudFunctionsContext,
  task: ListrTaskWrapper<any, any, any>
): Promise<void> {
  if (!ctx.bucketId) {
    throw new Error("Bucket ID is not configured in project.json");
  }

  task.output = "Checking if bucket exists...";
  try {
    await execPromise(
      `gcloud storage buckets describe gs://${ctx.bucketId} --project=${ctx.projectId}`
    );
    task.output = "Bucket exists";
  } catch (error) {
    throw new Error(`Bucket gs://${ctx.bucketId} does not exist`);
  }
}

async function getProjectConfig(): Promise<CloudFunctionsContext> {
  const projectFile = path.join("project.json");
  const projectData = JSON.parse(await fs.readFile(projectFile, "utf8"));
  return {
    projectId: projectData.projectId,
    region: projectData.region,
    bucketId: projectData.bucketId,
  };
}

export function getCloudFunctionsTasks(): ListrTask[] {
  return [
    {
      title: "Load project configuration",
      task: async (ctx: CloudFunctionsContext) => {
        const config = await getProjectConfig();
        ctx.projectId = config.projectId;
        ctx.region = config.region;
        ctx.bucketId = config.bucketId;
      },
    },
    {
      title: "Check bucket configuration",
      task: async (
        ctx: CloudFunctionsContext,
        task: ListrTaskWrapper<any, any, any>
      ) => checkBucketExists(ctx, task),
    },
    {
      title: "Enable required APIs",
      task: async (
        ctx: CloudFunctionsContext,
        task: ListrTaskWrapper<any, any, any>
      ) => enableRequiredAPIs(ctx, task),
    },
    {
      title: "Grant IAM permissions",
      task: async (
        ctx: CloudFunctionsContext,
        task: ListrTaskWrapper<any, any, any>
      ) => grantIAMPermissions(ctx, task),
    },
    {
      title: "Deploy Cloud Functions",
      task: async (
        ctx: CloudFunctionsContext,
        task: ListrTaskWrapper<any, any, any>
      ) => deployCloudFunctions(ctx, task),
    },
    {
      title: "Validate Cloud Functions",
      task: async (
        ctx: CloudFunctionsContext,
        task: ListrTaskWrapper<any, any, any>
      ) => validateCloudFunctions(ctx, task),
    },
  ];
}
