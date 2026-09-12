'use client';

import { Shield, Mail, Phone, MapPin } from "lucide-react";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border/40 bg-card/30 backdrop-blur-sm">
      <div className="container mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/40">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-base font-bold tracking-tight">
                  Патент<span className="text-primary">Биржа</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Покупка · Продажа · Лицензии
                </span>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Биржа патентов РФ с проверенными объявлениями. Юридическое
              сопровождение сделок с патентами на изобретения и полезные
              модели.
            </p>
          </div>

          {/* Nav columns */}
          <div>
            <h4 className="mb-4 text-sm font-semibold">Каталог</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="#catalog"
                  className="transition-colors hover:text-primary"
                >
                  Все патенты
                </a>
              </li>
              <li>
                <a
                  href="#catalog"
                  className="transition-colors hover:text-primary"
                >
                  Изобретения
                </a>
              </li>
              <li>
                <a
                  href="#catalog"
                  className="transition-colors hover:text-primary"
                >
                  Полезные модели
                </a>
              </li>
              <li>
                <a
                  href="#sell"
                  className="transition-colors hover:text-primary"
                >
                  Разместить патент
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold">Информация</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="#how-it-works"
                  className="transition-colors hover:text-primary"
                >
                  Как мы работаем
                </a>
              </li>
              <li>
                <a
                  href="#services"
                  className="transition-colors hover:text-primary"
                >
                  Услуги и цены
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  className="transition-colors hover:text-primary"
                >
                  Частые вопросы
                </a>
              </li>
              <li>
                <a
                  href="#sell"
                  className="transition-colors hover:text-primary"
                >
                  Связаться с нами
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold">Контакты</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a
                  href="tel:+74951234567"
                  className="flex items-center gap-2 transition-colors hover:text-primary"
                >
                  <Phone className="h-4 w-4 text-primary" />
                  +7 (495) 123-45-67
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@patent-birga.ru"
                  className="flex items-center gap-2 transition-colors hover:text-primary"
                >
                  <Mail className="h-4 w-4 text-primary" />
                  info@patent-birga.ru
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  Москва, Бережковская наб., 30 корп. 1
                  <br />
                  Пн–Чт 9:30–18:15, Пт 9:30–17:00
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-border/40 pt-6 text-xs text-muted-foreground md:flex-row md:items-center">
          <div>
            © {year} ПатентБиржа. Все права защищены.
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <a href="#" className="transition-colors hover:text-primary">
              Политика конфиденциальности
            </a>
            <a href="#" className="transition-colors hover:text-primary">
              Договор оферты
            </a>
            <a href="#" className="transition-colors hover:text-primary">
              Реквизиты
            </a>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-border/40 bg-background/40 p-3 text-xs text-muted-foreground">
          <strong className="text-foreground">Дисклеймер:</strong> Информация
          на сайте носит ознакомительный характер и не является публичной
          офертой. Все сделки с патентами совершаются в соответствии с
          Гражданским кодексом РФ (часть 4) и регистрируются в Роспатенте.
          Проверка статуса патентов осуществляется по официальному реестру
          ФИПС.
        </div>
      </div>
    </footer>
  );
}
