import VideoPage from "@/components/VideoPage";
import GatedPage from "@/components/GatedPage";

export const metadata = {
  title: "Video — Magic Mint",
  description: "Generate AI videos with Kling, Veo, LTX, Wan, and Hailuo. Includes Motion Control.",
};

export default function Page() {
  return <GatedPage feature="Video generation"><VideoPage /></GatedPage>;
}
