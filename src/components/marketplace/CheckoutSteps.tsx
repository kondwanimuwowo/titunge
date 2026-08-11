const STEPS = ["Delivery", "Payment"] as const;

export function CheckoutSteps({ active }: { active: 1 | 2 }) {
  return (
    <div className="flex gap-3 mb-8">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const isActive = step === active;
        return (
          <span
            key={label}
            className="text-sm font-semibold rounded-full px-4 py-2"
            style={{
              backgroundColor: isActive ? "#0e1a18" : "#f5f5f5",
              color: isActive ? "#ffffff" : "#6b7573",
            }}
          >
            {step}. {label}
          </span>
        );
      })}
    </div>
  );
}
