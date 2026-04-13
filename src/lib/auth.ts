import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { FileStore } from "@/lib/data/file-store";
import type { StaffList, SessionUser } from "@/types/auth";

const store = new FileStore();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const staffData = await store.getConfig<StaffList>("staff/users.json");
        if (!staffData) return null;

        const user = staffData.users.find(
          (u) => u.username === credentials.username && u.active
        );
        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.username, // NextAuth requires email field; we store username here
          role: user.role,
        } as { id: string; name: string; email: string; role: string };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as unknown as { role: string }).role;
        token.username = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as SessionUser & { id: string }).id =
          token.sub as string;
        (session.user as SessionUser).username = token.username as string;
        (session.user as SessionUser).role = token.role as SessionUser["role"];
        (session.user as SessionUser).name = token.name as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
};
