import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "~/server/auth";
import { db } from "~/server/db";

export const dynamic = "force-dynamic";

const accountFields = [
  { label: "Account ID", key: "id" },
  { label: "Provider", key: "provider" },
  { label: "Provider account ID", key: "providerAccountId" },
  { label: "Account type", key: "type" },
  { label: "Access token", key: "access_token" },
  { label: "Refresh token", key: "refresh_token" },
  { label: "ID token", key: "id_token" },
  { label: "Token type", key: "token_type" },
  { label: "Expires at (Unix seconds)", key: "expires_at" },
  { label: "Granted scopes", key: "scope" },
  { label: "Session state", key: "session_state" },
] as const;

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  const accounts = await db.account.findMany({
    where: { userId: session.user.id },
    orderBy: { provider: "asc" },
  });

  return (
    <main className="min-h-screen bg-[#100f12] text-[#f5f2f7]">
      <section className="mx-auto max-w-5xl px-6 py-12 sm:px-10 sm:py-16">
        <Link href="/" className="text-sm text-white/45 hover:text-white">
          ← Home
        </Link>
        <div className="mt-8 flex flex-wrap items-end justify-between gap-5 border-b border-white/10 pb-8">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-[#b991ff] uppercase">
              Developer profile
            </p>
            <h1 className="mt-3 text-4xl font-semibold">OAuth account data</h1>
            <p className="mt-3 text-sm text-white/55">
              Signed in as{" "}
              {session.user.name ?? session.user.email ?? session.user.id}
            </p>
          </div>
          <span className="rounded border border-[#53fc18]/30 px-3 py-1.5 text-xs font-medium text-[#8cff68]">
            {accounts.length} {accounts.length === 1 ? "account" : "accounts"}
          </span>
        </div>

        <div className="mt-8 border-l-2 border-[#9146ff] bg-white/4 px-4 py-3 text-sm leading-6 text-white/60">
          These fields include live OAuth credentials. Treat this page like a
          secret and never share its contents.
        </div>

        {accounts.length === 0 ? (
          <p className="mt-10 text-white/55">
            No provider account data is stored for this user.
          </p>
        ) : (
          <div className="mt-10 space-y-12">
            {accounts.map((account) => (
              <section
                key={account.id}
                aria-labelledby={`account-${account.id}`}
              >
                <h2
                  id={`account-${account.id}`}
                  className="mb-4 text-xl font-semibold"
                >
                  {account.provider}{" "}
                  <span className="ml-2 text-sm font-normal text-white/40">
                    OAuth account
                  </span>
                </h2>
                <dl className="divide-y divide-white/10 border-y border-white/10">
                  {accountFields.map((field) => {
                    const value = account[field.key];

                    return (
                      <div
                        key={field.key}
                        className="grid gap-2 py-4 sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-6"
                      >
                        <dt className="text-sm text-white/50">{field.label}</dt>
                        <dd className="min-w-0">
                          <code className="block font-mono text-sm leading-6 break-all whitespace-pre-wrap text-[#e4d7ff]">
                            {value === null
                              ? "Not returned by provider"
                              : String(value)}
                          </code>
                          {field.key === "expires_at" &&
                            typeof value === "number" && (
                              <p className="mt-1 text-xs text-white/40">
                                {new Date(value * 1000).toISOString()}
                              </p>
                            )}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </section>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
