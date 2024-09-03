import { Metadata } from "next";
import PageView from "../../../views/participants/ListView";

export const metadata: Metadata = {
  title: "ScreenLife Capture Management Interface - Participants",
};

export default function ParticipantsPage() {
  return <PageView />;
}
