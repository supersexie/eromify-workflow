import Dashboard from "@/components/Dashboard";
import GatedPage from "@/components/GatedPage";

export default function Page() {
  return <GatedPage feature="Workflow Canvas"><Dashboard /></GatedPage>;
}
