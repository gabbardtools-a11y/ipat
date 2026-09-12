'use client';

import { useState } from "react";
import { Patent } from "@/lib/patents-data";
import { PatentCard } from "./patent-card";
import { PatentModal } from "./patent-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, X, MapPin, Calendar, Tag } from "lucide-react";
import { categories, regions } from "@/lib/patents-data";

interface PatentsCatalogProps {
  patents: Patent[];
  totalCount: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  selectedRegion: string;
  setSelectedRegion: (r: string) => void;
  selectedYear: string;
  setSelectedYear: (y: string) => void;
  maxPrice: number | "";
  setMaxPrice: (p: number | "") => void;
  sortBy: string;
  setSortBy: (s: string) => void;
  resetFilters: () => void;
}

export function PatentsCatalog({
  patents,
  totalCount,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedRegion,
  setSelectedRegion,
  selectedYear,
  setSelectedYear,
  maxPrice,
  setMaxPrice,
  sortBy,
  setSortBy,
  resetFilters,
}: PatentsCatalogProps) {
  const [selectedPatent, setSelectedPatent] = useState<Patent | null>(null);
  const [visibleCount, setVisibleCount] = useState(12);

  const years = ["2023", "2025", "2026"];
  const activeFilters =
    (selectedCategory ? 1 : 0) +
    (selectedRegion ? 1 : 0) +
    (selectedYear ? 1 : 0) +
    (maxPrice !== "" ? 1 : 0);

  return (
    <section id="catalog" className="py-16 md:py-24">
      <div className="container mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Tag className="h-3.5 w-3.5" />
              Каталог патентов
            </div>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Патенты на продажу
            </h2>
            <p className="mt-2 text-muted-foreground">
              Показано {patents.length} из {totalCount} объявлений · Все
              патенты проверены по реестру Роспатента
            </p>
          </div>
        </div>

        {/* Filters bar */}
        <div className="mb-8 space-y-4 rounded-xl border border-border/60 bg-card/40 p-4 backdrop-blur md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию, номеру или МПК…"
                className="pl-10 bg-background/60"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-56 bg-background/60">
                <SlidersHorizontal className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Сортировка" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Сначала новые</SelectItem>
                <SelectItem value="popular">По популярности</SelectItem>
                <SelectItem value="price-asc">Цена: по возрастанию</SelectItem>
                <SelectItem value="price-desc">Цена: по убыванию</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Select
              value={selectedCategory || "all"}
              onValueChange={(v) => setSelectedCategory(v === "all" ? "" : v)}
            >
              <SelectTrigger className="bg-background/60">
                <Tag className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Все отрасли" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все отрасли</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedRegion || "all"}
              onValueChange={(v) => setSelectedRegion(v === "all" ? "" : v)}
            >
              <SelectTrigger className="bg-background/60">
                <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Все регионы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все регионы</SelectItem>
                {regions.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedYear || "all"}
              onValueChange={(v) => setSelectedYear(v === "all" ? "" : v)}
            >
              <SelectTrigger className="bg-background/60">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Год публикации" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все годы</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="number"
              value={maxPrice === "" ? "" : maxPrice}
              onChange={(e) =>
                setMaxPrice(e.target.value === "" ? "" : Number(e.target.value))
              }
              placeholder="Макс. цена, ₽"
              className="bg-background/60"
            />
          </div>

          {activeFilters > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Активных фильтров: {activeFilters}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-7 text-xs"
              >
                <X className="mr-1 h-3.5 w-3.5" />
                Сбросить
              </Button>
            </div>
          )}
        </div>

        {/* Patents grid */}
        {patents.length === 0 ? (
          <div className="rounded-xl border border-border/60 bg-card/30 py-20 text-center">
            <p className="text-lg font-medium">Ничего не найдено</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Попробуйте изменить параметры поиска
            </p>
            <Button
              variant="outline"
              onClick={resetFilters}
              className="mt-4"
            >
              Сбросить фильтры
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {patents.slice(0, visibleCount).map((p) => (
                <PatentCard
                  key={p.id}
                  patent={p}
                  onClick={() => setSelectedPatent(p)}
                />
              ))}
            </div>

            {visibleCount < patents.length && (
              <div className="mt-10 flex justify-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setVisibleCount((c) => c + 12)}
                  className="border-border/80 bg-card/50"
                >
                  Показать ещё ({patents.length - visibleCount})
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <PatentModal
        patent={selectedPatent}
        onClose={() => setSelectedPatent(null)}
      />
    </section>
  );
}
