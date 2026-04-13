export const eventTypes = [
  {
    slug: "wedding",
    name: "Weddings",
    tagline: "Your dream wedding, our grandest celebration",
    description:
      "Create the wedding of your dreams in our beautifully decorated halls or under the stars in our grand lawn. From intimate ceremonies to grand celebrations with 1,000+ guests, Mangalam offers the perfect setting for your special day.",
    longDescription:
      "At Mangalam, we understand that your wedding day is one of the most important days of your life. Our team works closely with you to create a personalized experience — from the baraat welcome to the vidaai. Whether you envision a traditional ceremony in our climate-controlled Grand Hall or a magical open-air celebration on our 50,000 sq ft lawn, we have the space and expertise to make it happen.\n\nOur in-house catering team prepares a feast that caters to all tastes, from traditional Bihar cuisine to multi-cuisine spreads. Professional decorators transform our venues to match your vision, whether it's a classic floral setup or a modern LED-themed stage.",
    features: [
      "Customizable stage & décor",
      "Bridal preparation suite",
      "In-house catering for 50–1000 guests",
      "Professional DJ & LED lighting",
      "Mehendi & sangeet arrangements",
      "Baraat welcome setup",
      "Varmala stage",
      "Photography-friendly venues",
      "Ample parking for 200+ vehicles",
      "Generator backup",
    ],
    halls: ["Mangalam Grand Hall", "Celebration Hall", "Mangalam Lawn"],
    capacity: "Up to 1,000 guests",
    priceRange: "₹75,000 – ₹3,00,000",
  },
  {
    slug: "reception",
    name: "Receptions",
    tagline: "Celebrate your new beginning in style",
    description:
      "Host a grand reception that your guests will remember forever. Our halls offer elegant ambiance with premium sound and lighting for the perfect celebration.",
    longDescription:
      "A reception at Mangalam is more than just a party — it's a grand announcement of your union. Our team creates a stunning stage backdrop, arranges premium sound and lighting, and ensures every guest is treated like royalty.\n\nChoose from our indoor halls for a climate-controlled experience or our sprawling lawn for a starlit celebration. Our catering team offers customizable menus with live counters, dessert stations, and welcome drinks.",
    features: [
      "Elegant stage setup",
      "Premium sound system",
      "LED wall & mood lighting",
      "Welcome drink counter",
      "Photo booth area",
      "Valet parking",
      "Live food counters",
      "Dessert station",
    ],
    halls: ["Mangalam Grand Hall", "Celebration Hall", "Mangalam Lawn"],
    capacity: "Up to 1,000 guests",
    priceRange: "₹50,000 – ₹2,50,000",
  },
  {
    slug: "engagement",
    name: "Engagements",
    tagline: "The perfect start to forever",
    description:
      "Mark the beginning of your journey together with an intimate yet memorable engagement ceremony at Mangalam. Our mid-size halls are ideal for ring ceremonies and family gatherings.",
    longDescription:
      "An engagement is the first step towards a lifetime together, and it deserves a beautiful setting. Our Celebration Hall and Royal Hall are perfectly sized for intimate ring ceremonies and family get-togethers.\n\nWe offer elegant floral decorations, a dedicated ring ceremony stage, and catering that delights every palate. Our team handles everything so you can focus on the moment.",
    features: [
      "Intimate hall setup",
      "Ring ceremony stage",
      "Floral decorations",
      "Catering services",
      "Music arrangement",
      "Photography setup",
      "Welcome drinks",
      "Customizable themes",
    ],
    halls: ["Celebration Hall", "Royal Hall"],
    capacity: "Up to 300 guests",
    priceRange: "₹25,000 – ₹1,00,000",
  },
  {
    slug: "birthday",
    name: "Birthdays",
    tagline: "Make every birthday unforgettable",
    description:
      "From first birthdays to milestone celebrations, our versatile venues adapt to any theme and party size. Let us handle the arrangements while you enjoy the festivities.",
    longDescription:
      "Whether it's a child's first birthday or a golden jubilee celebration, Mangalam offers the perfect venue for birthday parties of all sizes. Our flexible halls can be transformed to match any theme — from cartoon characters to elegant adult gatherings.\n\nWe provide complete party packages including themed decorations, balloon arches, cake arrangements, DJ music, and catering. Our Royal Hall is perfect for intimate gatherings of up to 200 guests.",
    features: [
      "Theme decorations",
      "Cake arrangement area",
      "DJ & music setup",
      "Kids-friendly space",
      "Balloon & banner décor",
      "Catering options",
      "Return gift table",
      "Photography area",
    ],
    halls: ["Celebration Hall", "Royal Hall"],
    capacity: "Up to 300 guests",
    priceRange: "₹15,000 – ₹75,000",
  },
  {
    slug: "anniversary",
    name: "Anniversaries",
    tagline: "Celebrate the years of love",
    description:
      "Whether it's a silver jubilee or a golden anniversary, celebrate your milestones with family and friends in our elegant venues.",
    longDescription:
      "Anniversary celebrations at Mangalam are filled with warmth and elegance. Whether you're celebrating 25 years or 50, our venues provide the perfect backdrop for this special occasion.\n\nOur experienced decorators create beautiful setups that honor your journey together. From photo walls showcasing your memories to elegant table settings, every detail is crafted with care.",
    features: [
      "Elegant décor themes",
      "Stage & photo backdrop",
      "Memory photo wall",
      "Catering for all cuisines",
      "Music & entertainment",
      "Flower arrangements",
      "Photography setup",
      "Cake ceremony area",
    ],
    halls: ["Celebration Hall", "Royal Hall", "Mangalam Grand Hall"],
    capacity: "Up to 500 guests",
    priceRange: "₹25,000 – ₹1,50,000",
  },
  {
    slug: "corporate",
    name: "Corporate Events",
    tagline: "Professional venues for professional gatherings",
    description:
      "Host conferences, seminars, training sessions, and corporate parties in our well-equipped halls. Modern amenities meet professional service for a seamless experience.",
    longDescription:
      "Mangalam's Royal Hall and Celebration Hall are equipped for all types of corporate events — from board meetings to annual conferences. Our venues feature projector screens, high-speed Wi-Fi, podium with microphone, and flexible seating arrangements.\n\nWe offer complete corporate packages including tea/coffee service, lunch catering, notepads and pens, and dedicated event coordination. For larger conferences, our Grand Hall accommodates up to 500 attendees in theatre-style seating.",
    features: [
      "Projector & screen",
      "Wi-Fi connectivity",
      "Podium & microphone",
      "Modular seating arrangements",
      "Breakout discussion areas",
      "Tea/coffee & lunch catering",
      "Whiteboard & markers",
      "Dedicated event coordinator",
    ],
    halls: ["Royal Hall", "Celebration Hall"],
    capacity: "Up to 300 guests",
    priceRange: "₹20,000 – ₹1,00,000",
  },
];

export function getEventBySlug(slug: string) {
  return eventTypes.find((e) => e.slug === slug) ?? null;
}
