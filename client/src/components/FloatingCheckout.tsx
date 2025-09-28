import React from "react";

type Money = { amount: number; currency: string };

export default function FloatingCheckout({
  outbound,
  inbound,
  passengers = 1,
  onContinue,
}: {
  outbound?: { price?: Money };
  inbound?: { price?: Money };
  passengers?: number;
  onContinue: () => void;
}) {
  const ob = Number(outbound?.price?.amount || 0);
  const ib = Number(inbound?.price?.amount || 0);
  const total = ob + ib;
  const ccy = (inbound?.price?.currency || outbound?.price?.currency || "AUD").toUpperCase();
  const ready = ob > 0 && ib > 0;

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }} // iOS safe area
    >
      <div className="mx-auto max-w-7xl px-3 pb-3">
        <div className="rounded-2xl border border-gray-200 bg-white/95 backdrop-blur shadow-xl">
          <div className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <div className="text-xs text-gray-500">
                Total (for {passengers} {passengers > 1 ? "passengers" : "passenger"})
              </div>
              <div className="text-lg font-semibold truncate">
                {ccy} ${total.toFixed(0)}
              </div>
            </div>
            <button
              disabled={!ready}
              onClick={onContinue}
              className={
                "px-5 py-3 rounded-xl text-white font-medium whitespace-nowrap " +
                (ready ? "bg-green-600 hover:bg-green-700" : "bg-gray-300 cursor-not-allowed")
              }
            >
              {ready ? "Continue to Payment" : "Select return flight"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}