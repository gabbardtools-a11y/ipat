'use client';

import { Search, FileCheck, Handshake, Receipt } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "1. Поиск и подбор",
    description:
      "Заказчик находит подходящий патент в нашем каталоге или оставляет заявку на подбор по параметрам. Проверяем статус патента в реестре Роспатента.",
  },
  {
    icon: FileCheck,
    title: "2. Проверка иDue diligence",
    description:
      "Юристы проверяют патент: действительность, отсутствие обременений, цепочка переходов прав, поддержание пошлин. Готовим заключение.",
  },
  {
    icon: Handshake,
    title: "3. Переговоры и сделка",
    description:
      "Согласуем цену и условия с продавцом. Подготавливаем договор отчуждения или лицензионный договор с учётом интересов обеих сторон.",
  },
  {
    icon: Receipt,
    title: "4. Регистрация в Роспатенте",
    description:
      "Подаем документы на государственную регистрацию перехода прав. Сопровождаем сделку до момента внесения записи в Государственный реестр.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="border-y border-border/40 bg-card/20 py-16 md:py-24"
    >
      <div className="container mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-12 text-center">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Процесс
          </div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Как мы работаем
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Прозрачный и юридически корректный процесс сделки с патентом — от
            первого контакта до регистрации прав в Роспатенте
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={i}
                className="group relative overflow-hidden rounded-xl border border-border/60 bg-card/40 p-6 backdrop-blur transition-colors hover:border-primary/40"
              >
                <div className="pointer-events-none absolute -right-4 -top-4 text-7xl font-bold text-primary/5 transition-colors group-hover:text-primary/10">
                  {i + 1}
                </div>
                <div className="relative">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/40">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 font-semibold">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
