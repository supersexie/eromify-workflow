import Canvas from "@/components/Canvas";
import GatedPage from "@/components/GatedPage";

export default async function EditorPage({ params }) {
  const { id } = await params;
  return <GatedPage feature="Workflow Canvas"><Canvas workflowId={id} /></GatedPage>;
}
