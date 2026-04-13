"use client";

import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";

interface FooterContentProps {
  phone: string;
  email: string;
  address: string;
  businessName: string;
  footerText: string;
  year: number;
}

export function FooterContent({
  phone,
  email,
  address,
  businessName,
  footerText,
  year,
}: FooterContentProps) {
  const { t } = useLanguage();

  return (
    <footer className="bg-maroon-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Branding */}
          <div>
            <h3 className="text-lg font-bold text-gold-400 mb-3">
              {businessName}
            </h3>
            <p className="text-sm text-maroon-200">{t.footer.tagline}</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-gold-400 mb-3">
              {t.footer.quickLinks}
            </h4>
            <ul className="space-y-2 text-sm text-maroon-200">
              <li>
                <Link
                  href="/#about"
                  className="hover:text-white transition-colors"
                >
                  {t.footer.aboutUs}
                </Link>
              </li>
              <li>
                <Link
                  href="/#venues"
                  className="hover:text-white transition-colors"
                >
                  {t.footer.ourVenues}
                </Link>
              </li>
              <li>
                <Link
                  href="/inquiry"
                  className="hover:text-white transition-colors"
                >
                  {t.footer.bookNow}
                </Link>
              </li>
              <li>
                <Link
                  href="/#contact"
                  className="hover:text-white transition-colors"
                >
                  {t.footer.contact}
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="hover:text-white transition-colors"
                >
                  {t.footer.adminLogin}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-gold-400 mb-3">
              {t.footer.contactUs}
            </h4>
            <ul className="space-y-2 text-sm text-maroon-200">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {phone}
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {email}
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5" />
                {address}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-maroon-800 text-center text-xs text-maroon-300">
          {footerText || `© ${year} ${businessName}. All rights reserved.`}
        </div>
      </div>
    </footer>
  );
}
