import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import TwitchProvider from "next-auth/providers/twitch";

import { env } from "~/env";
import { db } from "~/server/db";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      twitchUsername: string | null;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    twitchId?: string | null;
    twitchUsername?: string | null;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  trustHost: true,
  providers: [
    TwitchProvider({
      clientId: env.AUTH_TWITCH_ID,
      clientSecret: env.AUTH_TWITCH_SECRET,
      authorization: {
        params: {
          scope: "openid user:read:email user:read:follows",
        },
      },
      profile: (profile) => ({
        id: profile.sub,
        name: profile.preferred_username,
        email: profile.email,
        image: profile.picture,
        twitchId: profile.sub,
        twitchUsername: profile.preferred_username,
      }),
    }),
  ],
  adapter: PrismaAdapter(db),
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
        twitchUsername: user.twitchUsername ?? null,
      },
    }),
  },
  events: {
    signIn: async ({ user, account, profile }) => {
      if (account?.provider !== "twitch") return;
      if (typeof profile?.preferred_username !== "string") {
        throw new Error("Twitch profile did not include a username.");
      }

      await db.$transaction([
        db.user.update({
          where: { id: user.id },
          data: {
            twitchId: account.providerAccountId,
            twitchUsername: profile.preferred_username,
          },
        }),
        db.account.updateMany({
          where: {
            userId: user.id,
            provider: "twitch",
            providerAccountId: account.providerAccountId,
          },
          data: {
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.expires_at,
            scope: account.scope,
            token_type: account.token_type,
            id_token: account.id_token,
          },
        }),
      ]);
    },
  },
} satisfies NextAuthConfig;
