export type Locale = "en" | "hi";

export const localeLabels: Record<Locale, string> = {
  en: "EN",
  hi: "हि",
};

const en = {
  nav: {
    events: "Events",
    gallery: "Gallery",
    availability: "Availability",
    getQuote: "Get Quote",
    bookNow: "Book Now",
    adminLogin: "Admin Login",
  },
  hero: {
    badge: "Premium Venue in Bettiah",
    bookEvent: "Book Your Event",
    exploreVenues: "Explore Venues",
  },
  stats: {
    banquetHalls: "Banquet Halls",
    hotelRooms: "Hotel Rooms",
    guestCapacity: "Guest Capacity",
    sqFtLawn: "Sq Ft Lawn",
  },
  about: {
    heading: "About Mangalam",
  },
  venues: {
    heading: "Our Venues",
    subheading: "Choose from our versatile indoor halls or the grand outdoor lawn.",
    indoor: "Indoor",
    outdoor: "Outdoor",
    upTo: "Up to",
    guests: "guests",
  },
  eventsSection: {
    heading: "Events We Host",
    subheading: "From grand weddings to corporate seminars — we make every occasion special.",
    items: [
      {
        name: "Weddings & Receptions",
        desc: "Create the wedding of your dreams in our beautifully decorated halls or under the stars in our grand lawn.",
        features: ["Customizable décor", "Bridal suite", "Catering services", "DJ & lighting"],
      },
      {
        name: "Corporate Events",
        desc: "Host professional conferences, seminars, and corporate gatherings in our well-equipped halls.",
        features: ["Projector & screen", "Wi-Fi", "Podium & mic", "Breakout rooms"],
      },
      {
        name: "Birthdays & Anniversaries",
        desc: "Celebrate milestones with your loved ones in our intimate yet spacious venues.",
        features: ["Theme décor", "Cake arrangements", "Music & DJ", "Photography setup"],
      },
      {
        name: "Social Gatherings",
        desc: "From religious ceremonies to community events, our versatile halls adapt to every occasion.",
        features: ["Flexible seating", "Catering options", "PA system", "Parking"],
      },
    ],
  },
  testimonials: {
    heading: "What Our Clients Say",
    items: [
      {
        name: "Rajesh Kumar",
        event: "Wedding Reception",
        text: "Mangalam made our daughter's wedding reception absolutely perfect. The Grand Hall was beautifully decorated and the staff was incredibly attentive.",
        rating: 5,
      },
      {
        name: "Priya Sharma",
        event: "Corporate Seminar",
        text: "Excellent venue for our annual company seminar. The Royal Hall had all the amenities we needed. Very professional service.",
        rating: 4,
      },
      {
        name: "Amit Verma",
        event: "Birthday Party",
        text: "Hosted my son's first birthday here. The Celebration Hall was perfect for our 200 guests. Great food and friendly staff!",
        rating: 5,
      },
    ],
  },
  contact: {
    heading: "Get In Touch",
    sendInquiry: "Send an Inquiry",
  },
  footer: {
    tagline:
      "Where every celebration becomes a cherished memory. Premium banquet halls and comfortable rooms in the heart of Bettiah.",
    quickLinks: "Quick Links",
    aboutUs: "About Us",
    ourVenues: "Our Venues",
    bookNow: "Book Now",
    contact: "Contact",
    adminLogin: "Admin Login",
    contactUs: "Contact Us",
  },
};

const hi: typeof en = {
  nav: {
    events: "इवेंट्स",
    gallery: "गैलरी",
    availability: "उपलब्धता",
    getQuote: "कोटेशन",
    bookNow: "अभी बुक करें",
    adminLogin: "एडमिन लॉगिन",
  },
  hero: {
    badge: "बेतिया का प्रीमियम वेन्यू",
    bookEvent: "इवेंट बुक करें",
    exploreVenues: "वेन्यू देखें",
  },
  stats: {
    banquetHalls: "बैंक्वेट हॉल",
    hotelRooms: "होटल रूम",
    guestCapacity: "मेहमान क्षमता",
    sqFtLawn: "वर्ग फुट लॉन",
  },
  about: {
    heading: "मंगलम के बारे में",
  },
  venues: {
    heading: "हमारे वेन्यू",
    subheading: "हमारे बहुमुखी इनडोर हॉल या भव्य आउटडोर लॉन में से चुनें।",
    indoor: "इनडोर",
    outdoor: "आउटडोर",
    upTo: "तक",
    guests: "मेहमान",
  },
  eventsSection: {
    heading: "हमारे इवेंट्स",
    subheading:
      "भव्य विवाह से लेकर कॉर्पोरेट सेमिनार तक — हम हर अवसर को खास बनाते हैं।",
    items: [
      {
        name: "विवाह और रिसेप्शन",
        desc: "हमारे खूबसूरती से सजाए गए हॉल या भव्य लॉन में अपने सपनों की शादी बनाएं।",
        features: ["कस्टम सजावट", "ब्राइडल सूट", "केटरिंग सेवाएं", "DJ और लाइटिंग"],
      },
      {
        name: "कॉर्पोरेट इवेंट्स",
        desc: "हमारे अच्छी तरह से सुसज्जित हॉल में पेशेवर सम्मेलन, सेमिनार और कॉर्पोरेट आयोजन करें।",
        features: ["प्रोजेक्टर और स्क्रीन", "Wi-Fi", "पोडियम और माइक", "ब्रेकआउट रूम"],
      },
      {
        name: "जन्मदिन और वर्षगांठ",
        desc: "हमारे विशाल वेन्यू में अपने प्रियजनों के साथ महत्वपूर्ण अवसर मनाएं।",
        features: ["थीम सजावट", "केक व्यवस्था", "संगीत और DJ", "फोटोग्राफी सेटअप"],
      },
      {
        name: "सामाजिक समारोह",
        desc: "धार्मिक समारोहों से लेकर सामुदायिक कार्यक्रमों तक, हमारे बहुमुखी हॉल हर अवसर के लिए उपयुक्त हैं।",
        features: ["लचीली बैठक", "केटरिंग विकल्प", "PA सिस्टम", "पार्किंग"],
      },
    ],
  },
  testimonials: {
    heading: "हमारे ग्राहक क्या कहते हैं",
    items: [
      {
        name: "राजेश कुमार",
        event: "विवाह रिसेप्शन",
        text: "मंगलम ने हमारी बेटी की शादी को बिल्कुल परफेक्ट बनाया। ग्रैंड हॉल खूबसूरती से सजाया गया था और स्टाफ बेहद ध्यान देने वाला था।",
        rating: 5,
      },
      {
        name: "प्रिया शर्मा",
        event: "कॉर्पोरेट सेमिनार",
        text: "हमारे वार्षिक कंपनी सेमिनार के लिए बेहतरीन वेन्यू। रॉयल हॉल में वे सभी सुविधाएं थीं जिनकी हमें जरूरत थी। बहुत पेशेवर सेवा।",
        rating: 4,
      },
      {
        name: "अमित वर्मा",
        event: "जन्मदिन पार्टी",
        text: "अपने बेटे का पहला जन्मदिन यहां मनाया। 200 मेहमानों के लिए सेलिब्रेशन हॉल बिल्कुल सही था। बढ़िया खाना और दोस्ताना स्टाफ!",
        rating: 5,
      },
    ],
  },
  contact: {
    heading: "संपर्क करें",
    sendInquiry: "पूछताछ भेजें",
  },
  footer: {
    tagline:
      "जहां हर उत्सव एक यादगार पल बन जाता है। बेतिया के दिल में प्रीमियम बैंक्वेट हॉल और आरामदायक कमरे।",
    quickLinks: "त्वरित लिंक",
    aboutUs: "हमारे बारे में",
    ourVenues: "हमारे वेन्यू",
    bookNow: "अभी बुक करें",
    contact: "संपर्क",
    adminLogin: "एडमिन लॉगिन",
    contactUs: "हमसे संपर्क करें",
  },
};

export const translations = { en, hi };
export type Translations = typeof en;
export default translations;
