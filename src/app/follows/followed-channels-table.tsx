"use client";

import { useMemo, useState } from "react";

type FollowedChannel = {
  broadcaster_id: string;
  broadcaster_login: string;
  broadcaster_name: string;
  followed_at: string;
};

type SortKey = "name" | "login" | "id" | "followedAt";
type SortDirection = "ascending" | "descending";

const columns: { key: SortKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "login", label: "Login" },
  { key: "id", label: "Twitch ID" },
  { key: "followedAt", label: "Followed" },
];

export default function FollowedChannelsTable({
  channels,
}: {
  channels: FollowedChannel[];
}) {
  const [sort, setSort] = useState<{
    key: SortKey;
    direction: SortDirection;
  } | null>(null);

  const sortedChannels = useMemo(() => {
    if (!sort) return channels;

    return [...channels].sort((a, b) => {
      const comparison =
        sort.key === "followedAt"
          ? Date.parse(a.followed_at) - Date.parse(b.followed_at)
          : getSortValue(a, sort.key).localeCompare(
              getSortValue(b, sort.key),
              undefined,
              {
                numeric: true,
                sensitivity: "base",
              },
            );

      return sort.direction === "ascending" ? comparison : -comparison;
    });
  }, [channels, sort]);

  function sortBy(key: SortKey) {
    setSort((current) => ({
      key,
      direction:
        current?.key === key && current.direction === "ascending"
          ? "descending"
          : "ascending",
    }));
  }

  return (
    <table className="w-full min-w-160 border-collapse text-left text-sm">
      <thead>
        <tr className="border-y border-white/10 text-xs tracking-wide text-white/45 uppercase">
          {columns.map(({ key, label }) => (
            <th
              key={key}
              scope="col"
              aria-sort={sort?.key === key ? sort.direction : "none"}
              className="px-4 py-3 font-medium"
            >
              <button
                type="button"
                onClick={() => sortBy(key)}
                className="inline-flex items-center gap-2 text-left hover:text-white"
              >
                {label}
                <span aria-hidden="true">
                  {sort?.key === key
                    ? sort.direction === "ascending"
                      ? "↑"
                      : "↓"
                    : "↕"}
                </span>
              </button>
            </th>
          ))}
          <th scope="col" className="px-4 py-3 font-medium">
            Channel
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/10">
        {sortedChannels.map((channel) => (
          <tr key={channel.broadcaster_id}>
            <td className="px-4 py-4 font-medium text-white">
              {channel.broadcaster_name}
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
              <a
                href={`https://www.twitch.tv/${channel.broadcaster_login}`}
                target="_blank"
                rel="noreferrer"
                aria-label={`Visit ${channel.broadcaster_name} on Twitch`}
                className="text-[#b991ff] hover:text-white"
              >
                Visit on Twitch.tv
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function getSortValue(channel: FollowedChannel, key: SortKey) {
  switch (key) {
    case "name":
      return channel.broadcaster_name;
    case "login":
      return channel.broadcaster_login;
    case "id":
      return channel.broadcaster_id;
    case "followedAt":
      return channel.followed_at;
  }
}
