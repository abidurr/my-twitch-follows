import Link from "next/link";
import { redirect } from "next/navigation";

import { auth, signIn } from "~/server/auth";
import { db } from "~/server/db";
import {
  getFollowedChannels,
  TwitchApiError,
  type FollowedChannel,
} from "~/server/twitch";

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
        <a
          href="/api/follows/csv"
          download="twitch-followed-channels.csv"
          className="rounded-md bg-[#9146ff] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#a970ff]"
        >
          Download CSV
        </a>
      </div>

      {channels.length === 0 ? (
        <p className="mt-8 text-white/55">
          This account does not follow any channels.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-160 border-collapse text-left text-sm">
            <thead>
              <tr className="border-y border-white/10 text-xs tracking-wide text-white/45 uppercase">
                <th scope="col" className="px-4 py-3 font-medium">
                  Channel
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Login
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Twitch ID
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Followed
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Info
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {channels.map((channel) => (
                <tr key={channel.broadcaster_id}>
                  <td className="px-4 py-4 font-medium text-white">
                    <a
                      href={`https://www.twitch.tv/${channel.broadcaster_login}`}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-[#b991ff]"
                    >
                      {channel.broadcaster_name}
                    </a>
                  </td>
                  <td className="px-4 py-4 text-white/65">
                    {channel.broadcaster_login}
                  </td>
                  <td className="px-4 py-4 font-mono text-xs text-white/50">
                    {channel.broadcaster_id}
                  </td>
                  <td className="px-4 py-4 text-white/65">
                    <time dateTime={channel.followed_at}>
                      {new Date(channel.followed_at).toLocaleDateString()}
                    </time>
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/channel/${encodeURIComponent(channel.broadcaster_id)}`}
                      className="text-[#b991ff] hover:text-white"
                    >
                      Info
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
