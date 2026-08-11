import { Star } from "lucide-react";
import { MARKETPLACE_REVIEWS } from "@/data/marketplace-reviews";

export function ReviewsSection() {
  return (
    <section className="py-12 border-t border-gray-100">
      <h2 className="text-xl font-bold mb-6">What buyers say</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {MARKETPLACE_REVIEWS.slice(0, 3).map((review) => (
          <div key={review.reviewer} className="bg-gray-50 rounded-xl p-5 flex flex-col gap-2">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  fill={i < review.rating ? "#5fa8a0" : "none"}
                  stroke="#5fa8a0"
                  strokeWidth={1.5}
                />
              ))}
            </div>
            <p className="text-sm leading-relaxed">&ldquo;{review.quote}&rdquo;</p>
            <div className="text-xs text-gray-500">{review.reviewer} &middot; {review.date}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
