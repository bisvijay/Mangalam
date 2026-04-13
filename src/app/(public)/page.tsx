import { getStore } from "@/lib/data";
import type { WebsiteContent } from "@/types/website";
import { HomeContent } from "@/components/public/home-content";

export default async function HomePage() {
  const store = getStore();
  const content = await store.getConfig<WebsiteContent>("website/content.json");
  const settings = await store.getConfig<Record<string, unknown>>(
    "settings/config.json"
  );

  const heroTitle = content?.hero?.title || "Mangalam Banquet Hall & Hotel";
  const heroSubtitle =
    content?.hero?.subtitle ||
    "Where every celebration becomes a cherished memory. Premium banquet halls and comfortable rooms in the heart of Bettiah.";
  const aboutText =
    content?.about ||
    "Mangalam Banquet Hall & Hotel is Bettiah's premier destination for weddings, receptions, conferences, and celebrations. With elegant indoor halls, a sprawling outdoor lawn, and 18 well-appointed rooms, we bring together comfort and grandeur under one roof. Our dedicated team ensures every event is flawless — from intimate gatherings to grand weddings with over 1,000 guests.";
  const phone =
    content?.contactInfo?.phone || String(settings?.phone ?? "83839 81280");
  const email =
    content?.contactInfo?.email ||
    String(settings?.email ?? "mangalambettiah@gmail.com");
  const address =
    content?.contactInfo?.address ||
    String(settings?.address ?? "Ward No 37, Bettiah, Bihar");

  return (
    <HomeContent
      heroTitle={heroTitle}
      heroSubtitle={heroSubtitle}
      aboutText={aboutText}
      phone={phone}
      email={email}
      address={address}
    />
  );
}