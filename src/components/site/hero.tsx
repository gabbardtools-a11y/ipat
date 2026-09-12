'use client';

import { useState } from "react";
import { Search, ArrowRight, ShieldCheck, FileCheck2, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HeroProps {
  onSearch: (q: string) => void;
}

export function Hero({ onSearch }: HeroProps) {
  const [query, setQuery] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <section
      id="top"
      className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-32"
    >
      {/* Decorative grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          color: "white",
          maskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 80%)",
        }}
      />

      {/* Glow orbs */}
      <div className="pointer-events-none absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 right-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="container relative mx-auto max-w-7xl px-4 md:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span>Работаем с реестром Роспатента · 2026</span>
          </div>

          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            Купить/продать патент на изобретение
            <br className="hidden md:block" /> или{" "}
            <span className="bg-gradient-to-r from-primary via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              полезную модель
            </span>{" "}
            в России
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-balance text-base text-muted-foreground md:text-lg">
            Биржа патентов РФ с проверенными объявлениями за 2023–2026 годы.
            Юридическое сопровождение сделок, проверка по реестру Роспатента,
            договоры отчуждения и лицензионные соглашения.
          </p>

          <form
            onSubmit={submit}
            className="mx-auto mt-8 flex max-w-2xl flex-col gap-2 sm:flex-row"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск по названию, номеру патента, МПК…"
                className="h-12 pl-10 pr-4 text-base border-border/80 bg-card/70 backdrop-blur"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="glow-primary h-12 bg-primary px-6 text-primary-foreground hover:bg-primary/90"
            >
              Найти патент
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Проверка через Роспатент
            </span>
            <span className="flex items-center gap-1.5">
              <FileCheck2 className="h-4 w-4 text-primary" />
              Договор отчуждения
            </span>
            <span className="flex items-center gap-1.5">
              <Scale className="h-4 w-4 text-primary" />
              Юридическое сопровождение
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
