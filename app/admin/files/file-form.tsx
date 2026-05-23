"use client";

import { useRouter } from "next/navigation";
import { SyntheticEvent, useState } from "react";
import { FILE_TYPES } from "@/lib/admin-constants";
import type { FileEntry } from "@/lib/admin-extra2";

const labelCls = "grid gap-2 text-sm font-bold text-zinc-700";
const inputCls =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#f2c230]";

export function FileForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial: FileEntry | null;
}) {
  const router = useRouter();
  const [fileName, setFileName] = useState(initial?.fileName ?? "");
  const [fileType, setFileType] = useState(initial?.fileType ?? "pdf");
  const [fileUrl, setFileUrl] = useState(initial?.fileUrl ?? "");
  const [fileSize, setFileSize] = useState(
    initial?.fileSize === null || initial?.fileSize === undefined ? "" : String(initial.fileSize),
  );
  const [relatedCourseId, setRelatedCourseId] = useState(initial?.relatedCourseId ?? "");
  const [relatedCourseTitle, setRelatedCourseTitle] = useState(initial?.relatedCourseTitle ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ text: string; tone: "ok" | "error" } | null>(null);

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!fileName.trim() || !fileUrl.trim()) {
      setNotice({ text: "파일명과 URL은 필수입니다.", tone: "error" });
      return;
    }
    setIsSubmitting(true);
    setNotice(null);

    const payload = {
      fileName,
      fileType,
      fileUrl,
      fileSize: fileSize === "" ? null : Number(fileSize) || null,
      relatedCourseId: relatedCourseId || null,
      relatedCourseTitle: relatedCourseTitle || null,
      isActive,
    };

    const url = mode === "create" ? "/api/admin/files" : `/api/admin/files/${initial?.id}`;
    const response = await fetch(url, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { message?: string };
      setNotice({ text: data.message ?? "저장에 실패했습니다.", tone: "error" });
      return;
    }

    if (mode === "create") {
      router.push("/admin/files");
    } else {
      router.refresh();
      setNotice({ text: "저장되었습니다.", tone: "ok" });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <label className={`${labelCls} md:col-span-2`}>
            파일명 <span className="text-red-500">*</span>
            <input
              required
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className={labelCls}>
            파일 유형
            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
              className={inputCls}
            >
              {FILE_TYPES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className={labelCls}>
            파일 크기 (Byte, 선택)
            <input
              type="number"
              min={0}
              value={fileSize}
              onChange={(e) => setFileSize(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className={`${labelCls} md:col-span-2`}>
            파일 URL <span className="text-red-500">*</span>
            <input
              required
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="/course-materials/xxx.pdf 또는 https://..."
              className={inputCls}
            />
          </label>
          <label className={labelCls}>
            연결된 강의 슬러그 (선택)
            <input
              value={relatedCourseId}
              onChange={(e) => setRelatedCourseId(e.target.value)}
              placeholder="ai-service-builder"
              className={inputCls}
            />
          </label>
          <label className={labelCls}>
            연결된 강의 제목 (선택)
            <input
              value={relatedCourseTitle}
              onChange={(e) => setRelatedCourseTitle(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className="md:col-span-2 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-bold text-zinc-800">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            활성 상태
          </label>
        </div>
      </section>

      {notice ? (
        <p
          className={`rounded-lg p-3 text-sm font-bold ${
            notice.tone === "ok"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {notice.text}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-extrabold text-zinc-700 transition hover:border-zinc-950"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {isSubmitting ? "저장 중..." : mode === "create" ? "등록하기" : "저장하기"}
        </button>
      </div>
    </form>
  );
}
