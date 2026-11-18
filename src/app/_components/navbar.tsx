import Image from "next/image";
import Link from "next/link";

import { auth, signOut, signIn } from "~/server/auth";

async function signInWithTwitch() {
  "use server";

  await signIn("twitch");
}

async function signOutAction() {
  "use server";

  await signOut({ redirectTo: "/" });
}

export async function Navbar() {
  const session = await auth();
  const userName =
    session?.user?.name ?? session?.user?.email ?? "Twitch account";

  return (
    <header className="relative z-10 flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-b border-white/10 bg-[#100f12] px-6 py-4 text-[#f5f2f7] sm:px-10">
      <Link
        href="/"
        className="flex items-center gap-3 font-semibold tracking-wide"
      >
        <span className="grid size-9 place-items-center rounded-lg bg-[#9146ff] text-lg font-black">
          T
        </span>
        <span className="text-white/75">
          My<span className="text-[#b991ff]">-Twitch-</span>Follows
        </span>
      </Link>

      {session?.user ? (
        <>
          <nav
            aria-label="Main navigation"
            className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/65"
          >
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <Link href="/follows" className="hover:text-white">
              My Follows
            </Link>
            <Link href="/boards" className="hover:text-white">
              Boards
            </Link>
            <Link href="/about" className="hover:text-white">
              About
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                className="cursor-pointer text-sm text-white/55 decoration-white/25 underline-offset-4 hover:text-white"
              >
                Sign Out
              </button>
            </form>
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden max-w-36 truncate text-sm text-white/75 sm:inline">
              {userName}
            </span>
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt=""
                width={32}
                height={32}
                unoptimized
                className="size-8 rounded-full object-cover"
              />
            ) : (
              <span
                aria-hidden="true"
                className="grid size-8 place-items-center rounded-full bg-white/10 text-xs font-semibold"
              >
                {userName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </>
      ) : (
        <>
          <button
            onClick={signInWithTwitch}
            className="cursor-pointer font-semibold text-[#b991ff]"
          >
            Sign in with Twitch
          </button>
        </>
      )}
    </header>
  );
}
