import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import authConfig from "./auth.config";
import { getUserByEmail, verifyPassword } from "@/lib/userStore";

// Auth is on when AUTH_SECRET is set. Google is optional on top of email/password.
export const authEnabled = !!process.env.AUTH_SECRET;

const providers = [
  Credentials({
    id: "credentials",
    name: "Email",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = String(credentials?.email || "").trim().toLowerCase();
      const password = String(credentials?.password || "");
      if (!email || !password) return null;
      const user = await getUserByEmail(email);
      if (!user || !verifyPassword(password, user.passwordHash)) return null;
      return { id: user.id, email: user.email, name: user.name };
    },
  }),
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    })
  );
}

export const googleEnabled = !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers,
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET || "dev-placeholder-not-for-production",
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, account, profile }) {
      if (user?.id) token.sub = user.id;
      if (account?.provider === "google" && profile?.sub) token.sub = profile.sub;
      if (user?.email) token.email = user.email;
      if (user?.name) token.name = user.name;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.sub) session.user.id = token.sub;
        if (token.email) session.user.email = token.email;
        if (token.name) session.user.name = token.name;
      }
      return session;
    },
  },
});
