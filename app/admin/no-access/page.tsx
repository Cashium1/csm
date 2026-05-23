import Link from "next/link";

export default function AdminNoAccessPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center text-center">
      <div className="mt-12 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-3xl">
        🔒
      </div>
      <h1 className="mt-5 text-2xl font-black text-zinc-950">접근 권한이 없습니다</h1>
      <p className="mt-3 text-sm leading-6 text-zinc-600">
        이 화면을 보려면 다른 권한이 필요합니다. 권한 부여는 최고관리자에게 문의해 주세요.
      </p>
      <Link
        href="/admin/dashboard"
        className="mt-6 rounded-full bg-zinc-950 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-zinc-800"
      >
        대시보드로 돌아가기
      </Link>
    </div>
  );
}
