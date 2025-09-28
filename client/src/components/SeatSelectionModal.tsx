import React, { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import { fetchSeatMaps } from "@/utils/duffel";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  offerId: string;
  origin: string;
  destination: string;
  passengerIds: string[]; // map seats to these if available
  onContinueWithoutSeats: () => void; // proceed flow even if no seat map
  onSeatChosen?: (serviceId: string, passengerId: string) => void;
};

export default function SeatSelectionModal({
  isOpen, onClose, offerId, origin, destination, passengerIds,
  onContinueWithoutSeats, onSeatChosen
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seatMaps, setSeatMaps] = useState<any>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    setSeatMaps(null);
    fetchSeatMaps(offerId)
      .then((data) => {
        setSeatMaps(data);
      })
      .catch((e) => {
        setError(e.message || "Seat map fetch failed");
      })
      .finally(() => setLoading(false));
  }, [isOpen, offerId]);

  const noSeatMap =
    !loading &&
    !error &&
    (!seatMaps || !Array.isArray(seatMaps?.data) || seatMaps.data.length === 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Select Seats for ${origin} → ${destination}`}
    >
      {loading && <div className="text-sm text-gray-600">Loading seat map…</div>}

      {error && (
        <div className="space-y-4">
          <div className="rounded-md bg-red-50 border border-red-200 p-3 text-red-700 text-sm">
            Couldn't load seat map ({error}).
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-lg bg-gray-200" onClick={onClose}>Close</button>
            <button
              className="px-4 py-2 rounded-lg bg-green-600 text-white"
              onClick={onContinueWithoutSeats}
            >
              Continue without seats
            </button>
          </div>
        </div>
      )}

      {noSeatMap && (
        <div className="space-y-4">
          <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 text-yellow-800 text-sm">
            Seat selection isn't available for this flight. You can continue and choose seats
            later with the airline, or pick another flight.
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-lg bg-gray-200" onClick={onClose}>Choose another flight</button>
            <button
              className="px-4 py-2 rounded-lg bg-green-600 text-white"
              onClick={onContinueWithoutSeats}
            >
              Continue without seats
            </button>
          </div>
          <details className="text-xs text-gray-500">
            <summary>Debug</summary>
            <pre className="whitespace-pre-wrap break-words">{JSON.stringify(seatMaps, null, 2)}</pre>
          </details>
        </div>
      )}

      {!loading && !error && seatMaps?.data?.length > 0 && (
        <div>
          {/* TODO: render your real seat map UI here.
              For now, show a minimal placeholder so flow works. */}
          <div className="text-sm text-gray-600 mb-3">
            Seat map loaded for {seatMaps.data.length} segment(s). Rendering soon…
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-lg bg-gray-200" onClick={onClose}>Close</button>
            <button
              className="px-4 py-2 rounded-lg bg-green-600 text-white"
              onClick={onContinueWithoutSeats}
            >
              Skip seats & continue
            </button>
          </div>
          <details className="text-xs text-gray-500 mt-3">
            <summary>Debug</summary>
            <pre className="whitespace-pre-wrap break-words">{JSON.stringify(seatMaps, null, 2)}</pre>
          </details>
        </div>
      )}
    </Modal>
  );
}