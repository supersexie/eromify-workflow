import LegalPage from "@/components/LegalPage";

export const metadata = { title: "3rd Party Consent Agreement — Eromify" };

export default function ThirdPartyConsent() {
  return (
    <LegalPage title="3rd Party Consent Agreement">
      <h2>1. Purpose</h2>
      <p>
        This agreement governs any content that includes the image, likeness, or strong
        resemblance of a real, identifiable person ("Third Party"). It exists to ensure no
        real person's likeness is used without their informed, verifiable consent.
      </p>

      <h2>2. Default position — real-person likeness is blocked</h2>
      <p>
        Eromify's systems are designed to <strong>block</strong> the use of a real person's
        photo or likeness to generate sexual or explicit content. Our reference-image checks
        reject uploads that are not confirmed to be AI-generated. You may not attempt to
        circumvent these controls.
      </p>

      <h2>3. If real-person likeness is ever permitted</h2>
      <p>
        Where use of a Third Party's likeness is permitted, you must obtain and retain, for each
        such person:
      </p>
      <ul>
        <li>A signed <strong>model release / consent form</strong> authorizing the specific use of their image/likeness</li>
        <li><strong>Proof of age</strong> (government-issued ID) confirming the person is 18 or older</li>
        <li>Records sufficient to identify the person and the content the consent covers</li>
      </ul>

      <h2>4. Record retention &amp; production</h2>
      <p>
        You must maintain these records and provide them to Eromify <strong>within five (5)
        business days</strong> of a request. Failure to provide satisfactory documentation will
        result in immediate removal of the content and may result in suspension or termination.
      </p>

      <h2>5. No consent = violation</h2>
      <p>
        If a record of consent cannot be established, content that includes a real person's
        image or strong likeness — including deepfake content — is in violation of Discover,
        Visa, and Mastercard requirements and this agreement, and must not be published or must
        be removed immediately.
      </p>

      <h2>6. Disputes</h2>
      <p>
        If you dispute an assertion that consent is not valid, you agree to allow the dispute to
        be resolved by a neutral body at your expense. Discover, Visa, and Mastercard consider a
        neutral arbitrator to be an acceptable neutral body.
      </p>

      <h2>7. No minors</h2>
      <p>
        Consent is never a defense for content depicting or implying a minor. Such content is
        prohibited in all circumstances and is reported to NCMEC.
      </p>
    </LegalPage>
  );
}
