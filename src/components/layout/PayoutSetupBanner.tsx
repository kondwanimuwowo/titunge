import Link from "next/link";
import { Wallet } from "lucide-react";

/** Shown to admins and managers while the business has products live on the
 *  marketplace but no payout account, so paid orders can't be paid out yet. */
export default function PayoutSetupBanner({ listedCount }: { listedCount: number }) {
  return (
    <div className="mx-6 md:mx-8 mt-6 flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
      <Wallet size={18} className="shrink-0" />
      <p className="flex-1">
        {listedCount} of your product{listedCount === 1 ? " is" : "s are"} live on the Titunge marketplace, but you haven&apos;t
        added a payout account. Add one so you get paid for marketplace sales.
      </p>
      <Link
        href="/settings?tab=marketplace"
        className="shrink-0 rounded-md bg-amber-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800 dark:bg-amber-200 dark:text-amber-950"
      >
        Add payout account
      </Link>
    </div>
  );
}
