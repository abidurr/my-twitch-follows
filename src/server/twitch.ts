import "server-only";

import { z } from "zod";

import { env } from "~/env";

const followedChannelsResponseSchema = z.object({
  data: z.array(
    z.object({
      broadcaster_id: z.string(),
      broadcaster_login: z.string(),
      broadcaster_name: z.string(),
      followed_at: z.string(),
    }),
  ),
  pagination: z
    .object({
      cursor: z.string().optional(),
    })
    .optional(),
});

const channelResponseSchema = z.object({
  data: z.array(
    z.object({
      broadcaster_id: z.string(),
      broadcaster_login: z.string(),
      broadcaster_name: z.string(),
      broadcaster_language: z.string(),
      game_id: z.string(),
      game_name: z.string(),
      title: z.string(),
      delay: z.number(),
      tags: z.array(z.string()),
      content_classification_labels: z.array(z.string()),
      is_branded_content: z.boolean(),
    }),
  ),
});

const userProfileImagesResponseSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      profile_image_url: z.string(),
    }),
  ),
});

export type FollowedChannel = z.infer<
  typeof followedChannelsResponseSchema
>["data"][number];
export type TwitchChannel = z.infer<
  typeof channelResponseSchema
>["data"][number];

export class TwitchApiError extends Error {
  constructor(readonly status: number) {
    super(`Twitch API request failed with status ${status}.`);
    this.name = "TwitchApiError";
  }
}

export async function getFollowedChannels(
  userId: string,
  accessToken: string,
): Promise<FollowedChannel[]> {
  const channels: FollowedChannel[] = [];
  const seenCursors = new Set<string>();
  let cursor: string | undefined;

  while (true) {
    const url = new URL("https://api.twitch.tv/helix/channels/followed");
    url.searchParams.set("user_id", userId);
    url.searchParams.set("first", "100");
    if (cursor) url.searchParams.set("after", cursor);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Client-Id": env.AUTH_TWITCH_ID,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new TwitchApiError(response.status);
    }

    const page = followedChannelsResponseSchema.parse(await response.json());
    channels.push(...page.data);

    const nextCursor = page.pagination?.cursor;
    if (!nextCursor) return channels;
    if (seenCursors.has(nextCursor)) {
      throw new Error("Twitch API returned a repeated pagination cursor.");
    }

    seenCursors.add(nextCursor);
    cursor = nextCursor;
  }
}

export async function getFollowedChannelProfileImages(
  broadcasterIds: string[],
  accessToken: string,
): Promise<Record<string, string>> {
  const uniqueIds = [...new Set(broadcasterIds)];
  const profileImages: Record<string, string> = {};

  for (let index = 0; index < uniqueIds.length; index += 100) {
    const url = new URL("https://api.twitch.tv/helix/users");
    for (const id of uniqueIds.slice(index, index + 100)) {
      url.searchParams.append("id", id);
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Client-Id": env.AUTH_TWITCH_ID,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new TwitchApiError(response.status);
    }

    const result = userProfileImagesResponseSchema.parse(await response.json());
    for (const user of result.data) {
      profileImages[user.id] = user.profile_image_url;
    }
  }

  return profileImages;
}

export async function getChannelInfo(
  broadcasterId: string,
  accessToken: string,
): Promise<TwitchChannel | null> {
  const url = new URL("https://api.twitch.tv/helix/channels");
  url.searchParams.set("broadcaster_id", broadcasterId);

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Client-Id": env.AUTH_TWITCH_ID,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new TwitchApiError(response.status);
  }

  const result = channelResponseSchema.parse(await response.json());
  return result.data[0] ?? null;
}

export async function isFollowingChannel(
  userId: string,
  broadcasterId: string,
  accessToken: string,
): Promise<boolean> {
  const url = new URL("https://api.twitch.tv/helix/channels/followed");
  url.searchParams.set("user_id", userId);
  url.searchParams.set("broadcaster_id", broadcasterId);
  url.searchParams.set("first", "1");

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Client-Id": env.AUTH_TWITCH_ID,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new TwitchApiError(response.status);
  }

  const result = followedChannelsResponseSchema.parse(await response.json());
  return result.data.length > 0;
}
