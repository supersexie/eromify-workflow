import InfluencerStudio from "@/components/InfluencerStudio";
import GatedPage from "@/components/GatedPage";

export const metadata = {
  title: "Influencer Builder — Magic Mint",
  description: "Build AI influencers with a visual studio.",
};

export default function Page() {
  return <GatedPage feature="Influencer Training"><InfluencerStudio /></GatedPage>;
}
