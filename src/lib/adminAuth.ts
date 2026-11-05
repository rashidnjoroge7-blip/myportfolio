import "server-only";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions, isAdminEmail } from "@/lib/authOptions";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);

  // If not signed in OR not an admin, send to NextAuth sign-in page
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    redirect("/admin/login");
  }

  return session;
}
