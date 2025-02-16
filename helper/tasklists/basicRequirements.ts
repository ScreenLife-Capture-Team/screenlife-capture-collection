import { Listr } from "listr2";
import { projectSetup } from "./projectSetup";
const { exec } = require("child_process");

export const basicRequirementsTasks = new Listr([
  {
    title: "gcloud installed",
    task: () => {
      return new Promise((resolve, reject) => {
        exec("gcloud -v", (error, stdout, stderr) => {
          if (error || !stdout.includes("Google Cloud SDK")) {
            reject(
              "\nPlease install gcloud on your machine.\nYou can find out more by visiting https://cloud.google.com/sdk/gcloud"
            );
            return;
          }
          resolve(undefined);
        });
      });
    },
  },
  {
    title: "gcloud user",
    task: (ctx, task) => {
      return new Promise((resolve, reject) => {
        exec(
          `gcloud auth list --filter=status:ACTIVE --format="value(account)"`,
          async (error, stdout, stderr) => {
            if (error || !stdout.trim()) {
              exec("gcloud auth login");
              reject(
                "\nNo active account found, running `gcloud auth login`.\nPlease login on the web interface and run the `helper` again."
              );
            }
            const activeAccount = stdout.trim();
            task.title = `gcloud user (${activeAccount})`;
            resolve(undefined);
          }
        );
      });
    },
  },
  {
    title: "gcloud application-default user",
    task: async (ctx, task) => {
      return new Promise((resolve, reject) => {
        exec(
          `curl -s -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" https://www.googleapis.com/oauth2/v1/userinfo`,
          (error, stdout, stderr) => {
            if (error || !stdout.trim()) {
              reject();
              return;
            }
            try {
              const userInfo = JSON.parse(stdout.trim());
              if (!userInfo.email) {
                exec("gcloud auth application-default login");
                reject(
                  "\nNo application-deafult account found, running `gcloud auth application-default login`.\nPlease login on the web interface and run the `helper` again."
                );
                return;
              }
              task.title = `gcloud application-default user (${userInfo.email})`;
              resolve(undefined);
            } catch (e) {
              reject(new Error("Failed to parse user info"));
            }
          }
        );
      });
    },
  },
  {
    title: "local project setup",
    task: async (ctx, task) => await projectSetup(task),
  },
]);
