import LegalPage from "@/components/LegalPage";

export const metadata = { title: "Complaints Policy — Eromify" };

export default function ComplaintsPolicy() {
  return (
    <LegalPage title="Complaints Policy">
      <h2>1. Purpose</h2>
      <p>
        We take complaints about content, conduct, and our services seriously. This policy
        explains how to file a complaint and how we handle it. This channel is
        <strong> separate from general customer support</strong> and is monitored specifically
        for content and conduct complaints.
      </p>

      <h2>2. Dedicated complaints contact</h2>
      <p style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "14px 16px" }}>
        <strong>Complaints contact (not general support):</strong><br />
        Email: <strong>complaints@eromify.com</strong><br />
        This inbox is reviewed separately from <em>support@eromify.com</em> / “Contact Us”.
      </p>

      <h2>3. What you can complain about</h2>
      <ul>
        <li>Content you believe is illegal, non-consensual, or otherwise prohibited</li>
        <li>Use of your likeness without consent</li>
        <li>Conduct of a user or creator on the platform</li>
        <li>How a previous report or removal request was handled</li>
      </ul>

      <h2>4. What to include</h2>
      <ul>
        <li>A clear description of the complaint and any relevant links</li>
        <li>Your relationship to the matter</li>
        <li>How we can reach you for follow-up</li>
      </ul>

      <h2>5. How we handle complaints</h2>
      <ul>
        <li><strong>Acknowledgement</strong> within 2 business days.</li>
        <li><strong>Investigation</strong> by our trust &amp; safety team, including content review and, where relevant, removal and reporting to authorities.</li>
        <li><strong>Outcome</strong> communicated to the complainant where appropriate.</li>
        <li>Urgent matters (e.g. apparent CSAM or non-consensual imagery) are escalated immediately.</li>
      </ul>

      <h2>6. Escalation</h2>
      <p>
        If you are not satisfied with the outcome, you may request escalation to a senior
        member of our team, and — for disputes over consent or removal — to a neutral body
        (e.g. a neutral arbitrator) consistent with card-brand requirements.
      </p>
    </LegalPage>
  );
}
