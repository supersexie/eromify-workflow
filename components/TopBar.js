"use client";
import Link from "next/link";
import Tabs from "@/components/Tabs";

// Shared top bar for every section page: small brand on the left, a centered
// floating pill of section tabs (the same look as the canvas editor), and
// page-specific actions on the right.
export default function TopBar({ right }) {
  return (
    <div className="app-topbar">
      <Link href="/" className="app-topbar-brand">
        <div className="logo">m</div>
        <span>Eromify</span>
      </Link>
      <div className="nav-pill">
        <Tabs showBrand={false} />
      </div>
      <div className="app-topbar-right">{right}</div>
    </div>
  );
}
