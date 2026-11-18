import Link from "next/link";
import { redirect } from "next/navigation";

import { auth, signIn } from "~/server/auth";
import { db } from "~/server/db";
import {
  getFollowedChannels,
  TwitchApiError,
  type FollowedChannel,
} from "~/server/twitch";
import FollowedChannelsTable from "./followed-channels-table";

export const dynamic = "force-dynamic";

async function reconnectWithTwitch() {
  "use server";

  await signIn("twitch");
}

export default async function FollowsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  const account = await db.account.findFirst({
    where: { userId: session.user.id, provider: "twitch" },
    select: {
      providerAccountId: true,
      access_token: true,
      scope: true,
    },
  });

  if (!account?.access_token) {
    return (
      <FollowsPageLayout>
        <p role="alert" className="mt-8 text-sm text-red-300">
          No Twitch access token is available for this account. Reconnect with
          Twitch to continue.
        </p>
        <ReconnectButton />
      </FollowsPageLayout>
    );
  }

  const scopes = account.scope?.split(/\s+/) ?? [];
  if (!scopes.includes("user:read:follows")) {
    return (
      <FollowsPageLayout>
        <p role="alert" className="mt-8 text-sm text-red-300">
          This Twitch connection is missing the user:read:follows permission.
          Reconnect with Twitch and grant the requested permission.
        </p>
        <ReconnectButton />
      </FollowsPageLayout>
    );
  }

  let channels: FollowedChannel[] = [];
  let apiError: TwitchApiError | undefined;
  try {
    channels = await getFollowedChannels(
      account.providerAccountId,
      account.access_token,
    );
  } catch (error) {
    if (error instanceof TwitchApiError) {
      apiError = error;
    } else {
      throw error;
    }
  }

  if (apiError) {
    return (
      <FollowsPageLayout>
        <p role="alert" className="mt-8 text-sm text-red-300">
          {apiError.status === 401
            ? "Twitch rejected the access token. It may have expired or be missing the required permission."
            : `Twitch could not load followed channels (HTTP ${apiError.status}).`}{" "}
          Reconnect with Twitch and try again.
        </p>
        <ReconnectButton />
      </FollowsPageLayout>
    );
  }

  return (
    <FollowsPageLayout>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-white/50">
          {channels.length} followed{" "}
          {channels.length === 1 ? "channel" : "channels"}
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/api/follows/csv"
            download="twitch-followed-channels.csv"
            className="rounded-md bg-[#9146ff] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#a970ff]"
          >
            Download CSV
          </a>
          <a
            href="/api/follows/json"
            download="twitch-followed-channels.json"
            className="rounded-md border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/75 transition-colors hover:border-white/35 hover:text-white"
          >
            Download JSON
          </a>
        </div>
      </div>

      {channels.length === 0 ? (
        <p className="mt-8 text-white/55">
          This account does not follow any channels.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <FollowedChannelsTable channels={channels} />
        </div>
      )}
    </FollowsPageLayout>
  );
}

function FollowsPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#100f12] text-[#f5f2f7]">
      <section className="mx-auto max-w-6xl px-6 py-12 sm:px-10 sm:py-16">
        <Link href="/" className="text-sm text-white/45 hover:text-white">
          ← Home
        </Link>
        <div className="mt-8 border-b border-white/10 pb-8">
          <p className="text-xs font-semibold tracking-[0.18em] text-[#b991ff] uppercase">
            Twitch account
          </p>
          <h1 className="mt-3 text-4xl font-semibold">Followed channels</h1>
        </div>
        {children}
      </section>
    </main>
  );
}

function ReconnectButton() {
  return (
    <form action={reconnectWithTwitch} className="mt-5">
      <button
        type="submit"
        className="rounded-md bg-[#9146ff] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#a970ff]"
      >
        Reconnect with Twitch
      </button>
    </form>
  );
}
