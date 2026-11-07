import {
  PREVIEW_BUSINESS,
  PREVIEW_MONTHS,
  PREVIEW_NAV,
  PREVIEW_ORDERS,
  PREVIEW_STATS,
} from "@/data/business-preview";

const STATUS_TONE: Record<string, string> = {
  Delivered: "bg-emerald-50 text-emerald-700",
  Ready: "bg-teal-50 text-teal-700",
  Measurements: "bg-violet-50 text-violet-700",
};

/** A static picture of a Titunge workspace for the business landing page. */
export function ProductPreview() {
  const max = Math.max(...PREVIEW_MONTHS.map((m) => m.revenue));

  return (
    <figure className="relative">
      <div className="rounded-2xl border border-white/10 bg-[#13221f] p-2 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-1.5 px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="ml-3 text-[11px] text-white/40">kayz-suits.titunge.com/dashboard</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[170px_1fr] overflow-hidden rounded-xl bg-[#f6f3f0]">
          <aside className="hidden md:flex flex-col gap-1 bg-[#0e1a18] p-4">
            <p className="text-xs font-semibold text-[#7cc0b8] mb-3">{PREVIEW_BUSINESS}</p>
            {PREVIEW_NAV.map((item, i) => (
              <span
                key={item}
                className={`rounded-md px-2.5 py-1.5 text-xs ${i === 0 ? "bg-white/10 text-white" : "text-white/55"}`}
              >
                {item}
              </span>
            ))}
          </aside>

          <div className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {PREVIEW_STATS.map((stat) => (
                <div key={stat.label} className="rounded-lg bg-white p-3 shadow-sm">
                  <p className="text-[11px] text-gray-500">{stat.label}</p>
                  <p className={`mt-1 text-base sm:text-lg font-bold ${stat.alert ? "text-red-600" : "text-gray-900"}`}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-3">
              <div className="rounded-lg bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold text-gray-900">Revenue by month</p>
                <div className="mt-4 flex h-28 items-end gap-2.5">
                  {PREVIEW_MONTHS.map((m) => (
                    <div key={m.month} className="flex h-full flex-1 flex-col items-center gap-1.5">
                      <div className="flex w-full flex-1 items-end">
                        <div
                          className="w-full rounded-t bg-[#5fa8a0]"
                          style={{ height: `${Math.round((m.revenue / max) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400">{m.month}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold text-gray-900">Recent orders</p>
                <ul className="mt-3 space-y-2.5">
                  {PREVIEW_ORDERS.map((o) => (
                    <li key={o.number} className="flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900">{o.number}</p>
                        <p className="truncate text-gray-500">{o.customer}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="font-semibold text-gray-900">{o.amount}</span>
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${STATUS_TONE[o.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {o.status}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-xs text-gray-500">
        Demo workspace for a Lusaka menswear shop
      </figcaption>
    </figure>
  );
}
