import Link from "next/link";

import { auth, signIn } from "~/server/auth";

async function signInWithTwitch() {
  "use server";

  await signIn("twitch");
}

export default async function Home() {
  const session = await auth();
  const userName = session?.user?.name ?? session?.user?.email ?? "No name";

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#100f12] text-[#f5f2f7]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_18%_0%,rgba(145,70,255,0.19),transparent_40%),radial-gradient(ellipse_at_88%_76%,rgba(83,252,24,0.08),transparent_32%)]" />
      <section className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-20 sm:px-10">
        <div className="max-w-3xl">
          {!session?.user && (
            <>
              <p className="mb-6 flex items-center gap-3 text-xs font-semibold tracking-[0.2em] text-[#b991ff] uppercase">
                <span className="h-px w-8 bg-[#9146ff]" />
                https://my-twitch-follows.up.railway.app/
              </p>
              <h1 className="max-w-2xl text-4xl leading-[1.05] font-semibold sm:text-7xl">
                Get a list of all your{" "}
                <span className="text-[#a970ff]"> followed channels</span> on
                <span className="text-[#a970ff]"> Twitch</span>
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-white/60">
                As a fellow Twitch enjoyer, I noticed it was not a simple task
                to get a list of all the channels I followed. So I built this
                simple tool. It is free to use, and does not store or sell your
                following data :D
              </p>
              <p className="mt-7 max-w-xl text-lg leading-8 text-white/60">
                Sign in with your Twitch account to see or download a list of
                the channels you follow along with the follow date.
              </p>
            </>
          )}

          {session?.user ? (
            <div className="mt-12 flex flex-col flex-wrap items-start gap-8">
              <h1 className="max-w-2xl text-5xl leading-[1.05] font-semibold sm:text-7xl">
                Welcome, <span className="text-[#a970ff]">{userName}</span>
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-white/60">
                Navigate to your followed channels to see and download your list
                of following channels.
              </p>
              <Link
                href="/follows"
                className="rounded-md bg-[#9146ff] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#a970ff]"
              >
                My Followed Channels <span aria-hidden="true">↗</span>
              </Link>
              <Link
                href="/profile"
                className="rounded-md border border-white/15 px-5 py-3 text-sm font-semibold text-white/75 transition-colors hover:border-white/35 hover:text-white"
              >
                My Twitch Token
              </Link>
              <span className="flex items-center gap-2 text-sm text-white/65">
                <span className="size-2 rounded-full bg-[#53fc18]" />{" "}
                Authenticated with Twitch as {userName}
              </span>
              <Link
                href="/api/auth/signout"
                className="text-sm text-white/55 underline decoration-white/25 underline-offset-4 hover:text-white"
              >
                Sign out
              </Link>
            </div>
          ) : (
            <form action={signInWithTwitch} className="mt-12">
              <button
                type="submit"
                className="inline-flex items-center gap-3 rounded-md bg-[#9146ff] px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#a970ff]"
              >
                <span className="grid size-5 place-items-center rounded bg-white/15 text-xs font-black">
                  T
                </span>
                Sign in with Twitch <span aria-hidden="true">↗</span>
              </button>
            </form>
          )}
        </div>

        {/* <div className="mt-24 grid max-w-3xl grid-cols-1 border-t border-white/10 pt-6 sm:grid-cols-3 sm:gap-8">
          <div>
            <p className="text-2xl font-semibold text-white/50">
              <span className="text-[#a970ff]">Follow List</span>
            </p>
            <p className="mt-2 text-sm text-white/50">
              View a list of channels you follow. Or download it as a CSV
              spreadsheet.
            </p>
          </div>
        </div> */}
      </section>

      {/* <footer className="relative border-t border-white/10 px-6 py-4 text-xs text-white/35 sm:px-10">
        <div className="flex justify-center gap-1 align-middle">
          Made with love by{" "}
          <a href="https://abidur.dev" target="_blank">
            abidur.dev
          </a>{" "}
          in NYC
        </div>
      </footer> */}
    </main>
  );
}
