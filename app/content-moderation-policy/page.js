import LegalPage from "@/components/LegalPage";

export const metadata = { title: "Content Moderation Policy — Magic Mint" };

export default function ContentModerationPolicy() {
  return (
    <LegalPage title="Content Moderation & Boarding Policy">
      <h2>1. Overview</h2>
      <p>
        Magic Mint operates an AI content-generation platform. This policy describes the
        controls we use to prevent the generation and distribution of illegal, prohibited,
        or card-brand-violating content, in line with CCBill's AI Generated Content
        Merchant guidelines.
      </p>

      <h2>2. Prohibited content</h2>
      <p>Our systems are designed to prevent the generation of content in relation to:</p>
      <ul>
        <li>Minors (including subjects in diapers) or any underage content or scenarios</li>
        <li>Deepfakes or the sexualized likeness of a real, identifiable person without consent</li>
        <li>Non-consensual (including sleeping/unconscious) content or scenarios</li>
        <li>Incest, bestiality/animal cruelty, watersports</li>
        <li>Violence, abduction, snuff / fantasy snuff</li>
        <li>Sexual activity under the influence (drugs, alcohol, hypnosis)</li>
        <li>Prostitution/escorting, polygamy</li>
        <li>Illegal activity, professional advice (medical/legal/financial/gambling), hate speech</li>
        <li>Copyright-infringing material</li>
      </ul>

      <h2>3. Control framework</h2>
      <p>Content is screened at multiple stages before it can reach a user:</p>
      <ul>
        <li><strong>Prompt screening</strong> — every generation request is screened (keyword + AI text moderation) before any model runs. Prohibited requests are blocked.</li>
        <li><strong>Reference-image checks</strong> — uploaded reference images are checked; a real (non-synthetic) person's likeness cannot be used for explicit generation.</li>
        <li><strong>Output classification</strong> — every generated image is classified by an automated visual-moderation model before it is returned or stored.</li>
        <li><strong>Text-output moderation</strong> — text/chatbot outputs are screened before display.</li>
      </ul>

      <h2>4. Human review</h2>
      <p>
        Content flagged by the automated systems is routed to a trained human review queue.
        Confirmed violations result in content removal and account action.
      </p>

      <h2>5. Reporting to authorities</h2>
      <p>
        Apparent child sexual abuse material (CSAM) is reported to the National Center for
        Missing &amp; Exploited Children (NCMEC) CyberTipline as required by 18 U.S.C. § 2258A,
        and content is preserved as required by law.
      </p>

      <h2>6. Enforcement</h2>
      <p>
        Violations of our <a href="/acceptable-use" style={{ color: "#7aa2ff" }}>Acceptable Use Policy</a> result
        in immediate account suspension or termination. We maintain audit logs of moderation
        decisions.
      </p>

      <h2>7. Contact</h2>
      <p>Moderation questions: <strong>support@eromify.com</strong>.</p>
    </LegalPage>
  );
}
