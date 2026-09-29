import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const business = await prisma.business.findFirst({
    where: { id, userId: user.id },
    include: {
      scans: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      monitoringRuns: {
        orderBy: { startedAt: "desc" },
        take: 30,
      },
    },
  });

  if (!business) notFound();

  const scans = [...business.scans].reverse();

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <Link href={`/business/${id}`} className="muted">← Cockpit</Link>
          <p className="eyebrow">HISTORY</p>
          <h1>Évolution du projet</h1>
          <p className="muted">{business.name}</p>
        </div>
        <Link className="primary inline" href={`/business/${id}/intelligence`}>
          Intelligence
        </Link>
      </header>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Readiness Score</h2>
            <p className="muted">Historique des scans enregistrés.</p>
          </div>
          <span className="badge">{business.scans.length} scans</span>
        </div>

        <div className="history-chart">
          {scans.map((scan) => (
            <div
              className="history-point"
              key={scan.id}
              title={`${scan.score}/100 · ${new Date(scan.createdAt).toLocaleString("fr-FR")}`}
            >
              <div
                className="history-bar"
                style={{ height: `${Math.max(8, scan.score)}%` }}
              />
              <span>{scan.score}</span>
            </div>
          ))}
        </div>

        {business.scans.map((scan, index) => {
          const previous = business.scans[index + 1];
          const delta = previous ? scan.score - previous.score : null;

          return (
            <div className="row" key={scan.id}>
              <span>{new Date(scan.createdAt).toLocaleString("fr-FR")}</span>
              <strong>
                {scan.score}/100
                {delta !== null && (
                  <small className="muted">
                    ({delta >= 0 ? "+" : ""}{delta})
                  </small>
                )}
              </strong>
            </div>
          );
        })}
      </section>

      <section className="panel" style={{ marginTop: 14 }}>
        <div className="panel-head">
          <h2>Monitoring</h2>
          <span className="badge">{business.monitoringRuns.length} exécutions</span>
        </div>

        {business.monitoringRuns.map((run) => (
          <div className="row" key={run.id}>
            <span>{new Date(run.startedAt).toLocaleString("fr-FR")}</span>
            <strong>
              {run.status}
              {run.delta !== null && run.delta !== undefined
                ? ` · ${run.delta > 0 ? "+" : ""}${run.delta}`
                : ""}
            </strong>
          </div>
        ))}
      </section>
    </main>
  );
}
