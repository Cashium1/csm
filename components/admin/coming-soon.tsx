type ComingSoonProps = {
  title: string;
  description?: string;
};

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-zinc-950">{title}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {description ?? "이 기능은 MVP 이후 단계에서 제공될 예정입니다."}
        </p>
      </div>
      <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center">
        <p className="text-3xl">🛠️</p>
        <h2 className="mt-3 text-lg font-black text-zinc-950">곧 제공 예정</h2>
        <p className="mt-2 text-sm text-zinc-600">
          MVP에서는 대시보드 · 강의 관리 · 회원 관리 · 결제 관리 · 공지사항 관리 5개 영역을 먼저
          제공합니다. 우선순위에 따라 순차 확장됩니다.
        </p>
      </div>
    </div>
  );
}
