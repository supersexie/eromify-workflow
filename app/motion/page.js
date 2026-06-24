import { redirect } from "next/navigation";

// Motion Control was merged into the Video page as a sub-tab. Any leftover
// links to /motion redirect to the equivalent /video sub-route so bookmarks
// and shared URLs from earlier still work.
export default function Page() {
  redirect("/video?sub=motion");
}
