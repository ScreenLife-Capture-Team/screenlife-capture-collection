import { ListrTaskWrapper } from "listr2";
import * as path from "path";
import * as fs from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

interface ManagementInterfaceContext {
  bucketId?: string;
}

async function installDependencies(
  ctx: ManagementInterfaceContext,
  task: ListrTaskWrapper<any, any, any>
): Promise<void> {
  const managementInterfacePath = path.join("../");
  task.output = "Installing management interface server dependencies...";
  await execPromise("npm ci -w ./collection/management-interface/server", {
    cwd: managementInterfacePath,
  });
  task.output = "Installing management interface webapp dependencies...";
  await execPromise("npm ci -w ./collection/management-interface/webapp", {
    cwd: managementInterfacePath,
  });
}

async function compileAndMigrate(
  ctx: ManagementInterfaceContext,
  task: ListrTaskWrapper<any, any, any>
): Promise<void> {
  task.output = "Compiling and migrating server...";
  const managementInterfacePath = path.join("../");
  await execPromise(
    "npm run -w ./collection/management-interface/server compile-migrate",
    { cwd: managementInterfacePath }
  );
}

async function updateConfigurations(
  ctx: ManagementInterfaceContext,
  task: ListrTaskWrapper<any, any, any>
): Promise<void> {
  task.output = "Updating configuration files...";

  // Update management interface server config
  const miConfigPath = path.join(
    "../",
    "collection",
    "management-interface",
    "server",
    "config",
    "default.json"
  );
  const miConfig = JSON.parse(await fs.readFile(miConfigPath, "utf-8"));
  miConfig.bucketId = ctx.bucketId;
  await fs.writeFile(miConfigPath, JSON.stringify(miConfig, null, 2));
}

async function loadBucketConfig(
  ctx: ManagementInterfaceContext,
  task: ListrTaskWrapper<any, any, any>
): Promise<void> {
  task.output = "Loading bucket configuration...";
  const projectFile = path.join(process.cwd(), "project.json");
  const projectData = JSON.parse(await fs.readFile(projectFile, "utf8"));

  if (!projectData.bucketId) {
    throw new Error(
      "bucketId not found in project.json. Please run bucket setup first."
    );
  }

  ctx.bucketId = projectData.bucketId;
  task.output = `Loaded bucket ID: ${ctx.bucketId}`;
}

async function enableRequiredAPIs(
  ctx: ManagementInterfaceContext,
  task: ListrTaskWrapper<any, any, any>
): Promise<void> {
  // Enable Admin API
  task.output = "Enabling Admin API...";
  await execPromise(`gcloud services enable run.googleapis.com`);
  task.output = "Enabled Cloud Run Admin API";
}

export function getManagementInterfaceTasks() {
  return [
    {
      title: "Enable required APIs",
      task: enableRequiredAPIs,
    },
    {
      title: "Load Bucket Configuration",
      task: loadBucketConfig,
    },
    {
      title: "Install Management Interface Dependencies",
      task: installDependencies,
    },
    {
      title: "Compile and Migrate Server",
      task: compileAndMigrate,
    },
    {
      title: "Update Configuration Files",
      task: updateConfigurations,
    },
  ];
}
