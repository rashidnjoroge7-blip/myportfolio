import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type Milestone = {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
};

type ClientProject = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  milestones: Milestone[];
};

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
    }
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
        status,
        due_date
      )
    `)
    .eq("client_email", user.email)
    .order("created_at", { ascending: false });

  const projects = (data ?? []) as unknown as ClientProject[];

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">

        <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Client Dashboard
            </h1>

            <p className="mt-2 text-gray-600">
              Welcome, {user.email}
            </p>
          </div>

          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
            >
              Sign Out
            </button>
          </form>
        </header>

        <section>
          <h2 className="mb-6 text-xl font-semibold text-gray-900">
            Your Projects
          </h2>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-700">
              Unable to load your projects: {error.message}
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
              <h3 className="text-lg font-semibold text-gray-800">
                No projects yet
              </h3>

              <p className="mt-2 text-gray-500">
                Your assigned projects will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {projects.map((project) => (
                <article
                  key={project.id}
                  className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-xl font-bold text-gray-900">
                      {project.title}
                    </h3>

                    <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                      {project.status}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-gray-500">
                    Created:{" "}
                    {new Date(project.created_at).toLocaleDateString()}
                  </p>

                  <div className="mt-6">
                    <h4 className="mb-4 font-semibold text-gray-800">
                      Project Milestones
                    </h4>

                    {project.milestones?.length > 0 ? (
                      <div className="space-y-3">
                        {project.milestones.map((milestone) => (
                          <div
                            key={milestone.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gray-50 p-4"
                          >
                            <div>
                              <p className="font-medium text-gray-800">
                                {milestone.title}
                              </p>

                              {milestone.due_date && (
                                <p className="mt-1 text-xs text-gray-500">
                                  Due:{" "}
                                  {new Date(
                                    milestone.due_date
                                  ).toLocaleDateString()}
                                </p>
                              )}
                            </div>

                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                              {milestone.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        No milestones have been added yet.
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
