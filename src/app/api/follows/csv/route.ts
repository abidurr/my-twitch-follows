import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { getFollowedChannels, TwitchApiError } from "~/server/twitch";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new Response("Sign in to download your followed channels.", {
      status: 401,
    });
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
    return new Response("No Twitch access token is available.", {
      status: 401,
    });
  }

  const scopes = account.scope?.split(/\s+/) ?? [];
  if (!scopes.includes("user:read:follows")) {
    return new Response(
      "The Twitch connection is missing the user:read:follows permission.",
      { status: 403 },
    );
  }

  try {
    const channels = await getFollowedChannels(
      account.providerAccountId,
      account.access_token,
    );
    const rows = [
      ["twitch_id", "login", "channel_name", "followed_at"],
      ...channels.map((channel) => [
        channel.broadcaster_id,
        channel.broadcaster_login,
        channel.broadcaster_name,
        channel.followed_at,
      ]),
    ];
    const csv = rows
      .map((row) => row.map(escapeCsvField).join(","))
      .join("\r\n");

    return new Response(csv, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition":
          'attachment; filename="twitch-followed-channels.csv"',
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  } catch (error) {
    if (error instanceof TwitchApiError) {
      return new Response(error.message, {
        status: error.status,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    throw error;
  }
}

function escapeCsvField(value: string) {
  const safeValue = /^[\u0000-\u0020]*[=+\-@]/.test(value)
    ? `'${value}`
    : value;
  return `"${safeValue.replaceAll('"', '""')}"`;
}
