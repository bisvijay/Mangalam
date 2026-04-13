import { getStore } from "@/lib/data";
import type { WebsiteContent } from "@/types/website";
import { PublicHeaderClient } from "./public-header-client";
import { FooterContent } from "./footer-content";

// Server component wrapper — renders the client header (which handles theme + language)
export function PublicHeader() {
  return <PublicHeaderClient />;
}

// Async server component — fetches config data, passes to client footer component
export async function PublicFooter() {
  const store = getStore();
  const content = await store.getConfig<WebsiteContent>("website/content.json");
  const settings = await store.getConfig<Record<string, unknown>>(
    "settings/config.json"
  );

  const phone =
    content?.contactInfo?.phone ||
    String(settings?.phone ?? "83839 81280");
  const email =
    content?.contactInfo?.email ||
    String(settings?.email ?? "mangalambettiah@gmail.com");
  const address =
    content?.contactInfo?.address ||
    String(
      settings?.address ?? "Ward No 37, Bettiah, West Champaran, Bihar"
    );
  const businessName = String(
    settings?.businessName ?? "Mangalam Banquet Hall & Hotel"
  );
  const footerText = content?.footerText || "";
  const year = new Date().getFullYear();

  return (
    <FooterContent
      phone={phone}
      email={email}
      address={address}
      businessName={businessName}
      footerText={footerText}
      year={year}
    />
  );
}
