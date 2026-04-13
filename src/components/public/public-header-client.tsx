"use client";

import Link from "next/link";
import { useLanguage } from "@/components/providers/language-provider";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageToggle } from "@/components/ui/language-toggle";

export function PublicHeaderClient() {
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-maroon-800">Mangalam</span>
          </Link>

          <nav className="hidden md:flex items-center gap-4">
            <Link
              href="/events"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.nav.events}
            </Link>
            <Link
              href="/gallery"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.nav.gallery}
            </Link>
            <Link
              href="/availability"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.nav.availability}
            </Link>
            <Link
              href="/quote"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.nav.getQuote}
            </Link>
            <Link
              href="/inquiry"
              className="inline-flex h-9 items-center justify-center rounded-md bg-maroon-700 px-4 text-sm font-medium text-white hover:bg-maroon-800 transition-colors"
            >
              {t.nav.bookNow}
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.nav.adminLogin}
            </Link>

            {/* Theme + Language toggles */}
            <div className="flex items-center gap-1 pl-2 border-l">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
