"use client";

import { useEffect, useState } from "react";
import type { Notice } from "@/lib/data";

export function NoticeList({ notices }: { notices: Notice[] }) {
  const [activeNotice, setActiveNotice] = useState<Notice | null>(null);

  return (
    <>
      <div className="mt-8 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white shadow-sm">
        {notices.map((notice) => (
          <article key={notice.title} className="p-5 transition hover:bg-[#fffdf2]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-black text-zinc-950">{notice.title}</h2>
              <time className="text-sm font-bold text-zinc-500">{notice.date}</time>
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{notice.summary}</p>
            <button
              type="button"
              onClick={() => setActiveNotice(notice)}
              className="mt-4 text-sm font-extrabold text-zinc-950 underline decoration-[#ffd84d] decoration-4"
            >
              상세보기
            </button>
          </article>
        ))}
      </div>
      {activeNotice ? (
        <NoticeModal notice={activeNotice} onClose={() => setActiveNotice(null)} />
      ) : null}
    </>
  );
}

function NoticeModal({ notice, onClose }: { notice: Notice; onClose: () => void }) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-zinc-950/70 px-4 py-6"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="notice-modal-title"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-6 py-5">
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-[#b77900]">NOTICE</p>
            <h3 id="notice-modal-title" className="mt-1 text-xl font-black text-zinc-950">
              {notice.title}
            </h3>
            <time className="mt-1 block text-sm font-bold text-zinc-500">{notice.date}</time>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="shrink-0 rounded-full bg-zinc-950 px-3 py-2 text-xs font-extrabold text-white transition hover:bg-zinc-800"
          >
            닫기
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-4">
            {notice.content.map((paragraph, index) => (
              <p key={index} className="text-sm leading-7 text-zinc-700">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
