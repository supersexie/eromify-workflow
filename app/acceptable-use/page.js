import Link from "next/link";
import LegalPage from "@/components/LegalPage";

export const metadata = { title: "Acceptable Use Policy — Eromify" };

// PLACEHOLDER — scaffolding so the ToS gate + footer links resolve. Replace
// with final, counsel-reviewed policy before launch. The prohibited-content
// list mirrors CCBill's AI Generated Content guidelines (page 3).
export default function AcceptableUsePage() {
  return (
    <LegalPage title="Acceptable Use Policy">
      <p>You may not use Eromify to generate, request, or distribute content in relation to any of the following:</p>
      <ul>
        <li>Deepfakes, or the likeness of a real identifiable person in a sexual/explicit context without consent</li>
        <li>Minors (including subjects in diapers), or any underage content or scenarios</li>
        <li>Non-consensual (including sleeping/unconscious) content or scenarios</li>
        <li>Incest content or scenarios</li>
        <li>Watersports content or scenarios</li>
        <li>Violence, abductions, snuff / fantasy snuff content or scenarios</li>
        <li>Bestiality / animal cruelty content or scenarios</li>
        <li>Sexual activity under the influence (drugs, alcohol, hypnosis)</li>
        <li>Prostitution / escorting content or scenarios</li>
        <li>Polygamy content or scenarios</li>
        <li>Illegal activity (e.g. instructions for weapons/explosives, or other illegal plotting)</li>
        <li>Professional advice (medical, legal, financial, gambling/handicapping, etc.)</li>
        <li>Hate speech</li>
        <li>Copyright-infringing material</li>
      </ul>
      <p>See our <Link href="/terms" style={{ color: "#7aa2ff" }}>Terms of Service</Link> for enforcement and reporting.</p>
    </LegalPage>
  );
}
