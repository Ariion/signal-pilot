import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

export default async function ActivityPage({
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
      actions: {
        orderBy: { updatedAt: "desc" },
        take: 100,
        include: {
          events: {
            orderBy: { createdAt: "desc" },
            take: 20,
          },
        },
      },
    },
  });

  if (!business) notFound();

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <Link href={`/business/${id}`} className="muted">← Cockpit</Link>
          <p className="eyebrow">AUDIT LOG</p>
          <h1>Journal des actions</h1>
          <p className="muted">Préparations, publications et restaurations.</p>
        </div>
      </header>

      <section className="panel">
        {business.actions.map((action) => (
          <article className="audit-action" key={action.id}>
            <div className="panel-head">
              <div>
                <strong>{action.title}</strong>
                <p className="muted">{action.type} · {action.status}</p>
              </div>
              <span className="badge">{action.events.length} événements</span>
            </div>

            {action.events.map((event) => (
              <div className="audit-event" key={event.id}>
                <span>{new Date(event.createdAt).toLocaleString("fr-FR")}</span>
                <strong>{event.type}</strong>
                <p>{event.message}</p>
              </div>
            ))}
          </article>
        ))}

        {!business.actions.length && <p className="muted">Aucun événement.</p>}
      </section>
    </main>
  );
}
