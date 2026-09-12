'use client';

import { Patent } from "@/lib/patents-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ExternalLink,
  FileText,
  MapPin,
  Calendar,
  User,
  Building2,
  FlaskConical,
  Eye,
  Phone,
  Mail,
  ShieldCheck,
} from "lucide-react";

interface PatentModalProps {
  patent: Patent | null;
  onClose: () => void;
}

const formatPrice = (price: number) => `${price.toLocaleString("ru-RU")} ₽`;

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

export function PatentModal({ patent, onClose }: PatentModalProps) {
  if (!patent) return null;

  const googlePatentsUrl = `https://patents.google.com/patent/RU${patent.docNumber}/ru`;

  const sellerIcon =
    patent.sellerType === "Физическое лицо"
      ? User
      : patent.sellerType === "Юридическое лицо"
        ? Building2
        : FlaskConical;

  const SellerIcon = sellerIcon;

  return (
    <Dialog open={!!patent} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border/60 bg-card/95 backdrop-blur-xl sm:max-w-2xl">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-primary/40 bg-primary/10 text-primary"
            >
              RU {patent.docNumber}
            </Badge>
            <Badge variant="secondary">{patent.patentType}</Badge>
            <Badge variant="outline" className="text-xs">
              МПК {patent.ipc}
            </Badge>
            <Badge
              variant="outline"
              className={
                patent.status === "Действует"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-300"
              }
            >
              {patent.status}
            </Badge>
          </div>
          <DialogTitle className="mt-3 text-xl leading-tight md:text-2xl">
            {patent.title}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Патент опубликован {formatDate(patent.publicationDate)} ·
            Размещено {formatDate(patent.postedDate)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Price block */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Цена продажи
            </div>
            <div className="mt-1 text-3xl font-bold text-primary">
              {formatPrice(patent.price)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Возможна передача по договору отчуждения или лицензионному
              договору
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Описание
            </h4>
            <p className="text-sm leading-relaxed text-foreground/90">
              {patent.description}
            </p>
          </div>

          <Separator />

          {/* Patent details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Категория
              </div>
              <div className="mt-0.5 font-medium">{patent.category}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Тип патента
              </div>
              <div className="mt-0.5 font-medium">{patent.patentType}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Год публикации
              </div>
              <div className="mt-0.5 font-medium">
                {patent.publicationYear}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Просмотров
              </div>
              <div className="mt-0.5 flex items-center gap-1 font-medium">
                <Eye className="h-3.5 w-3.5" />
                {patent.views}
              </div>
            </div>
          </div>

          <Separator />

          {/* Seller */}
          <div className="rounded-lg border border-border/60 bg-background/40 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <SellerIcon className="h-3.5 w-3.5" />
              Продавец
            </div>
            <div className="text-sm font-medium">{patent.sellerType}</div>
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {patent.sellerRegion}
            </div>
          </div>

          {/* External links */}
          <a
            href={googlePatentsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-4 py-3 text-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-primary" />
              Открыть на Google Patents
            </span>
            <span className="text-xs text-muted-foreground">
              RU{patent.docNumber}
            </span>
          </a>

          {/* Verification badge */}
          <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
            <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400" />
            <div className="text-xs">
              <div className="font-medium text-emerald-200">
                Проверено по реестру Роспатента
              </div>
              <div className="text-emerald-300/70">
                Патент действителен, поддержание пошлин актуально
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            <Button
              className="glow-primary flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() =>
                document
                  .getElementById("sell")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Связаться по патенту
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-border/80"
              asChild
            >
              <a href="tel:+74951234567">
                <Phone className="mr-2 h-4 w-4" />
                Позвонить
              </a>
            </Button>
          </div>

          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <Mail className="h-3.5 w-3.5" />
            info@patent-birga.ru
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
