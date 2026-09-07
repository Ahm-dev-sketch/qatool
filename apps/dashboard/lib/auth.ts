import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "admin" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (
          (credentials?.username === "admin" && credentials?.password === "admin123") ||
          (credentials?.username === "qa" && credentials?.password === "qatool2026")
        ) {
          return { id: "1", name: "QA Engineer", email: "qa@company.local" };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "qatool-super-secret-automation-key-2026",
};
