"use client";

import { useRouter } from "next/navigation";
import { ChangeEvent, SyntheticEvent, useEffect, useState } from "react";

type ProfileUser = {
  name: string;
  email: string;
  createdAt: string;
};

type ProfileErrors = {
  currentPassword?: string;
  name?: string;
  email?: string;
  password?: string;
  passwordConfirm?: string;
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

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const inputClassName =
  "rounded-lg border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-[#f2c230]";

export function ProfileSection({ user }: { user: ProfileUser }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isGateOpen, setIsGateOpen] = useState(false);
  const [verifiedPassword, setVerifiedPassword] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  function closeEditing() {
    setIsEditing(false);
    setVerifiedPassword("");
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-zinc-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-extrabold text-[#b77900]">PROFILE</p>
          <h2 className="mt-2 text-2xl font-black text-zinc-950">회원 정보</h2>
        </div>
        {!isEditing ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setSavedMessage("");
                setIsGateOpen(true);
              }}
              className="inline-flex rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-extrabold text-zinc-700 transition hover:border-zinc-950"
            >
              회원정보수정
            </button>
            <button
              type="button"
              onClick={() => setIsDeleteOpen(true)}
              className="inline-flex rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-extrabold text-red-600 transition hover:border-red-400 hover:bg-red-50"
            >
              회원탈퇴
            </button>
          </div>
        ) : null}
      </div>

      {isEditing ? (
        <ProfileEditForm
          user={user}
          currentPassword={verifiedPassword}
          onCancel={closeEditing}
          onSuccess={() => {
            closeEditing();
            setSavedMessage("회원 정보가 수정되었습니다.");
            router.refresh();
          }}
        />
      ) : (
        <>
          {savedMessage ? (
            <p className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-700">
              {savedMessage}
            </p>
          ) : null}
          <dl className="mt-5 grid gap-3 text-sm md:grid-cols-3">
            <ProfileField label="이름" value={user.name} />
            <ProfileField label="이메일" value={user.email} />
            <ProfileField label="가입일" value={dateFormatter.format(new Date(user.createdAt))} />
          </dl>
        </>
      )}

      {isGateOpen ? (
        <PasswordGateModal
          onClose={() => setIsGateOpen(false)}
          onSuccess={(password) => {
            setVerifiedPassword(password);
            setIsGateOpen(false);
            setIsEditing(true);
          }}
        />
      ) : null}

      {isDeleteOpen ? <DeleteAccountModal onClose={() => setIsDeleteOpen(false)} /> : null}
    </section>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-zinc-50 p-4">
      <dt className="text-sm font-bold text-zinc-500">{label}</dt>
      <dd className="mt-2 wrap-break-word text-sm font-extrabold text-zinc-900">{value}</dd>
    </div>
  );
}

// 회원정보 수정 진입 전 현재 비밀번호로 본인 확인을 받는 모달
function PasswordGateModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (password: string) => void;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isVerifying) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, isVerifying]);

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!password) {
      setError("비밀번호를 입력해 주세요.");
      return;
    }

    setIsVerifying(true);
    setError("");

    const response = await fetch("/api/auth/profile/verify-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (response.status === 401) {
      router.push("/login");
      return;
    }

    const data = (await response.json().catch(() => ({}))) as { message?: string };

    if (!response.ok) {
      setError(data.message ?? "비밀번호 확인에 실패했습니다.");
      setIsVerifying(false);
      return;
    }

    onSuccess(password);
  }

  return (
    <div
      role="presentation"
      onClick={isVerifying ? undefined : onClose}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-zinc-950/70 px-4 py-6"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="password-gate-title"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
      >
        <h3 id="password-gate-title" className="text-lg font-black text-zinc-950">
          본인 확인
        </h3>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          회원 정보를 수정하려면 현재 비밀번호를 입력해 주세요.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 grid gap-3" noValidate>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="현재 비밀번호"
            autoComplete="current-password"
            autoFocus
            className={inputClassName}
          />
          {error ? <p className="text-xs font-bold text-red-600">{error}</p> : null}
          <div className="mt-2 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isVerifying}
              className="inline-flex rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-extrabold text-zinc-700 transition hover:border-zinc-950 disabled:cursor-not-allowed disabled:text-zinc-400"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isVerifying}
              className="inline-flex rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
            >
              {isVerifying ? "확인 중..." : "확인"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProfileEditForm({
  user,
  currentPassword,
  onCancel,
  onSuccess,
}: {
  user: ProfileUser;
  currentPassword: string;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // 이메일 변경 시 인증 상태
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isConfirmingCode, setIsConfirmingCode] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [verifyNotice, setVerifyNotice] = useState<VerifyNotice | null>(null);
  const [devCodeHint, setDevCodeHint] = useState("");

  const originalEmail = user.email.trim().toLowerCase();
  const emailChanged = email.trim().toLowerCase() !== originalEmail;
  const needsEmailVerification = emailChanged && !emailVerified;

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

    // 이메일이 바뀌면 진행 중이던 인증 상태를 초기화합니다.
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
    const data = (await response.json().catch(() => ({}))) as {
      message?: string;
      devCode?: string;
      retryAfterSeconds?: number;
    };
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
    const data = (await response.json().catch(() => ({}))) as { message?: string };
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
    setMessage("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const nextErrors: ProfileErrors = {};

    if (!trimmedName) {
      nextErrors.name = "이름을 입력해 주세요.";
    } else if (trimmedName.length > 30) {
      nextErrors.name = "이름은 30자 이하로 입력해 주세요.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = "올바른 이메일을 입력해 주세요.";
    }

    if (password) {
      if (password.length < 8) {
        nextErrors.password = "비밀번호는 8자 이상이어야 합니다.";
      }
      if (password !== passwordConfirm) {
        nextErrors.passwordConfirm = "비밀번호가 일치하지 않습니다.";
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    if (needsEmailVerification) {
      setErrors({});
      setMessage("변경할 이메일의 인증을 완료해 주세요.");
      return;
    }

    setErrors({});
    setIsSaving(true);

    const response = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword,
        name: trimmedName,
        email: trimmedEmail,
        password: password || undefined,
      }),
    });

    if (response.status === 401) {
      router.push("/login");
      return;
    }

    const data = (await response.json().catch(() => ({}))) as {
      message?: string;
      errors?: ProfileErrors;
    };

    if (!response.ok) {
      setErrors(data.errors ?? {});
      setMessage(data.message ?? "회원 정보를 수정하지 못했습니다.");
      setIsSaving(false);
      return;
    }

    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 grid gap-4" noValidate>
      <label className="grid gap-2 text-sm font-bold text-zinc-700">
        이름
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
          className={inputClassName}
        />
        {errors.name ? <span className="text-xs font-bold text-red-600">{errors.name}</span> : null}
      </label>

      <label className="grid gap-2 text-sm font-bold text-zinc-700">
        이메일
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={handleEmailChange}
            autoComplete="email"
            className={`min-w-0 flex-1 ${inputClassName}`}
          />
          {emailChanged ? (
            emailVerified ? (
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
            )
          ) : null}
        </div>
        {errors.email ? <span className="text-xs font-bold text-red-600">{errors.email}</span> : null}
        {emailChanged && !errors.email ? (
          <span className="text-xs font-bold text-zinc-400">
            이메일을 변경하려면 새 이메일 인증을 완료해야 저장할 수 있습니다.
          </span>
        ) : null}
      </label>

      {emailChanged && verificationSent && !emailVerified ? (
        <div className="grid gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={verificationCode}
              onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ""))}
              placeholder="인증코드 6자리"
              className={`min-w-0 flex-1 tracking-[0.3em] ${inputClassName}`}
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
            변경할 이메일로 받은 6자리 코드를 입력해 주세요. 코드는 10분간 유효합니다.
          </p>
          {devCodeHint ? (
            <p className="text-xs font-bold text-amber-700">
              개발 모드 테스트 코드:{" "}
              <span className="font-black tracking-widest text-amber-800">{devCodeHint}</span>
            </p>
          ) : null}
        </div>
      ) : null}

      {emailChanged && verifyNotice ? (
        <p className={`text-xs font-bold ${verifyNoticeTone[verifyNotice.type]}`}>{verifyNotice.text}</p>
      ) : null}

      <label className="grid gap-2 text-sm font-bold text-zinc-700">
        새 비밀번호
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="변경하지 않으려면 비워 두세요 (8자 이상)"
          autoComplete="new-password"
          className={inputClassName}
        />
        {errors.password ? (
          <span className="text-xs font-bold text-red-600">{errors.password}</span>
        ) : null}
      </label>

      <label className="grid gap-2 text-sm font-bold text-zinc-700">
        새 비밀번호 확인
        <input
          type="password"
          value={passwordConfirm}
          onChange={(event) => setPasswordConfirm(event.target.value)}
          placeholder="새 비밀번호 재입력"
          autoComplete="new-password"
          className={inputClassName}
        />
        {errors.passwordConfirm ? (
          <span className="text-xs font-bold text-red-600">{errors.passwordConfirm}</span>
        ) : null}
      </label>

      {message ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
          {message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={isSaving || needsEmailVerification}
          className="inline-flex rounded-full bg-[#ffd84d] px-5 py-2.5 text-sm font-black text-zinc-950 transition hover:bg-[#f2c230] disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {isSaving ? "저장 중..." : "저장하기"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="inline-flex rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-extrabold text-zinc-700 transition hover:border-zinc-950 disabled:cursor-not-allowed disabled:text-zinc-400"
        >
          취소
        </button>
      </div>
    </form>
  );
}

function DeleteAccountModal({ onClose }: { onClose: () => void }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isDeleting) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, isDeleting]);

  async function handleDelete() {
    setIsDeleting(true);
    setError("");

    const response = await fetch("/api/auth/profile", { method: "DELETE" });

    if (response.status === 401) {
      window.location.href = "/login";
      return;
    }

    if (!response.ok) {
      setError("회원 탈퇴를 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      setIsDeleting(false);
      return;
    }

    window.location.href = "/";
  }

  return (
    <div
      role="presentation"
      onClick={isDeleting ? undefined : onClose}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-zinc-950/70 px-4 py-6"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
      >
        <h3 id="delete-account-title" className="text-lg font-black text-zinc-950">
          회원 탈퇴
        </h3>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          정말 탈퇴하시겠어요? 계정과 함께 수강 내역, 결제 내역, 담은 강의 등 모든 데이터가 영구적으로
          삭제되며 복구할 수 없습니다.
        </p>
        {error ? <p className="mt-3 text-sm font-bold text-red-600">{error}</p> : null}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="inline-flex rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-extrabold text-zinc-700 transition hover:border-zinc-950 disabled:cursor-not-allowed disabled:text-zinc-400"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex rounded-full bg-red-600 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
          >
            {isDeleting ? "탈퇴 처리 중..." : "탈퇴하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
