import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Google Sign-In is restricted to exactly these people — the same shared
// OAuth client already used for aac-workspace-app, robus-workspace-app, and
// Robus. The Credentials path (admin@aianalyticsconsole.com) stays open
// separately since it's gated by a real DB user + password, not this list.
const GOOGLE_ALLOWED_EMAILS = new Set([
  "samuelprabhakarvara@gmail.com",
  "zach@robusworksai.com",
  "powell.david13@gmail.com",
]);

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  // Render (like most non-Vercel hosts) sits behind a proxy, so Auth.js's
  // host-header trust check needs to be explicitly opted into.
  trustHost: true,
  providers: [
    Google({
      // Trimmed defensively — some env-var UIs (Render's included) leave a
      // trailing newline on a pasted value, and Google's client_id match is
      // exact-string, so an untrimmed value fails as "invalid_client" with
      // no indication why.
      clientId: process.env.GOOGLE_CLIENT_ID?.trim(),
      clientSecret: process.env.GOOGLE_CLIENT_SECRET?.trim(),
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    signIn: async ({ account, user }) => {
      // Credentials sign-ins are already vetted by authorize() above — this
      // only gates the Google path, which has no DB row to check against.
      if (account?.provider === "google") {
        return !!user.email && GOOGLE_ALLOWED_EMAILS.has(user.email);
      }
      return true;
    },
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.id = user.id;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        (session.user as { role?: string; id?: string }).role = token.role as string;
        (session.user as { role?: string; id?: string }).id = token.id as string;
      }
      return session;
    },
  },
});
