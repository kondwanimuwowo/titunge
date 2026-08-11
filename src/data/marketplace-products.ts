export interface MarketplaceProduct {
  id: string;
  name: string;
  seller: string;
  priceZmw: number;
}

export const MARKETPLACE_PRODUCTS: MarketplaceProduct[] = [
  { id: "p1", name: "Ankara wrap dress", seller: "Chipo Designs, Lusaka", priceZmw: 1566 },
  { id: "p2", name: "Handwoven kente stole", seller: "Mensah Weaves, Kumasi", priceZmw: 1998 },
  { id: "p3", name: "Tailored linen shirt", seller: "Banda & Sons, Lilongwe", priceZmw: 1134 },
  { id: "p4", name: "Beaded collar necklace", seller: "Amara Beads, Nairobi", priceZmw: 783 },
  { id: "p5", name: "Aso oke agbada set", seller: "Adeyemi Bespoke, Lagos", priceZmw: 4860 },
  { id: "p6", name: "Chitenge tote bag", seller: "Zuwa Studio, Lusaka", priceZmw: 648 },
  { id: "p7", name: "Mudcloth bomber jacket", seller: "Keita Atelier, Bamako", priceZmw: 2592 },
  { id: "p8", name: "Bridal lace gown, made to measure", seller: "House of Nia, Accra", priceZmw: 8370 },
];
