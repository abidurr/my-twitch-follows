import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";

import { env } from "~/env";

import TwitchProvider from "next-auth/providers/twitch";

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
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
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
      },
    }),
  },
} satisfies NextAuthConfig;
