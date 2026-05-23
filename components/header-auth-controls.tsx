"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type HeaderUser = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  role?: "user" | "admin";
};

type MeResponse = {
  user: HeaderUser | null;
};

export function HeaderAuthControls() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<HeaderUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    fetch("/api/auth/me", {
      cache: "no-store",
      credentials: "same-origin",
    })
      .then(async (response) => {
        if (!response.ok) {
          return { user: null };
        }

        return (await response.json()) as MeResponse;
      })
      .then((data) => {
        if (isCurrent) {
          setUser(data.user ?? null);
        }
      })
      .catch(() => {
        if (isCurrent) {
          setUser(null);
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [pathname]);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
      setUser(null);
      router.push("/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  }

  if (isLoading) {
    return <span className="h-9 w-24 rounded-full bg-zinc-100" aria-hidden="true" />;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-full px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
      >
        로그인
      </Link>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      {user.role === "admin" ? (
        <Link
          href="/admin/dashboard"
          title="관리자 콘솔"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-300 bg-[#fff4c4] px-3 py-2 text-sm font-black text-[#8a5a00] transition hover:border-amber-400 hover:bg-[#ffe88a]"
        >
          <span aria-hidden="true">🛠</span>
          관리자
        </Link>
      ) : null}
      <Link
        href="/mypage"
        title={user.name}
        className="min-w-0 max-w-28 truncate rounded-full px-3 py-2 text-sm font-extrabold text-zinc-800 transition hover:bg-zinc-100 sm:max-w-40"
      >
        {user.name}
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
      >
        {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
      </button>
    </div>
  );
}
