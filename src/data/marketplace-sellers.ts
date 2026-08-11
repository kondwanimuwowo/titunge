export interface MarketplaceSellerPolicies {
  delivery: string;
  returns: string;
  customOrders: string;
}

export interface MarketplaceSeller {
  slug: string;
  name: string;
  location: string;
  avatar: string;
  banner: string;
  bio: string;
  itemCount: number;
  founded: number;
  rating: number;
  salesCount: number;
  categories: string[];
  policies: MarketplaceSellerPolicies;
}

export const MARKETPLACE_SELLERS: MarketplaceSeller[] = [
  {
    slug: "chipo-mwale",
    name: "Chipo Mwale",
    location: "Lusaka, Zambia",
    avatar: "/images/marketplace/chipo-mwale-avatar.jpg",
    banner: "/images/marketplace/chipo-mwale-banner.jpg",
    bio: "Chitenge dresses and wax print separates, made to order.",
    itemCount: 48,
    founded: 2019,
    rating: 4.9,
    salesCount: 312,
    categories: ["ready-to-wear", "accessories"],
    policies: {
      delivery: "Most pieces are made to order and ship within 3-5 days. Delivery across Africa takes 5 to 9 days.",
      returns: "Returns accepted within 7 days if the item is unworn with tags attached.",
      customOrders: "Custom sizing and colour requests are welcome — message the shop before ordering.",
    },
  },
  {
    slug: "kwame-mensah",
    name: "Kwame Mensah",
    location: "Kumasi, Ghana",
    avatar: "/images/marketplace/kwame-mensah-avatar.jpg",
    banner: "/images/marketplace/kwame-mensah-banner.jpg",
    bio: "Handwoven kente stoles and cloth in traditional patterns.",
    itemCount: 32,
    founded: 2016,
    rating: 4.9,
    salesCount: 268,
    categories: ["kente"],
    policies: {
      delivery: "Each piece is handwoven to order and ships within 5-7 days. Delivery across Africa takes 5 to 9 days.",
      returns: "Returns accepted within 7 days if the item is unworn with tags attached.",
      customOrders: "Custom lengths and colourways available on request.",
    },
  },
  {
    slug: "amina-diallo",
    name: "Amina Diallo",
    location: "Dakar, Senegal",
    avatar: "/images/marketplace/amina-diallo-avatar.jpg",
    banner: "/images/marketplace/amina-diallo-banner.jpg",
    bio: "Bespoke boubous and occasion wear for men and women.",
    itemCount: 61,
    founded: 2014,
    rating: 5.0,
    salesCount: 189,
    categories: ["bridal"],
    policies: {
      delivery: "Bridal and occasion pieces are made to measure and ship within 3-4 weeks.",
      returns: "Custom and made-to-measure pieces are final sale.",
      customOrders: "A measurement guide is sent after ordering; fittings can be arranged for local clients.",
    },
  },
  {
    slug: "banda-sons",
    name: "Banda & Sons",
    location: "Lilongwe, Malawi",
    avatar: "/images/marketplace/banda-sons-avatar.jpg",
    banner: "/images/marketplace/banda-sons-banner.jpg",
    bio: "Family-run tailoring house making linen and cotton shirts since 1998.",
    itemCount: 27,
    founded: 1998,
    rating: 4.7,
    salesCount: 154,
    categories: ["bespoke-tailoring"],
    policies: {
      delivery: "Shirts are cut to order and ship within 3-5 days. Delivery across Africa takes 5 to 9 days.",
      returns: "Returns accepted within 7 days if the item is unworn with tags attached.",
      customOrders: "Send your measurements at checkout for a made-to-fit cut.",
    },
  },
  {
    slug: "amara-beads",
    name: "Amara Beads",
    location: "Nairobi, Kenya",
    avatar: "/images/marketplace/amara-beads-avatar.jpg",
    banner: "/images/marketplace/amara-beads-banner.jpg",
    bio: "Hand-strung beadwork and jewellery inspired by East African craft.",
    itemCount: 76,
    founded: 2020,
    rating: 4.6,
    salesCount: 421,
    categories: ["accessories"],
    policies: {
      delivery: "Most pieces ship within 2-3 days. Delivery across Africa takes 5 to 9 days.",
      returns: "Returns accepted within 7 days if the item is unworn with tags attached.",
      customOrders: "Colour and length can be customised — message the shop before ordering.",
    },
  },
  {
    slug: "adeyemi-bespoke",
    name: "Adeyemi Bespoke",
    location: "Lagos, Nigeria",
    avatar: "/images/marketplace/adeyemi-bespoke-avatar.jpg",
    banner: "/images/marketplace/adeyemi-bespoke-banner.jpg",
    bio: "Aso oke and agbada sets tailored for weddings and ceremonies.",
    itemCount: 19,
    founded: 2012,
    rating: 5.0,
    salesCount: 97,
    categories: ["bespoke-tailoring"],
    policies: {
      delivery: "Made to order and ships within 10-14 days given the hand embroidery involved.",
      returns: "Custom pieces are final sale.",
      customOrders: "A measurement form is sent after ordering; fabric colourways can be customised.",
    },
  },
  {
    slug: "keita-atelier",
    name: "Keita Atelier",
    location: "Bamako, Mali",
    avatar: "/images/marketplace/keita-atelier-avatar.jpg",
    banner: "/images/marketplace/keita-atelier-banner.jpg",
    bio: "Hand-dyed bogolan mudcloth outerwear and separates.",
    itemCount: 34,
    founded: 2017,
    rating: 4.8,
    salesCount: 141,
    categories: ["ready-to-wear"],
    policies: {
      delivery: "Made to order and ships within 5-7 days. Delivery across Africa takes 5 to 9 days.",
      returns: "Returns accepted within 7 days if the item is unworn with tags attached.",
      customOrders: "Custom dye patterns can be requested — message the shop before ordering.",
    },
  },
];
