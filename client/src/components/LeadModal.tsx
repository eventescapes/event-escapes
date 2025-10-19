import { useEffect, useState } from "react";

type LeadModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (lead: { name: string; email: string }) => Promise<void> | void;
  eventTitle?: string;
};

export default function LeadModal({ open, onClose, onSubmit, eventTitle }: LeadModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email)) return;
    try {
      setSubmitting(true);
      await onSubmit({ name: name.trim(), email: email.trim() });
      setName("");
      setEmail("");
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md rounded-2xl bg-slate-900 text-white shadow-xl ring-1 ring-white/10"
          data-testid="lead-modal"
        >
          <div className="px-6 pt-5 pb-2">
            <h2 className="text-lg font-semibold">Quick details before you book</h2>
            {eventTitle && <p className="mt-1 text-sm text-white/70">Event: {eventTitle}</p>}
          </div>

          <div className="px-6 space-y-3">
            <div>
              <label className="block text-xs text-white/70 mb-1">Full name</label>
              <input
                className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-fuchsia-400/60"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                required
                data-testid="input-lead-name"
              />
            </div>
            <div>
              <label className="block text-xs text-white/70 mb-1">Email</label>
              <input
                type="email"
                className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-fuchsia-400/60"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                required
                data-testid="input-lead-email"
              />
            </div>
          </div>

          <div className="px-6 py-5">
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-fuchsia-600 py-2.5 text-sm font-semibold text-white hover:bg-fuchsia-500 disabled:opacity-60"
              data-testid="button-lead-submit"
            >
              {submitting ? "Processing…" : "Continue to Book Tickets & Earn $20"}
            </button>
            <p className="mt-2 text-center text-[11px] text-white/60">
              We'll use your details to send your booking confirmation and perks.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
