export interface MarketplaceProductShipping {
  leadTime: string;
  shipsFrom: string;
  delivery: string;
  returns: string;
}

export interface MarketplaceProduct {
  id: string;
  name: string;
  seller: string;
  sellerSlug: string;
  categorySlug: string;
  image: string;
  gallery: string[];
  priceZmw: number;
  sizes: string[];
  description: string;
  shipping: MarketplaceProductShipping;
  care: string;
  rating: number;
  reviewCount: number;
}

export const MARKETPLACE_PRODUCTS: MarketplaceProduct[] = [
  {
    id: "p1",
    name: "Ankara wrap dress",
    seller: "Chipo Designs, Lusaka",
    sellerSlug: "chipo-mwale",
    categorySlug: "ready-to-wear",
    image: "/images/marketplace/p1-main.jpg",
    gallery: ["/images/marketplace/p1-gallery-1.jpg", "/images/marketplace/p1-gallery-2.jpg", "/images/marketplace/p1-gallery-3.jpg"],
    priceZmw: 1566,
    sizes: ["XS", "S", "M", "L", "XL", "Custom"],
    description: "A wrap-style dress cut from vibrant wax print Ankara cloth, finished with a fitted bodice and flared skirt. Made to order in your size.",
    shipping: { leadTime: "Made to order, ships in 3-5 days", shipsFrom: "Lusaka, Zambia", delivery: "Tracked delivery within Africa, 5 to 9 days", returns: "Returns accepted within 7 days if unworn with tags attached" },
    care: "Hand wash cold, hang dry, cool iron on reverse.",
    rating: 4.8,
    reviewCount: 26,
  },
  {
    id: "p2",
    name: "Handwoven kente stole",
    seller: "Mensah Weaves, Kumasi",
    sellerSlug: "kwame-mensah",
    categorySlug: "kente",
    image: "/images/marketplace/p2-main.jpg",
    gallery: ["/images/marketplace/p2-gallery-1.jpg", "/images/marketplace/p2-gallery-2.jpg", "/images/marketplace/p2-gallery-3.jpg"],
    priceZmw: 1998,
    sizes: ["One size"],
    description: "A traditional kente stole handwoven on a narrow-strip loom in a classic geometric pattern, using cotton and rayon thread.",
    shipping: { leadTime: "Made to order, ships in 5-7 days", shipsFrom: "Kumasi, Ghana", delivery: "Tracked delivery within Africa, 5 to 9 days", returns: "Returns accepted within 7 days if unworn with tags attached" },
    care: "Dry clean only. Store folded, away from direct sunlight.",
    rating: 4.9,
    reviewCount: 41,
  },
  {
    id: "p3",
    name: "Tailored linen shirt",
    seller: "Banda & Sons, Lilongwe",
    sellerSlug: "banda-sons",
    categorySlug: "bespoke-tailoring",
    image: "/images/marketplace/p3-main.jpg",
    gallery: ["/images/marketplace/p3-gallery-1.jpg", "/images/marketplace/p3-gallery-2.jpg", "/images/marketplace/p3-gallery-3.jpg"],
    priceZmw: 1134,
    sizes: ["S", "M", "L", "XL"],
    description: "A crisp, breathable linen shirt tailored to a relaxed fit, with mother-of-pearl buttons and a single chest pocket.",
    shipping: { leadTime: "Made to order, ships in 3-5 days", shipsFrom: "Lilongwe, Malawi", delivery: "Tracked delivery within Africa, 5 to 9 days", returns: "Returns accepted within 7 days if unworn with tags attached" },
    care: "Machine wash cold, warm iron while slightly damp.",
    rating: 4.7,
    reviewCount: 18,
  },
  {
    id: "p4",
    name: "Beaded collar necklace",
    seller: "Amara Beads, Nairobi",
    sellerSlug: "amara-beads",
    categorySlug: "accessories",
    image: "/images/marketplace/p4-main.jpg",
    gallery: ["/images/marketplace/p4-gallery-1.jpg", "/images/marketplace/p4-gallery-2.jpg", "/images/marketplace/p4-gallery-3.jpg"],
    priceZmw: 783,
    sizes: ["One size"],
    description: "A statement collar necklace, hand-strung with glass and brass beads in a layered pattern inspired by East African beadwork.",
    shipping: { leadTime: "Ships in 2-3 days", shipsFrom: "Nairobi, Kenya", delivery: "Tracked delivery within Africa, 5 to 9 days", returns: "Returns accepted within 7 days if unworn with tags attached" },
    care: "Wipe clean with a soft dry cloth. Avoid contact with water and perfume.",
    rating: 4.6,
    reviewCount: 12,
  },
  {
    id: "p5",
    name: "Aso oke agbada set",
    seller: "Adeyemi Bespoke, Lagos",
    sellerSlug: "adeyemi-bespoke",
    categorySlug: "bespoke-tailoring",
    image: "/images/marketplace/p5-main.jpg",
    gallery: ["/images/marketplace/p5-gallery-1.jpg", "/images/marketplace/p5-gallery-2.jpg", "/images/marketplace/p5-gallery-3.jpg"],
    priceZmw: 4860,
    sizes: ["M", "L", "XL", "Custom"],
    description: "A three-piece agbada set woven from aso oke cloth, hand-embroidered at the collar and cuffs, made to your measurements.",
    shipping: { leadTime: "Made to order, ships in 10-14 days", shipsFrom: "Lagos, Nigeria", delivery: "Tracked delivery within Africa, 5 to 9 days", returns: "Custom pieces are final sale" },
    care: "Dry clean only.",
    rating: 5.0,
    reviewCount: 9,
  },
  {
    id: "p6",
    name: "Chitenge tote bag",
    seller: "Chipo Designs, Lusaka",
    sellerSlug: "chipo-mwale",
    categorySlug: "accessories",
    image: "/images/marketplace/p6-main.jpg",
    gallery: ["/images/marketplace/p6-gallery-1.jpg", "/images/marketplace/p6-gallery-2.jpg", "/images/marketplace/p6-gallery-3.jpg"],
    priceZmw: 648,
    sizes: ["One size"],
    description: "A roomy tote bag sewn from off-cut chitenge fabric with a reinforced canvas lining and leather handles.",
    shipping: { leadTime: "Ships in 2-3 days", shipsFrom: "Lusaka, Zambia", delivery: "Tracked delivery within Africa, 5 to 9 days", returns: "Returns accepted within 7 days if unused with tags attached" },
    care: "Spot clean with a damp cloth.",
    rating: 4.7,
    reviewCount: 22,
  },
  {
    id: "p7",
    name: "Mudcloth bomber jacket",
    seller: "Keita Atelier, Bamako",
    sellerSlug: "keita-atelier",
    categorySlug: "ready-to-wear",
    image: "/images/marketplace/p7-main.jpg",
    gallery: ["/images/marketplace/p7-gallery-1.jpg", "/images/marketplace/p7-gallery-2.jpg", "/images/marketplace/p7-gallery-3.jpg"],
    priceZmw: 2592,
    sizes: ["S", "M", "L", "XL"],
    description: "A bomber jacket cut from hand-dyed bogolan mudcloth, lined with cotton twill and finished with ribbed cuffs and hem.",
    shipping: { leadTime: "Made to order, ships in 5-7 days", shipsFrom: "Bamako, Mali", delivery: "Tracked delivery within Africa, 5 to 9 days", returns: "Returns accepted within 7 days if unworn with tags attached" },
    care: "Dry clean only. Store away from direct sunlight to preserve dye.",
    rating: 4.8,
    reviewCount: 15,
  },
  {
    id: "p8",
    name: "Bridal lace gown, made to measure",
    seller: "Amina Diallo, Dakar",
    sellerSlug: "amina-diallo",
    categorySlug: "bridal",
    image: "/images/marketplace/p8-main.jpg",
    gallery: ["/images/marketplace/p8-gallery-1.jpg", "/images/marketplace/p8-gallery-2.jpg", "/images/marketplace/p8-gallery-3.jpg"],
    priceZmw: 8370,
    sizes: ["Custom"],
    description: "A made-to-measure bridal gown in French lace over a silk-blend lining, with a fitted bodice and cathedral-length train.",
    shipping: { leadTime: "Made to order, ships in 21-28 days", shipsFrom: "Dakar, Senegal", delivery: "Tracked delivery within Africa, 7 to 12 days", returns: "Custom pieces are final sale" },
    care: "Dry clean only. Professional preservation recommended after wear.",
    rating: 5.0,
    reviewCount: 7,
  },
];
