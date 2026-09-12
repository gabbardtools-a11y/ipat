'use client';

import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  FileSignature,
  Scale,
  Search,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

const services = [
  {
    icon: FileText,
    title: "Договор отчуждения патента",
    description:
      "Полная передача исключительных прав на патент. Готовим договор, согласуем с продавцом и покупателем, регистрируем в Роспатенте.",
    price: "от 30 000 ₽",
  },
  {
    icon: FileSignature,
    title: "Лицензионный договор",
    description:
      "Передача прав на использование патента на определенный срок или территорию. Простая и исключительная лицензия.",
    price: "от 25 000 ₽",
  },
  {
    icon: Search,
    title: "Проверка патента (due diligence)",
    description:
      "Юридическая проверка патента: действительность, обременения, цепочка собственников, поддержание пошлин.",
    price: "от 15 000 ₽",
  },
  {
    icon: ShieldCheck,
    title: "Поддержание патента в силе",
    description:
      "Контроль сроков уплаты пошлин за поддержание патента в силе. Напоминания и сопровождение оплаты.",
    price: "от 5 000 ₽/год",
  },
  {
    icon: Scale,
    title: "Разрешение патентных споров",
    description:
      "Представительство в Палате по патентным спорам Роспатента и судах по вопросам нарушения и оспаривания патентов.",
    price: "от 80 000 ₽",
  },
  {
    icon: TrendingUp,
    title: "Оценка стоимости патента",
    description:
      "Профессиональная оценка рыночной стоимости патента для продажи, взноса в уставный капитал или залога.",
    price: "от 40 000 ₽",
  },
];

export function Services() {
  return (
    <section id="services" className="py-16 md:py-24">
      <div className="container mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-12 text-center">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Услуги
          </div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Полный спектр услуг с патентами
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Сопровождаем сделки с патентами на всех этапах — от проверки до
            регистрации в Роспатенте
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => {
            const Icon = s.icon;
            return (
              <Card
                key={i}
                className="card-hover border-border/60 bg-card/40 backdrop-blur"
              >
                <CardContent className="flex flex-col gap-3 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/40">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                      {s.price}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {s.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
