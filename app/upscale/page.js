import UpscalePage from "@/components/UpscalePage";
import GatedPage from "@/components/GatedPage";

export const metadata = {
  title: "Upscale — Magic Mint",
  description: "Upscale images and videos to higher resolution with fal's best enhancement models.",
};

export default function Page() {
  return <GatedPage feature="Image Upscale"><UpscalePage /></GatedPage>;
}
