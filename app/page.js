import { redirect } from "next/navigation";

// Workflow-first: send every visitor straight to the canvas dashboard.
export default function Home() {
  redirect("/app");
}
