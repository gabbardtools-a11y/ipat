'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Send, FileText, FileSignature, Search, CheckCircle2 } from "lucide-react";
import { categories } from "@/lib/patents-data";

export function SellForm() {
  const [submitted, setSubmitted] = useState(false);
  const [formType, setFormType] = useState<"sell" | "buy" | "license">("sell");
  const [patentNumber, setPatentNumber] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !phone) {
      toast.error("Заполните имя и телефон");
      return;
    }

    // Simulate submission
    toast.success("Заявка отправлена!", {
      description: "Мы свяжемся с вами в течение 1 рабочего дня.",
    });

    setSubmitted(true);
    // Reset after showing success
    setTimeout(() => {
      setSubmitted(false);
      setPatentNumber("");
      setName("");
      setPhone("");
      setEmail("");
      setPrice("");
      setCategory("");
      setDescription("");
    }, 4000);
  };

  const typeOptions = [
    {
      value: "sell" as const,
      label: "Продать патент",
      icon: FileText,
      desc: "Хочу продать свой патент",
    },
    {
      value: "buy" as const,
      label: "Купить патент",
      icon: Search,
      desc: "Ищу патент под задачи",
    },
    {
      value: "license" as const,
      label: "Лицензия",
      icon: FileSignature,
      desc: "Передать/получить лицензию",
    },
  ];

  return (
    <section
      id="sell"
      className="relative overflow-hidden py-16 md:py-24"
    >
      {/* Decorative glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />

      <div className="container relative mx-auto max-w-4xl px-4 md:px-6">
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/50 backdrop-blur-xl">
          <div className="border-b border-border/40 bg-gradient-to-r from-primary/10 via-transparent to-cyan-500/10 p-6 md:p-8">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Send className="h-3.5 w-3.5" />
              Разместить обращение
            </div>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Продать или купить патент
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Оставьте заявку — наш специалист свяжется с вами в течение одного
              рабочего дня. Бесплатная консультация и оценка патента.
            </p>
          </div>

          <div className="p-6 md:p-8">
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold">Заявка отправлена!</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Мы свяжемся с вами в течение 1 рабочего дня по указанному
                  телефону.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Type selector */}
                <div>
                  <Label className="mb-2 block text-sm font-medium">
                    Тип обращения
                  </Label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {typeOptions.map((opt) => {
                      const Icon = opt.icon;
                      const active = formType === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setFormType(opt.value)}
                          className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-all ${
                            active
                              ? "border-primary bg-primary/10"
                              : "border-border/60 bg-background/40 hover:border-primary/40"
                          }`}
                        >
                          <Icon
                            className={`mt-0.5 h-5 w-5 ${
                              active ? "text-primary" : "text-muted-foreground"
                            }`}
                          />
                          <div>
                            <div className="text-sm font-medium">
                              {opt.label}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {opt.desc}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Patent info */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="patentNumber" className="text-sm">
                      Номер патента {formType !== "buy" && "(если известен)"}
                    </Label>
                    <Input
                      id="patentNumber"
                      value={patentNumber}
                      onChange={(e) => setPatentNumber(e.target.value)}
                      placeholder={formType === "buy" ? "Не указан" : "Например, 2869222"}
                      className="bg-background/60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-sm">
                      Отрасль
                    </Label>
                    <Select
                      value={category || "all"}
                      onValueChange={(v) =>
                        setCategory(v === "all" ? "" : v)
                      }
                    >
                      <SelectTrigger className="bg-background/60">
                        <SelectValue placeholder="Выберите отрасль" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Не выбрана</SelectItem>
                        {categories.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formType !== "buy" && (
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-sm">
                      Желаемая цена, ₽
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="Например, 1500000"
                      className="bg-background/60"
                    />
                  </div>
                )}

                {/* Contact info */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm">
                      Имя <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Иван Иванов"
                      required
                      className="bg-background/60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm">
                      Телефон <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+7 (___) ___-__-__"
                      required
                      className="bg-background/60"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ivan@example.com"
                    className="bg-background/60"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm">
                    {formType === "buy"
                      ? "Что ищете — кратко опишите задачу"
                      : "Краткое описание патента"}
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={
                      formType === "buy"
                        ? "Например: нужен патент на способ очистки воды, бюджет до 1 млн ₽"
                        : "Например: изобретение относится к области машиностроения, патент действующий, документы в порядке"
                    }
                    rows={4}
                    className="resize-none bg-background/60"
                  />
                </div>

                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    Нажимая кнопку, вы соглашаетесь на обработку персональных
                    данных
                  </p>
                  <Button
                    type="submit"
                    size="lg"
                    className="glow-primary w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Отправить заявку
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
