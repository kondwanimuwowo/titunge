export interface MarketplaceReview {
  reviewer: string;
  rating: number;
  date: string;
  quote: string;
}

export const MARKETPLACE_REVIEWS: MarketplaceReview[] = [
  {
    reviewer: "Natasha K.",
    rating: 5,
    date: "3 weeks ago",
    quote: "The fit was perfect and it arrived faster than I expected. Exactly as pictured.",
  },
  {
    reviewer: "Joseph M.",
    rating: 5,
    date: "1 month ago",
    quote: "Beautiful craftsmanship, you can tell it was made with care. Will order again.",
  },
  {
    reviewer: "Farai C.",
    rating: 4,
    date: "2 months ago",
    quote: "Lovely quality. Sizing ran slightly small so I'd size up next time.",
  },
  {
    reviewer: "Lindiwe P.",
    rating: 5,
    date: "2 months ago",
    quote: "Communication was great throughout and the finished piece exceeded what I saw in photos.",
  },
];
