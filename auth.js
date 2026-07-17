import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import authConfig from "./auth.config";

// Google-only auth. Optional: if keys are missing, middleware leaves the app open.
export const authEnabled = !!(
  process.env.AUTH_GOOGLE_ID &&
  process.env.AUTH_GOOGLE_SECRET &&
  process.env.AUTH_SECRET
);

const providers = [];
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers,
  secret: process.env.AUTH_SECRET || "dev-placeholder-not-for-production",
  callbacks: {
    ...authConfig.callbacks,
    // Prefer a stable Google subject as the session user id (Blob keys, etc.).
    async jwt({ token, account, profile }) {
      if (account?.provider === "google" && profile?.sub) {
        token.sub = profile.sub;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
