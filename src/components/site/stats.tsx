'use client';

import { patents } from "@/lib/patents-data";

export function Stats() {
  const total = patents.length;
  const activeCount = patents.filter((p) => p.status === "Действует").length;
  const categoriesCount = new Set(patents.map((p) => p.category)).size;
  const regionsCount = new Set(patents.map((p) => p.sellerRegion)).size;

  const stats = [
    {
      value: total.toString(),
      label: "Активных объявлений",
      sub: "Проверенные патенты 2023–2026",
    },
    {
      value: activeCount.toString(),
      label: "Действующих патентов",
      sub: "С актуальным статусом Роспатента",
    },
    {
      value: categoriesCount.toString(),
      label: "Отраслей и направлений",
      sub: "От машиностроения до IT",
    },
    {
      value: regionsCount.toString(),
      label: "Регионов России",
      sub: "От Москвы до Дальнего Востока",
    },
  ];

  return (
    <section className="border-y border-border/40 bg-card/30 backdrop-blur-sm">
      <div className="container mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-12">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
          {stats.map((s, i) => (
            <div key={i} className="text-center md:text-left">
              <div className="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
                {s.value}
              </div>
              <div className="mt-1.5 text-sm font-medium text-foreground">
                {s.label}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {s.sub}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
