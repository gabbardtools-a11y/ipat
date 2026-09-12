'use client';

import { useState, useMemo } from "react";
import { SiteHeader } from "@/components/site/site-header";
import { Hero } from "@/components/site/hero";
import { Stats } from "@/components/site/stats";
import { PatentsCatalog } from "@/components/site/patents-catalog";
import { HowItWorks } from "@/components/site/how-it-works";
import { Services } from "@/components/site/services";
import { Faq } from "@/components/site/faq";
import { SellForm } from "@/components/site/sell-form";
import { SiteFooter } from "@/components/site/site-footer";
import { patents } from "@/lib/patents-data";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [sortBy, setSortBy] = useState<string>("newest");

  const filteredPatents = useMemo(() => {
    let result = [...patents];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.docNumber.includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.ipc.toLowerCase().includes(q),
      );
    }
    if (selectedCategory) {
      result = result.filter((p) => p.category === selectedCategory);
    }
    if (selectedRegion) {
      result = result.filter((p) => p.sellerRegion === selectedRegion);
    }
    if (selectedYear) {
      result = result.filter(
        (p) => p.publicationYear.toString() === selectedYear,
      );
    }
    if (maxPrice !== "") {
      result = result.filter((p) => p.price <= maxPrice);
    }

    switch (sortBy) {
      case "newest":
        result.sort(
          (a, b) =>
            new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime(),
        );
        break;
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "popular":
        result.sort((a, b) => b.views - a.views);
        break;
    }

    return result;
  }, [searchQuery, selectedCategory, selectedRegion, selectedYear, maxPrice, sortBy]);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    // Scroll to catalog
    setTimeout(() => {
      document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedRegion("");
    setSelectedYear("");
    setMaxPrice("");
    setSortBy("newest");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="flex-1">
        <Hero onSearch={handleSearch} />
        <Stats />
        <PatentsCatalog
          patents={filteredPatents}
          totalCount={patents.length}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedRegion={selectedRegion}
          setSelectedRegion={setSelectedRegion}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
          sortBy={sortBy}
          setSortBy={setSortBy}
          resetFilters={resetFilters}
        />
        <HowItWorks />
        <Services />
        <Faq />
        <SellForm />
      </main>
      <SiteFooter />
    </div>
  );
}
