'use client';

import { Patent } from "@/lib/patents-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, MapPin, Calendar, FileText } from "lucide-react";

interface PatentCardProps {
  patent: Patent;
  onClick: () => void;
}

const formatPrice = (price: number) => {
  if (price >= 1_000_000) {
    return `${(price / 1_000_000).toFixed(price % 1_000_000 === 0 ? 0 : 1)} млн ₽`;
  }
  return `${price.toLocaleString("ru-RU")} ₽`;
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export function PatentCard({ patent, onClick }: PatentCardProps) {
  const statusColor =
    patent.status === "Действует"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
      : patent.status === "Продан"
        ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
        : "bg-blue-500/15 text-blue-300 border-blue-500/30";

  return (
    <Card
      onClick={onClick}
      className="card-hover group cursor-pointer overflow-hidden border-border/60 bg-card/60 backdrop-blur"
    >
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <Badge
            variant="outline"
            className="border-primary/40 bg-primary/10 text-primary"
          >
            RU {patent.docNumber}
          </Badge>
          <Badge variant="outline" className={statusColor}>
            {patent.status}
          </Badge>
        </div>

        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug transition-colors group-hover:text-primary">
          {patent.title}
        </h3>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="text-[11px]">
            {patent.category}
          </Badge>
          <Badge variant="secondary" className="text-[11px]">
            МПК {patent.ipc}
          </Badge>
        </div>

        <div className="mt-auto space-y-1.5 border-t border-border/40 pt-3 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(patent.publicationDate)}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {patent.sellerRegion}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              {patent.patentType}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {patent.views}
            </span>
          </div>
        </div>

        <div className="flex items-end justify-between border-t border-border/40 pt-3">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Цена
            </div>
            <div className="text-lg font-bold text-foreground">
              {formatPrice(patent.price)}
            </div>
          </div>
          <span className="text-xs font-medium text-primary transition-transform group-hover:translate-x-1">
            Подробнее →
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
