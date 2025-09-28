import React, { useEffect, useRef } from "react";

type Props = {
  isOpen: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
};

export default function Modal({ isOpen, title, onClose, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-label="Backdrop"
      />
      <div
        ref={ref}
        className="relative z-10 w-full max-w-3xl rounded-2xl bg-white shadow-xl border p-0 overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-gray-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}