"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type AuthMode = "login" | "signup";

type FieldErrors = {
  email?: string;
  name?: string;
  password?: string;
  passwordConfirm?: string;
};

type AuthResponse = {
  message?: string;
  errors?: FieldErrors;
};

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignup = mode === "signup";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setFieldErrors({});

    const response = await fetch(`/api/auth/${isSignup ? "signup" : "login"}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(isSignup ? { email, password, name, passwordConfirm } : { email, password }),
    });

    const data = (await response.json().catch(() => ({}))) as AuthResponse;

    if (!response.ok) {
      setMessage(data.message ?? "요청을 처리하지 못했습니다.");
      setFieldErrors(data.errors ?? {});
      setIsSubmitting(false);
      return;
    }

    router.push("/mypage");
    router.refresh();
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setMessage("");
    setFieldErrors({});
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-[0_18px_50px_rgba(24,24,27,0.08)] sm:p-6">
      <div className="grid grid-cols-2 rounded-full bg-zinc-100 p-1 text-sm font-extrabold">
        <button
          type="button"
          onClick={() => switchMode("login")}
          className={`rounded-full px-4 py-3 transition ${
            mode === "login" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          로그인
        </button>
        <button
          type="button"
          onClick={() => switchMode("signup")}
          className={`rounded-full px-4 py-3 transition ${
            mode === "signup" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          회원가입
        </button>
      </div>

      <div className="mt-6 rounded-lg bg-[#fff9dc] p-4">
        <p className="text-sm font-extrabold text-zinc-950">
          {isSignup ? "이메일로 새 계정을 만듭니다" : "가입한 이메일로 로그인합니다"}
        </p>
        <p className="mt-2 text-sm leading-6 text-zinc-700">
          소셜 로그인 없이 이메일과 비밀번호만 사용합니다. 비밀번호는 서버에서 해시 처리되어 저장됩니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
        {isSignup ? (
          <label className="grid gap-2 text-sm font-bold text-zinc-700">
            이름
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="홍길동"
              autoComplete="name"
              className="rounded-lg border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-[#f2c230]"
            />
            {fieldErrors.name ? <span className="text-xs font-bold text-red-600">{fieldErrors.name}</span> : null}
          </label>
        ) : null}

        <label className="grid gap-2 text-sm font-bold text-zinc-700">
          이메일
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="cashoom@example.com"
            autoComplete="email"
            className="rounded-lg border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-[#f2c230]"
          />
          {fieldErrors.email ? <span className="text-xs font-bold text-red-600">{fieldErrors.email}</span> : null}
        </label>

        <label className="grid gap-2 text-sm font-bold text-zinc-700">
          비밀번호
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="8자 이상"
            autoComplete={isSignup ? "new-password" : "current-password"}
            className="rounded-lg border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-[#f2c230]"
          />
          {fieldErrors.password ? <span className="text-xs font-bold text-red-600">{fieldErrors.password}</span> : null}
        </label>

        {isSignup ? (
          <label className="grid gap-2 text-sm font-bold text-zinc-700">
            비밀번호 확인
            <input
              type="password"
              value={passwordConfirm}
              onChange={(event) => setPasswordConfirm(event.target.value)}
              placeholder="비밀번호 재입력"
              autoComplete="new-password"
              className="rounded-lg border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-[#f2c230]"
            />
            {fieldErrors.passwordConfirm ? (
              <span className="text-xs font-bold text-red-600">{fieldErrors.passwordConfirm}</span>
            ) : null}
          </label>
        ) : null}

        {message ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{message}</p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 rounded-full bg-zinc-950 px-5 py-4 text-sm font-black text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {isSubmitting ? "처리 중..." : isSignup ? "회원가입하기" : "로그인하기"}
        </button>
      </form>

      <p className="mt-5 text-center text-xs leading-5 text-zinc-500">
        계속 진행하면 캐쉬움의{" "}
        <Link href="/terms" className="font-bold text-zinc-800">
          이용약관
        </Link>
        과{" "}
        <Link href="/privacy" className="font-bold text-zinc-800">
          개인정보처리방침
        </Link>
        에 동의하는 것으로 간주됩니다.
      </p>
    </div>
  );
}
