import React from "react";
import type { SelectedSeat } from "@/types/flights";
import { ShoppingCart } from "lucide-react";

type Money = { amount: number; currency: string };

function fmt(m?: Money) {
  if (!m) return "-";
  const symbol = m.currency?.toUpperCase() || "AUD";
  // assume amount is numeric; you can swap to Intl.NumberFormat later
  return `${symbol} $${m.amount.toFixed(0)}`;
}

export default function TripSummary({
  outbound,
  inbound,
  passengers = 1,
  selectedSeats,
  selectedBaggage,
  onAddToCart,
  isCartMode = true,
}: {
  outbound?: { price?: Money; carrier?: string; dep?: string; arr?: string };
  inbound?: { price?: Money; carrier?: string; dep?: string; arr?: string };
  passengers?: number;
  selectedSeats?: { outbound: SelectedSeat[]; return: SelectedSeat[] };
  selectedBaggage?: any[];
  onAddToCart?: () => void;
  isCartMode?: boolean;
}) {
  const seatTotalOutbound = selectedSeats?.outbound.reduce((sum, seat) => sum + seat.price, 0) || 0;
  const seatTotalReturn = selectedSeats?.return.reduce((sum, seat) => sum + seat.price, 0) || 0;
  const baggageTotal = selectedBaggage?.reduce((sum, bag) => sum + (bag.price || 0), 0) || 0;
  
  const total =
    (outbound?.price?.amount || 0) +
    (inbound?.price?.amount || 0) +
    seatTotalOutbound +
    seatTotalReturn +
    baggageTotal;

  const currency =
    inbound?.price?.currency ||
    outbound?.price?.currency ||
    "AUD";

  const bothSelected = Boolean(outbound && inbound);

  return (
    <aside className="sticky top-24 hidden md:block w-[320px]">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold mb-3">Trip Summary</h3>

        <div className="space-y-3">
          <div>
            <div className="text-xs uppercase text-gray-500">Outbound</div>
            <div className="flex items-center justify-between">
              <div className="text-sm">{outbound?.carrier ?? "Not selected"}</div>
              <div className="text-sm font-medium">{fmt(outbound?.price)}</div>
            </div>
          </div>

          <div className="border-t pt-3">
            <div className="text-xs uppercase text-gray-500">Return</div>
            <div className="flex items-center justify-between">
              <div className="text-sm">{inbound?.carrier ?? "Not selected"}</div>
              <div className="text-sm font-medium">{fmt(inbound?.price)}</div>
            </div>
          </div>

          {/* Seat Information */}
          {(selectedSeats?.outbound.length || selectedSeats?.return.length) && (
            <div className="border-t pt-3">
              <div className="text-xs uppercase text-gray-500 mb-2">Selected Seats</div>
              {selectedSeats?.outbound.length > 0 && (
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm">
                    Outbound: {selectedSeats.outbound.map(seat => seat.designator).join(', ')}
                  </div>
                  <div className="text-sm font-medium">
                    {selectedSeats.outbound[0]?.currency} ${seatTotalOutbound.toFixed(0)}
                  </div>
                </div>
              )}
              {selectedSeats?.return.length > 0 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    Return: {selectedSeats.return.map(seat => seat.designator).join(', ')}
                  </div>
                  <div className="text-sm font-medium">
                    {selectedSeats.return[0]?.currency} ${seatTotalReturn.toFixed(0)}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Baggage Information */}
          {selectedBaggage && selectedBaggage.length > 0 && (
            <div className="border-t pt-3">
              <div className="text-xs uppercase text-gray-500 mb-2">Selected Baggage</div>
              {selectedBaggage.map((bag, index) => (
                <div key={index} className="flex items-center justify-between mb-1">
                  <div className="text-sm">{bag.type}: {bag.weight}</div>
                  <div className="text-sm font-medium">{currency} ${bag.price?.toFixed(0)}</div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t pt-3">
            <div className="flex items-center justify-between">
              <div className="text-base font-semibold">Total</div>
              <div className="text-base font-semibold">
                {currency.toUpperCase()} ${total.toFixed(0)}
              </div>
            </div>
            <div className="text-xs text-gray-500">
              For {passengers} {passengers > 1 ? "passengers" : "passenger"}
            </div>
          </div>

          {isCartMode ? (
            <button
              disabled={!bothSelected}
              onClick={onAddToCart}
              className={
                "w-full mt-2 rounded-xl py-3 text-white font-medium flex items-center justify-center gap-2 " +
                (bothSelected
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gray-300 cursor-not-allowed")
              }
              data-testid="button-add-to-cart"
            >
              <ShoppingCart className="w-4 h-4" />
              {bothSelected ? "Add to Cart" : "Select both flights to continue"}
            </button>
          ) : (
            <button
              disabled={!bothSelected}
              onClick={onAddToCart}
              className={
                "w-full mt-2 rounded-xl py-3 text-white font-medium " +
                (bothSelected
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-gray-300 cursor-not-allowed")
              }
            >
              {bothSelected ? "Continue to Payment" : "Select both flights to continue"}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}