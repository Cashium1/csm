"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, SyntheticEvent, useEffect, useState } from "react";

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

type SendCodeResponse = {
  message?: string;
  devCode?: string;
  retryAfterSeconds?: number;
};

type VerifyResponse = {
  message?: string;
};

type VerifyNotice = {
  text: string;
  type: "info" | "error" | "success";
};

const verifyNoticeTone: Record<VerifyNotice["type"], string> = {
  info: "text-zinc-600",
  error: "text-red-600",
  success: "text-emerald-600",
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

  // 이메일 인증 상태
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isConfirmingCode, setIsConfirmingCode] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [verifyNotice, setVerifyNotice] = useState<VerifyNotice | null>(null);
  const [devCodeHint, setDevCodeHint] = useState("");

  const isSignup = mode === "signup";

  // 재발송 대기 카운트다운
  useEffect(() => {
    if (resendCountdown <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setResendCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCountdown]);

  function resetVerification() {
    setEmailVerified(false);
    setVerificationSent(false);
    setVerificationCode("");
    setVerifyNotice(null);
    setDevCodeHint("");
    setResendCountdown(0);
  }

  function handleEmailChange(event: ChangeEvent<HTMLInputElement>) {
    setEmail(event.target.value);

    // 인증 진행/완료 후 이메일이 바뀌면 인증 상태를 초기화합니다.
    if (emailVerified || verificationSent) {
      resetVerification();
    }
  }

  async function handleSendCode() {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setVerifyNotice({ text: "이메일을 먼저 입력해 주세요.", type: "error" });
      return;
    }

    setIsSendingCode(true);
    setVerifyNotice(null);
    setDevCodeHint("");

    const response = await fetch("/api/auth/email-verification/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: trimmedEmail }),
    });
    const data = (await response.json().catch(() => ({}))) as SendCodeResponse;
    setIsSendingCode(false);

    if (!response.ok) {
      setVerifyNotice({ text: data.message ?? "인증코드를 보내지 못했습니다.", type: "error" });
      if (typeof data.retryAfterSeconds === "number") {
        setResendCountdown(data.retryAfterSeconds);
      }
      return;
    }

    setVerificationSent(true);
    setVerificationCode("");
    setResendCountdown(60);
    setVerifyNotice({ text: data.message ?? "인증코드를 보냈습니다.", type: "info" });

    if (typeof data.devCode === "string") {
      setDevCodeHint(data.devCode);
    }
  }

  async function handleConfirmCode() {
    setIsConfirmingCode(true);
    setVerifyNotice(null);

    const response = await fetch("/api/auth/email-verification/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), code: verificationCode }),
    });
    const data = (await response.json().catch(() => ({}))) as VerifyResponse;
    setIsConfirmingCode(false);

    if (!response.ok) {
      setVerifyNotice({ text: data.message ?? "인증코드 확인에 실패했습니다.", type: "error" });
      return;
    }

    setEmailVerified(true);
    setVerificationSent(false);
    setResendCountdown(0);
    setDevCodeHint("");
    setVerifyNotice({ text: "이메일 인증이 완료되었습니다.", type: "success" });
  }

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSignup && !emailVerified) {
      setMessage("이메일 인증을 완료해 주세요.");
      return;
    }

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
    resetVerification();
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
          {isSignup
            ? "이메일 인증을 완료해야 회원가입을 진행할 수 있습니다. 비밀번호는 서버에서 해시 처리되어 저장됩니다."
            : "소셜 로그인 없이 이메일과 비밀번호만 사용합니다. 비밀번호는 서버에서 해시 처리되어 저장됩니다."}
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
          {isSignup ? (
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="cashoom@example.com"
                autoComplete="email"
                readOnly={emailVerified}
                className={`min-w-0 flex-1 rounded-lg border px-4 py-3 text-sm outline-none transition focus:border-[#f2c230] ${
                  emailVerified ? "border-zinc-200 bg-zinc-100 text-zinc-500" : "border-zinc-300"
                }`}
              />
              {emailVerified ? (
                <span className="flex shrink-0 items-center gap-1 rounded-lg bg-emerald-50 px-3 text-xs font-extrabold text-emerald-600">
                  ✓ 인증완료
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={isSendingCode || resendCountdown > 0}
                  className="shrink-0 rounded-lg bg-zinc-950 px-4 text-xs font-extrabold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
                >
                  {isSendingCode
                    ? "전송 중..."
                    : resendCountdown > 0
                      ? `재전송 ${resendCountdown}초`
                      : verificationSent
                        ? "재전송"
                        : "인증코드 받기"}
                </button>
              )}
            </div>
          ) : (
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="cashoom@example.com"
              autoComplete="email"
              className="rounded-lg border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-[#f2c230]"
            />
          )}
          {fieldErrors.email ? <span className="text-xs font-bold text-red-600">{fieldErrors.email}</span> : null}
        </label>

        {isSignup && verificationSent && !emailVerified ? (
          <div className="grid gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ""))}
                placeholder="인증코드 6자리"
                className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-4 py-3 text-sm tracking-[0.3em] outline-none transition focus:border-[#f2c230]"
              />
              <button
                type="button"
                onClick={handleConfirmCode}
                disabled={isConfirmingCode || verificationCode.length !== 6}
                className="shrink-0 rounded-lg bg-[#ffd84d] px-5 text-xs font-black text-zinc-950 transition hover:bg-[#f2c230] disabled:cursor-not-allowed disabled:bg-zinc-300"
              >
                {isConfirmingCode ? "확인 중..." : "확인"}
              </button>
            </div>
            <p className="text-xs leading-5 text-zinc-500">
              메일로 받은 6자리 코드를 입력해 주세요. 코드는 10분간 유효합니다.
            </p>
            {devCodeHint ? (
              <p className="text-xs font-bold text-amber-700">
                개발 모드 테스트 코드:{" "}
                <span className="font-black tracking-widest text-amber-800">{devCodeHint}</span>
              </p>
            ) : null}
          </div>
        ) : null}

        {isSignup && verifyNotice ? (
          <p className={`text-xs font-bold ${verifyNoticeTone[verifyNotice.type]}`}>{verifyNotice.text}</p>
        ) : null}

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
          disabled={isSubmitting || (isSignup && !emailVerified)}
          className="mt-2 rounded-full bg-zinc-950 px-5 py-4 text-sm font-black text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {isSubmitting ? "처리 중..." : isSignup ? "회원가입하기" : "로그인하기"}
        </button>

        {isSignup && !emailVerified ? (
          <p className="text-center text-xs font-bold text-zinc-400">
            이메일 인증을 완료하면 회원가입 버튼이 활성화됩니다.
          </p>
        ) : null}
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
