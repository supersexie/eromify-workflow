import MCPPage from "@/components/MCPPage";
import GatedPage from "@/components/GatedPage";

export const metadata = {
  title: "MCP & CLI — Magic Mint",
  description: "Connect Magic Mint to Claude, Cursor, OpenClaw, and Hermes via MCP, CLI, or Skill.",
};

export default function Page() {
  return <GatedPage feature="Claude MCP"><MCPPage /></GatedPage>;
}
