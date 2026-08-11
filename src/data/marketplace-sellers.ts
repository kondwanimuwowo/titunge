export interface MarketplaceSeller {
  slug: string;
  name: string;
  location: string;
  bio: string;
  itemCount: number;
}

export const MARKETPLACE_SELLERS: MarketplaceSeller[] = [
  {
    slug: "chipo-mwale",
    name: "Chipo Mwale",
    location: "Lusaka, Zambia",
    bio: "Chitenge dresses and wax print separates, made to order.",
    itemCount: 48,
  },
  {
    slug: "kwame-mensah",
    name: "Kwame Mensah",
    location: "Kumasi, Ghana",
    bio: "Handwoven kente stoles and cloth in traditional patterns.",
    itemCount: 32,
  },
  {
    slug: "amina-diallo",
    name: "Amina Diallo",
    location: "Dakar, Senegal",
    bio: "Bespoke boubous and occasion wear for men and women.",
    itemCount: 61,
  },
];
