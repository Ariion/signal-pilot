import { Suspense } from "react";
import ScanClient from "./scan-client";

export default function ScanPage() {
  return <Suspense fallback={<main className="container" style={{padding:"100px 0"}}>Analyse…</main>}><ScanClient /></Suspense>;
}
