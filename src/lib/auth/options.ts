import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db/client";
import { env } from "../config";
import { getUserPermissions } from "../rbac/permissions";
import { logger } from "../logger";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt" },
  secret: env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user) return null;

        const valid = await compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }

      if (token.id) {
        try {
          const permissions = await getUserPermissions(token.id as string);
          token.permissions = permissions.map((p) => p.key);
        } catch (error) {
          logger.error({ error }, "Failed to load permissions for token");
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token?.id && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).permissions = (token as any).permissions || [];
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};
