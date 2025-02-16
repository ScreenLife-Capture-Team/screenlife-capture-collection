import { confirm, select } from "@inquirer/prompts";
import { ListrInquirerPromptAdapter } from "@listr2/prompt-adapter-inquirer";
import { ListrTask, ListrTaskWrapper } from "listr2";
import { GCP_REGIONS } from "./firestoreSetup";

const fs = require("fs").promises;
const path = require("path");
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

async function checkBucketExists(bucketId: string) {
  try {
    const { stdout } = await execPromise(
      `gcloud storage buckets list --format="value(name)" | grep "^${bucketId}$"`
    );
    return stdout.trim() === bucketId;
  } catch (error) {
    return false;
  }
}

interface BucketContext {
  projectId: string;
  region?: string;
  bucketId?: string;
}

async function checkAndSetBucketConfig(
  ctx: BucketContext,
  task: ListrTaskWrapper<any, any, any>
): Promise<void> {
  const projectFile = path.join("./", "project.json");
  const projectData = JSON.parse(await fs.readFile(projectFile, "utf8"));

  // Check and set region if missing
  if (!projectData.region) {
    task.output = "Selecting region...";
    const region = await task.prompt(ListrInquirerPromptAdapter).run(select, {
      message: "Select a GCP region for the bucket:",
      choices: GCP_REGIONS.map((region) => ({
        value: region,
        name: region,
      })),
    });

    projectData.region = region;
    task.output = `Set region to ${region}`;
  }

  // Check and set bucketId if missing
  if (!projectData.bucketId) {
    const defaultBucketId = `${projectData.projectId}-storage`;
    task.output = "Selecting bucket ID...";
    const bucketId = await task.prompt(ListrInquirerPromptAdapter).run(select, {
      message: "Bucket ID not found in projet.json. Pleaes enter a bucket ID:",
      choices: [
        {
          value: defaultBucketId,
          name: `Default (${defaultBucketId})`,
        },
        {
          value: "custom",
          name: "Custom bucket ID",
        },
      ],
    });

    projectData.bucketId =
      bucketId === "custom"
        ? await task.prompt(ListrInquirerPromptAdapter).run(select, {
            message: "Enter custom bucket ID:",
            choices: [
              {
                value: defaultBucketId,
                name: defaultBucketId,
              },
            ],
          })
        : bucketId;

    task.output = `Set bucket ID to ${projectData.bucketId}`;
  }

  await fs.writeFile(projectFile, JSON.stringify(projectData, null, 2));
  ctx.region = projectData.region;
  ctx.bucketId = projectData.bucketId;
}

async function createBucketIfNeeded(
  ctx: BucketContext,
  task: ListrTaskWrapper<any, any, any>
): Promise<void> {
  task.output = "Checking if bucket exists...";
  const bucketExists = await checkBucketExists(ctx.bucketId!);
  if (!bucketExists) {
    const createBucket = await task
      .prompt(ListrInquirerPromptAdapter)
      .run(select, {
        message: `Bucket ${ctx.bucketId} does not exist. Create it?`,
        choices: [
          { value: "yes", name: "Yes" },
          { value: "no", name: "No" },
        ],
      });

    if (createBucket === "yes") {
      task.output = "Creating storage bucket...";
      try {
        await execPromise(
          `gcloud storage buckets create gs://${ctx.bucketId} --project=${ctx.projectId} --location=${ctx.region}`
        );
        task.output = "Storage bucket created successfully";

        task.output = "Setting bucket CORS configuration...";
        const corsConfig = [
          {
            origin: ["*"],
            method: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            responseHeader: ["Content-Type", "Access-Control-Allow-Origin"],
            maxAgeSeconds: 3600,
          },
        ];
        const corsFile = path.join("./", "cors.json");
        await fs.writeFile(corsFile, JSON.stringify(corsConfig));
        await execPromise(
          `gcloud storage buckets update gs://${ctx.bucketId} --cors-file=${corsFile}`
        );
        await fs.unlink(corsFile);
        task.output = "Bucket CORS configuration set successfully";
      } catch (error: any) {
        if (
          error.stderr?.includes(
            "The billing account for the owning project is disabled"
          )
        ) {
          task.output = `Billing needs to be enabled for project ${ctx.projectId}`;
          const proceed = await task
            .prompt(ListrInquirerPromptAdapter)
            .run(confirm, {
              message: `You will need enable billing for project ${ctx.projectId} before proceeding. Press enter to open the GCP billing page where you can enable billing for your project`,
              default: true,
            });

          if (proceed) {
            await execPromise(
              `open "https://console.cloud.google.com/billing/projects"`
            );
            throw new Error(
              `Please enable billing for project ${ctx.projectId} and try again`
            );
          } else {
            throw new Error("Bucket creation cancelled - billing not enabled");
          }
        }
        throw error;
      }
    } else {
      throw new Error("Bucket creation cancelled");
    }
  } else {
    task.output = "Bucket already exists";
  }
}

async function validateBucket(
  ctx: BucketContext,
  task: ListrTaskWrapper<any, any, any>
): Promise<void> {
  task.output = "Validating bucket creation...";
  const bucketExists = await checkBucketExists(ctx.bucketId!);
  if (!bucketExists) {
    throw new Error(`Failed to validate bucket creation: ${ctx.bucketId}`);
  }
  task.output = "Bucket creation validated successfully";
}

export function getBucketTasks(): ListrTask[] {
  const ctx: BucketContext = { projectId: "" };

  return [
    {
      title: "Loading project configuration",
      task: async (ctx, task) => {
        task.output = "Loading project configuration...";
        const projectFile = path.join("./", "project.json");
        const projectData = JSON.parse(await fs.readFile(projectFile, "utf8"));
        ctx.projectId = projectData.projectId;
        task.title = `Project configuration loaded (${ctx.projectId})`;
      },
    },
    {
      title: "Checking and setting bucket configuration",
      task: async (ctx, task) => checkAndSetBucketConfig(ctx, task),
    },
    {
      title: "Create bucket if needed",
      task: async (ctx, task) => createBucketIfNeeded(ctx, task),
    },
    {
      title: "Validate bucket",
      task: async (ctx, task) => validateBucket(ctx, task),
    },
  ];
}
