"use client";

import { useMemo, useState } from "react";
import { CourseCard } from "@/components/course-card";
import { categoryGroups, courses, type TrackKey } from "@/lib/data";

type FilterKey = "all" | TrackKey;
type SortKey = "recommended" | "price" | "duration";

const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "전체" },
  ...categoryGroups.map((group) => ({ key: group.key, label: group.title })),
];

export function CourseCatalog() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("recommended");

  const visibleCourses = useMemo(() => {
    const filtered = filter === "all" ? courses : courses.filter((course) => course.group === filter);
    const copied = [...filtered];

    if (sort === "price") {
      copied.sort((a, b) => a.priceNumber - b.priceNumber);
    }

    if (sort === "duration") {
      copied.sort((a, b) => a.minutes - b.minutes);
    }

    return copied;
  }, [filter, sort]);

  return (
    <div className="mt-10">
      <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-2 overflow-x-auto">
          {filters.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition ${
                filter === item.key ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-3 text-sm font-bold text-zinc-700">
          정렬
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortKey)}
            className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-bold outline-none transition focus:border-[#f2c230]"
          >
            <option value="recommended">추천순</option>
            <option value="price">낮은 가격순</option>
            <option value="duration">짧은 학습순</option>
          </select>
        </label>
      </div>

      {categoryGroups.map((group) => {
        const groupCourses = visibleCourses.filter((course) => course.group === group.key);
        if (!groupCourses.length) return null;

        return (
          <section key={group.key} className="mt-10">
            <div className="mb-5">
              <h2 className="text-xl font-black text-zinc-950">{group.title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{group.description}</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {groupCourses.map((course) => (
                <CourseCard key={course.slug} course={course} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
