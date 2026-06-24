import { redirect } from "next/navigation";

// Eromify is launching workflow-first. The marketing landing will live here
// later; for now, send every visitor straight to the workflow dashboard.
export default function Home() {
  redirect("/app");
}
