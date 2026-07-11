import LegalPage from "@/components/LegalPage";

export const metadata = { title: "Content Removal Policy — Magic Mint" };

export default function ContentRemovalPolicy() {
  return (
    <LegalPage title="Content Removal Policy">
      <h2>1. Purpose</h2>
      <p>
        This policy explains how anyone — including a person depicted in content, a rights
        holder, or a member of the public — can request the removal of content generated or
        hosted on Magic Mint, and how we respond.
      </p>

      <h2>2. What we remove</h2>
      <ul>
        <li>Content that violates our <a href="/acceptable-use" style={{ color: "#7aa2ff" }}>Acceptable Use Policy</a> or applicable law</li>
        <li>Content depicting a real, identifiable person without their verified consent (including deepfakes)</li>
        <li>Any apparent CSAM (also reported to NCMEC and preserved as required by law)</li>
        <li>Content infringing a third party's copyright or other rights</li>
      </ul>

      <h2>3. How to request removal</h2>
      <p>Email <strong>removals@magicmint.pro</strong> (placeholder — set a monitored inbox) with:</p>
      <ul>
        <li>A link to or description of the specific content</li>
        <li>Your relationship to the content (depicted person, rights holder, reporter)</li>
        <li>The reason for removal</li>
        <li>For non-consensual imagery of yourself: enough information for us to verify your identity</li>
      </ul>

      <h2>4. Our response</h2>
      <ul>
        <li>We acknowledge removal requests within <strong>2 business days</strong>.</li>
        <li>Content that clearly violates our policies or the law is removed <strong>immediately</strong> upon confirmation.</li>
        <li>Where consent for a real person's likeness cannot be established, the content is removed.</li>
        <li>We may preserve and report content where required by law before removal.</li>
      </ul>

      <h2>5. Disputes</h2>
      <p>
        If a merchant or user disputes a removal, the dispute may be resolved by a neutral
        body (e.g. a neutral arbitrator) at the disputing party's expense, consistent with
        card-brand requirements.
      </p>

      <h2>6. No re-upload</h2>
      <p>
        Removed content may not be re-generated or re-uploaded. Repeat attempts result in
        account termination.
      </p>
    </LegalPage>
  );
}
