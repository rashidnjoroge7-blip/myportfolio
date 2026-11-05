import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export function isAdminEmail(email?: string | null) {
  if (!email) return false;

  const allowlist = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return allowlist.includes(email.trim().toLowerCase());
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Admin Email",

      credentials: {
        email: {
          label: "Administrator Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;

        const encodedHash = process.env.ADMIN_PASSWORD_HASH_B64;

        const passwordHash = encodedHash
          ? Buffer.from(encodedHash, "base64").toString("utf8")
          : process.env.ADMIN_PASSWORD_HASH;

        if (!email || !password || !passwordHash) {
          return null;
        }

        if (!isAdminEmail(email)) {
          return null;
        }

        const validHash = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(
          passwordHash,
        );

        if (!validHash) {
          return null;
        }

        const validPassword = await bcrypt.compare(password, passwordHash);

        if (!validPassword) {
          return null;
        }

        return {
          id: email,
          email,
          name: "Administrator",
        };
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
  },

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async signIn({ user, profile }) {
      const email =
        user.email ?? (profile as { email?: string } | undefined)?.email;

      return isAdminEmail(email);
    },

    async session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = token.email;
      }

      return session;
    },
  },
};
