import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type Milestone = {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  due_date: string | null;
};

type ClientProject = {
  id: string;
  title: string;
  status: string | null;
  created_at: string | null;
  milestones: Milestone[] | null;
};

const completedStatuses = ["approved", "completed", "complete", "done"];

function formatDate(date: string | null) {
  if (!date) return "Not available";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "Not available";

  return parsed.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusStyle(status: string | null) {
  const value = (status ?? "").toLowerCase();

  if (completedStatuses.includes(value)) {
    return "bg-green-500/10 text-green-600 dark:text-green-400";
  }

  if (value === "active" || value === "in_progress") {
    return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
  }

  if (
    value === "awaiting_approval" ||
    value === "pending" ||
    value === "pending_approval"
  ) {
    return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
  }

  if (value === "blocked" || value === "cancelled") {
    return "bg-red-500/10 text-red-600 dark:text-red-400";
  }

  return "bg-[var(--surface-alt)] text-[var(--text)]";
}

function formatStatus(status: string | null) {
  if (!status) return "Not specified";

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getProgress(milestones: Milestone[]) {
  if (milestones.length === 0) return 0;

  const completed = milestones.filter((milestone) =>
    completedStatuses.includes((milestone.status ?? "").toLowerCase()),
  ).length;

  return Math.round((completed / milestones.length) * 100);
}

async function getSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Cookie updates are handled by the proxy.
          }
        },
      },
    },
  );
}

async function signOutAction() {
  "use server";

  const supabase = await getSupabase();

  await supabase.auth.signOut();

  redirect("/client/login");
}

export default async function ClientDashboardPage() {
  const supabase = await getSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect("/client/login");
  }

  const { data, error } = await supabase
    .from("client_projects")
    .select(`
      id,
      title,
      status,
      created_at,
      milestones (
        id,
        title,
        description,
        status,
        due_date
      )
    `)
    .eq("client_email", user.email)
    .order("created_at", { ascending: false });

  const projects = (data ?? []) as unknown as ClientProject[];

  const totalProjects = projects.length;

  const activeProjects = projects.filter((project) =>
    ["active", "in_progress"].includes(
      (project.status ?? "").toLowerCase(),
    ),
  ).length;

  const completedProjects = projects.filter((project) =>
    ["completed", "complete", "done"].includes(
      (project.status ?? "").toLowerCase(),
    ),
  ).length;

  const awaitingApprovals = projects.reduce((total, project) => {
    return (
      total +
      (project.milestones ?? []).filter((milestone) =>
        ["awaiting_approval", "pending_approval"].includes(
          (milestone.status ?? "").toLowerCase(),
        ),
      ).length
    );
  }, 0);

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <header className="mb-10 flex flex-wrap items-center justify-between gap-5">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Unihost Technologies
            </p>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Client Portal
            </h1>

            <p className="mt-2 text-sm text-[var(--muted)]">
              Welcome back, {user.email}
            </p>
          </div>

          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-xl border border-[var(--card-border)] px-5 py-2.5 text-sm font-semibold text-[var(--text)] transition-colors hover:border-red-500 hover:text-red-500"
            >
              Sign Out
            </button>
          </form>
        </header>

        {/* Introduction */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold">
            Your project overview
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Track your projects, monitor progress and review upcoming milestones.
          </p>
        </section>

        {/* Summary cards */}
        <section className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total Projects",
              value: totalProjects,
              description: "All assigned projects",
              icon: "▦",
              color: "text-[var(--accent)]",
            },
            {
              label: "Active Projects",
              value: activeProjects,
              description: "Currently in progress",
              icon: "◷",
              color: "text-blue-500",
            },
            {
              label: "Completed",
              value: completedProjects,
              description: "Successfully completed",
              icon: "✓",
              color: "text-green-500",
            },
            {
              label: "Awaiting Approval",
              value: awaitingApprovals,
              description: "Milestones requiring review",
              icon: "!",
              color: "text-amber-500",
            },
          ].map((stat) => (
            <article
              key={stat.label}
              className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] p-6"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[var(--muted)]">
                  {stat.label}
                </p>

                <span className={`text-2xl font-bold ${stat.color}`}>
                  {stat.icon}
                </span>
              </div>

              <p className="mt-4 text-3xl font-bold">
                {stat.value}
              </p>

              <p className="mt-1 text-xs text-[var(--muted)]">
                {stat.description}
              </p>
            </article>
          ))}
        </section>

        {/* Projects */}
        <section>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">
                Your Projects
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Project details and development progress.
              </p>
            </div>

            <span className="rounded-full bg-[var(--surface-alt)] px-3 py-1.5 text-xs font-semibold">
              {totalProjects} {totalProjects === 1 ? "Project" : "Projects"}
            </span>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-500">
              Unable to load your projects. Please refresh the page or contact support.
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-alt)] text-2xl text-[var(--accent)]">
                ▦
              </div>

              <h3 className="mt-5 text-lg font-semibold">
                No projects assigned yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
                Your projects will appear here once they have been assigned to your account.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {projects.map((project) => {
                const milestones = [...(project.milestones ?? [])].sort(
                  (a, b) => {
                    if (!a.due_date) return 1;
                    if (!b.due_date) return -1;

                    return a.due_date.localeCompare(b.due_date);
                  },
                );

                const progress = getProgress(milestones);

                return (
                  <article
                    key={project.id}
                    className="overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--surface)]"
                  >
                    <div className="p-6 sm:p-8">

                      {/* Project heading */}
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                            Project
                          </p>

                          <h3 className="mt-2 text-xl font-bold sm:text-2xl">
                            {project.title}
                          </h3>

                          <p className="mt-2 text-sm text-[var(--muted)]">
                            Created {formatDate(project.created_at)}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusStyle(project.status)}`}
                        >
                          {formatStatus(project.status)}
                        </span>
                      </div>

                      {/* Progress */}
                      <div className="mt-8">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-sm font-semibold">
                            Milestone progress
                          </span>

                          <span className="text-sm font-bold text-[var(--accent)]">
                            {progress}%
                          </span>
                        </div>

                        <div
                          className="h-2.5 overflow-hidden rounded-full bg-[var(--surface-alt)]"
                          role="progressbar"
                          aria-valuenow={progress}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${project.title} milestone progress`}
                        >
                          <div
                            className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>

                        <p className="mt-2 text-xs text-[var(--muted)]">
                          {milestones.filter((milestone) =>
                            completedStatuses.includes(
                              (milestone.status ?? "").toLowerCase(),
                            ),
                          ).length} of {milestones.length} milestones completed
                        </p>
                      </div>

                      {/* Milestones */}
                      <div className="mt-9 border-t border-[var(--card-border)] pt-7">
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                          <h4 className="font-semibold">
                            Project milestones
                          </h4>

                          <span className="text-xs text-[var(--muted)]">
                            {milestones.length} milestones
                          </span>
                        </div>

                        {milestones.length === 0 ? (
                          <p className="rounded-xl bg-[var(--surface-alt)] p-5 text-sm text-[var(--muted)]">
                            No milestones have been added to this project yet.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {milestones.map((milestone, index) => (
                              <div
                                key={milestone.id}
                                className="flex flex-col gap-4 rounded-xl border border-[var(--card-border)] p-4 sm:flex-row sm:items-start sm:justify-between"
                              >
                                <div className="flex min-w-0 gap-4">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-alt)] text-sm font-bold text-[var(--accent)]">
                                    {index + 1}
                                  </div>

                                  <div className="min-w-0">
                                    <h5 className="font-semibold">
                                      {milestone.title}
                                    </h5>

                                    {milestone.description && (
                                      <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                                        {milestone.description}
                                      </p>
                                    )}

                                    <p className="mt-2 text-xs text-[var(--muted)]">
                                      Due: {formatDate(milestone.due_date)}
                                    </p>
                                  </div>
                                </div>

                                <span
                                  className={`w-fit shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusStyle(milestone.status)}`}
                                >
                                  {formatStatus(milestone.status)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="mt-12 border-t border-[var(--card-border)] py-6 text-center">
          <p className="text-xs text-[var(--muted)]">
            © {new Date().getFullYear()} Unihost Technologies. Client Portal.
          </p>
        </footer>

      </div>
    </main>
  );
}
