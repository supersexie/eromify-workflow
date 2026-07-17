// Edge-safe Auth.js config (no Node-only providers). Used by middleware.
export default {
  pages: {
    signIn: "/sign-in",
  },
  trustHost: true,
  providers: [],
  callbacks: {
    authorized() {
      // Protection is handled explicitly in middleware.js
      return true;
    },
  },
};
