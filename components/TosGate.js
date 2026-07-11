"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

// CCBill requirement (page 3, item 1b): "Users should be required to accept the
// website's terms of service and/or acceptable use policies prior to
// interacting with the website and generating content." This is a blocking
// full-screen gate shown on the app (generation) pages until the user accepts.
// Acceptance is stored in localStorage; bump the version suffix to force
// re-acceptance after a material policy change.
const ACCEPT_KEY = "mm_tos_accepted_v1";

// Routes that must NOT be gated (marketing + auth). Everything else — the
// canvas, image/video studios, influencers, etc. — is gated.
const PUBLIC_PREFIXES = ["/pricing", "/sign-in", "/sign-up"];
function isGatedPath(pathname) {
  if (!pathname || pathname === "/") return false;
  return !PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export default function TosGate() {
  const pathname = usePathname();
  // `mounted` guards against SSR/hydration mismatch (localStorage is client-only).
  const [mounted, setMounted] = useState(false);
  const [accepted, setAccepted] = useState(true);

  useEffect(() => {
    setMounted(true);
    try {
      setAccepted(localStorage.getItem(ACCEPT_KEY) === "1");
    } catch {
      setAccepted(false);
    }
  }, []);

  if (!mounted || !isGatedPath(pathname) || accepted) return null;

  const accept = () => {
    try { localStorage.setItem(ACCEPT_KEY, "1"); } catch {}
    setAccepted(true);
  };

  return (
    <div className="tos-gate-backdrop" role="dialog" aria-modal="true" aria-labelledby="tos-gate-title">
      <div className="tos-gate">
        <h2 id="tos-gate-title" className="tos-gate-title">Before you continue</h2>
        <p className="tos-gate-lead">
          Magic Mint generates AI content. To use the studio you must be 18+ and agree to our
          {" "}<Link href="/terms" target="_blank" className="tos-gate-link">Terms of Service</Link> and
          {" "}<Link href="/acceptable-use" target="_blank" className="tos-gate-link">Acceptable Use Policy</Link>.
        </p>
        <div className="tos-gate-rules">
          <p>You agree <strong>not</strong> to use this service to generate:</p>
          <ul>
            <li>Any content depicting or implying <strong>minors</strong>, in any scenario.</li>
            <li><strong>Deepfakes</strong> or any sexual/explicit content of a real, identifiable person without their consent.</li>
            <li>Non-consensual, incest, bestiality, violent/snuff, or other card-brand-prohibited content.</li>
          </ul>
          <p className="tos-gate-fine">
            All content produced here is AI-generated and synthetic. Violations result in
            immediate account termination and, where required by law, reporting to authorities.
          </p>
        </div>
        <button type="button" className="tos-gate-btn" onClick={accept}>
          I am 18+ and I agree
        </button>
      </div>
    </div>
  );
}
