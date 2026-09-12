'use client';

import { useState, useEffect } from "react";
import { Shield, Menu, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems = [
    { label: "Каталог патентов", href: "#catalog" },
    { label: "Как мы работаем", href: "#how-it-works" },
    { label: "Услуги", href: "#services" },
    { label: "Вопросы", href: "#faq" },
    { label: "Продать патент", href: "#sell" },
  ];

  const scrollTo = (href: string) => {
    setMobileOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-border/60 bg-background/90 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex items-center gap-2.5"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/40">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-base font-bold tracking-tight">
              Ipat<span className="text-primary">.su</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Покупка · Продажа · Лицензии
            </span>
          </div>
        </a>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => scrollTo(item.href)}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href="tel:+74951234567"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <Phone className="h-4 w-4" />
            +7 (495) 123-45-67
          </a>
          <Button
            onClick={() => scrollTo("#sell")}
            className="glow-primary bg-primary text-primary-foreground hover:bg-primary/90"
            size="sm"
          >
            Разместить патент
          </Button>
        </div>

        <button
          className="rounded-md p-2 text-muted-foreground lg:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Меню"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border/60 bg-background/95 backdrop-blur-xl lg:hidden">
          <div className="container mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => scrollTo(item.href)}
                className="rounded-md px-3 py-2.5 text-left text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                {item.label}
              </button>
            ))}
            <a
              href="tel:+74951234567"
              className="mt-2 flex items-center gap-2 px-3 py-2 text-sm font-medium"
            >
              <Phone className="h-4 w-4 text-primary" />
              +7 (495) 123-45-67
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
