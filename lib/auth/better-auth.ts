// lib/auth/better-auth.ts - Free MIT Authentication & Connected Accounts
export const authConfig = {
  provider: "better-auth",
  license: "MIT",
  features: ["2FA", "Passkeys", "RBAC", "Social Login"],
  socialProviders: {
    facebook: {
      clientId: process.env.FB_APP_ID || "1331918902446123",
      clientSecret: process.env.FB_APP_SECRET || "",
      scope: ["pages_show_list", "pages_messaging", "instagram_basic", "instagram_manage_messages"]
    }
  }
};
