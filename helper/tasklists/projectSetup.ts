import { input, select } from "@inquirer/prompts";
import { ListrInquirerPromptAdapter } from "@listr2/prompt-adapter-inquirer";
import { ListrTaskWrapper } from "listr2";

const fs = require("fs").promises;
const path = require("path");
const { exec } = require("child_process");

async function getExistingProjects() {
  return new Promise<string[]>((resolve, reject) => {
    exec(
      `gcloud projects list --format="value(PROJECT_ID)"`,
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Failed to list projects: ${error.message}`));
          return;
        }
        const projects = stdout.trim().split("\n");
        resolve(projects);
      }
    );
  });
}

export async function projectSetup(task: ListrTaskWrapper<any, any, any>) {
  try {
    task.output = "Loading project configuration...";
    const projectFile = path.join("./", "project.json");
    const projectData = JSON.parse(await fs.readFile(projectFile, "utf8"));
    const projectId = projectData.projectId;

    task.output = "Checking project existence...";
    const existingProjects = await getExistingProjects();
    if (!existingProjects.includes(projectId)) {
      throw new Error(
        `Project ${projectId} does not exist in your gcloud projects`
      );
    }

    task.title = `project setup (${projectId})`;
    return projectId;
  } catch (error) {
    async function createNewProject(projectId: string) {
      return new Promise<void>((resolve, reject) => {
        exec(`gcloud projects create ${projectId}`, (error, stdout, stderr) => {
          if (error) {
            reject(new Error(`Failed to create project: ${error.message}`));
            return;
          }
          resolve();
        });
      });
    }

    task.output = "Prompting for project creation choice...";
    const choice = (await task.prompt(ListrInquirerPromptAdapter).run(select, {
      message: "No active project found. Would you like to:",
      choices: [
        { value: "new", name: "Create a new project" },
        { value: "existing", name: "Use an existing project" },
      ],
    })) as string;

    let projectId;
    if (choice === "new") {
      task.output = "Prompting for new project ID...";
      projectId = await task.prompt(ListrInquirerPromptAdapter).run(input, {
        message:
          "Enter a new project ID (must be lowercase letters, numbers, and hyphens):",
        required: true,
      });

      task.output = "Creating new project...";
      await createNewProject(projectId);
      task.output = `Project ${projectId} created successfully`;
    } else {
      task.output = "Fetching existing projects...";
      const existingProjects = await getExistingProjects();
      if (existingProjects.length === 0) {
        throw "No existing projects found in your gcloud account";
      }

      task.output = "Selecting existing project...";
      projectId = (await task.prompt(ListrInquirerPromptAdapter).run(select, {
        message: "Select an existing project:",
        choices: existingProjects.map((p) => ({
          value: p,
          label: p,
        })),
      })) as string;
    }

    task.output = "Saving project configuration...";
    await fs.writeFile(
      path.join("project.json"),
      JSON.stringify({ projectId }, null, 2)
    );
    task.output = "Project configuration saved successfully";
  }
}
