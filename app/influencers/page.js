import InfluencersPage from "@/components/InfluencersPage";
import GatedPage from "@/components/GatedPage";

export const metadata = {
  title: "Influencers — Magic Mint",
  description: "Build reusable AI characters and summon them anywhere with @handle.",
};

export default function Page() {
  return <GatedPage feature="Influencer Training"><InfluencersPage /></GatedPage>;
}
