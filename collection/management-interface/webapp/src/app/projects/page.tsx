import { Metadata } from "next";
import ListView from "../../views/projects/ListView";

export const metadata: Metadata = {
  title: "ScreenLife Capture Management Interface - Projects",
};

export default function ProjectsPage() {
  return <ListView />;
}
