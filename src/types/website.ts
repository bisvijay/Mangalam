export interface HeroSection {
  title: string;
  subtitle: string;
  backgroundImage: string;
}

export interface EventTypeContent {
  name: string;
  description: string;
  image: string;
  features: string[];
}

export interface Testimonial {
  name: string;
  eventType: string;
  date: string;
  text: string;
  rating: number;
}

export interface ContactInfo {
  phone: string;
  email: string;
  address: string;
  googleMapsEmbed: string;
}

export interface WebsiteContent {
  hero: HeroSection;
  about: string;
  amenities: string[];
  eventTypes: EventTypeContent[];
  testimonials: Testimonial[];
  contactInfo: ContactInfo;
  footerText?: string;
}
