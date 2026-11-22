import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import {
  consumeAdminLoginLimit,
  getAdminLoginClientIp,
} from "./adminLoginRateLimit";

export function isAdminEmail(email?: string | null) {
  if (!email) return false;

  const allowlist = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return allowlist.includes(email.trim().toLowerCase());
}

async function verifyPassword(password: string) {
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!passwordHash || !password) return false;

  try {
    return await bcrypt.compare(password, passwordHash);
  } catch {
    return false;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Email Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email.trim().toLowerCase();

        try {
          // Apply the IP limit to credential attempts.
          const ip = getAdminLoginClientIp(req.headers);

          if (ip) {
            const ipAllowed = await consumeAdminLoginLimit("ip", ip);

            if (!ipAllowed) {
              return null;
            }
          }

          // Only authorized administrator emails consume email limits.
          if (!isAdminEmail(email)) {
            return null;
          }

          const emailAllowed = await consumeAdminLoginLimit("email", email);

          if (!emailAllowed) {
            return null;
          }

          if (!(await verifyPassword(credentials.password))) {
            return null;
          }

          return {
            id: email,
            email,
            name: email.split("@")[0],
          };
        } catch {
          // Fail closed if the persistent rate limiter is unavailable.
          console.error(
            "Admin credentials authorization failed: rate limiter unavailable.",
          );
          return null;
        }
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],

  pages: {
    signIn: "/admin/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async signIn({ user }) {
      return isAdminEmail(user.email);
    },

    async session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = token.email;
      }

      return session;
    },
  },
};
