"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/language-provider";
import { localeLabels } from "@/lib/i18n";

export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useLanguage();
  const next = locale === "en" ? "hi" : "en";

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLocale(next)}
      className={`h-8 px-2 text-xs font-semibold min-w-[2rem] ${className ?? ""}`}
      title={locale === "en" ? "हिंदी में बदलें" : "Switch to English"}
    >
      {localeLabels[next]}
    </Button>
  );
}
