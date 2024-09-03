import io from "socket.io-client";
import socketio from "@feathersjs/socketio-client";
import {
  createClient,
  ServiceTypes,
} from "screenlife-collection-management-interface-server";
import { queryClient } from "./app/providers";

// @ts-ignore
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "localhost:3090";
if (!API_BASE_URL) console.error("API_BASE_URL EMPTY");
console.log("API_BASE_URL:", API_BASE_URL);

const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV;
console.log("APP_ENV:", APP_ENV);

export const socket = io(API_BASE_URL, {
  forceNew: true,
  autoConnect: !!API_BASE_URL, // don't connect during testing
});

const socketClient = socketio<ServiceTypes>(socket);
const app = createClient(socketClient);

app.service("operations").on("created", (data) => {
  queryClient.refetchQueries({ queryKey: ["operations"] });
  queryClient.refetchQueries({ queryKey: ["participants"] });
});
app.service("operations").on("patched", (data) => {
  queryClient.refetchQueries({ queryKey: ["operations"] });
  queryClient.refetchQueries({ queryKey: ["participants"] });
});

export { app };
