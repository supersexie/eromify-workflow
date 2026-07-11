import LegalPage from "@/components/LegalPage";

export const metadata = { title: "Content Creator Agreement — Eromify" };

export default function ContentCreatorAgreement() {
  return (
    <LegalPage title="Content Creator Agreement">
      <h2>1. Who this applies to</h2>
      <p>
        This agreement applies to every user who generates, uploads, edits, or publishes
        content ("Creator Content") on Eromify. By creating content you agree to these terms.
      </p>

      <h2>2. Eligibility</h2>
      <p>You represent that you are at least 18 years old and legally able to enter this agreement.</p>

      <h2>3. Your responsibilities</h2>
      <p>You are responsible for the content you create, and you agree that you will not create content that:</p>
      <ul>
        <li>Depicts or implies a minor in any scenario</li>
        <li>Depicts a real, identifiable person without their verified consent (including deepfakes)</li>
        <li>Falls into any category prohibited by our <a href="/acceptable-use" style={{ color: "#7aa2ff" }}>Acceptable Use Policy</a></li>
        <li>Infringes any third party's intellectual property, privacy, or other rights</li>
        <li>Violates any applicable law</li>
      </ul>

      <h2>4. Consent &amp; documentation</h2>
      <p>
        If any content includes the likeness of a real person, you must have valid consent and
        proof of age for that person and comply with our
        {" "}<a href="/third-party-consent" style={{ color: "#7aa2ff" }}>3rd Party Consent Agreement</a>.
        You must provide such records to us within <strong>five (5) business days</strong> of a request.
      </p>

      <h2>5. Warranties</h2>
      <p>
        You warrant that your content complies with this agreement and all applicable laws and
        card-brand rules, and that you have all rights necessary to create and publish it.
      </p>

      <h2>6. License</h2>
      <p>
        You grant Eromify a limited license to host, store, process, and display your content
        solely to operate the service, including passing it through automated and human
        moderation.
      </p>

      <h2>7. Moderation &amp; enforcement</h2>
      <p>
        All content is subject to automated and human moderation. We may block, remove, or
        refuse to generate content, and may suspend or terminate accounts for violations, at our
        discretion. Apparent CSAM is reported to NCMEC and preserved as required by law.
      </p>

      <h2>8. Indemnity</h2>
      <p>
        You agree to indemnify Eromify against claims arising from content you create in breach
        of this agreement.
      </p>
    </LegalPage>
  );
}
