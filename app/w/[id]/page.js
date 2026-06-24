import Canvas from "@/components/Canvas";

export default async function EditorPage({ params }) {
  const { id } = await params;
  return <Canvas workflowId={id} />;
}
