// Duffel expects these fields per passenger:
// id, type ("adult" | "child" | "infant"), title ("mr"|"ms"|"mrs"|"miss"|"dr"),
// gender ("m"|"f"|"x"), given_name, family_name, born_on (YYYY-MM-DD), email, phone_number

export type RawPassenger = {
  id?: string;
  type?: "adult" | "child" | "infant";
  title: string;           // e.g., "Mr"
  gender: string;          // e.g., "Male"
  firstName: string;
  lastName: string;
  dateOfBirth: string;     // UI: "DD/MM/YYYY" (or "YYYY-MM-DD")
  email: string;
  phoneNumber: string;     // "+614..."
  // Optional extras we just pass through if present:
  passportNumber?: string;
  passportIssuingCountry?: string;
  frequentFlyerProgram?: string;
  frequentFlyerNumber?: string;
};

export function toYMD(dob: string) {
  // Accepts "10/10/1988" or "10-10-1988" and converts to "1988-10-10".
  // If already "YYYY-MM-DD", returns as-is.
  if (/^\d{4}-\d{2}-\d{2}$/.test(dob)) return dob;
  const m = dob.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  // last resort: let Date parse, then format
  const dt = new Date(dob);
  return Number.isNaN(dt.getTime()) ? dob : dt.toISOString().slice(0, 10);
}

export function toDuffelPassenger(p: RawPassenger, index: number) {
  return {
    id: p.id ?? `passenger_${index + 1}`,
    type: p.type ?? "adult",
    title: p.title.toLowerCase(), // "mr" | "ms" | "mrs" | "miss" | "dr"
    gender: p.gender.toLowerCase().startsWith("m") ? "m" : "f",
    given_name: p.firstName,
    family_name: p.lastName,
    born_on: toYMD(p.dateOfBirth),
    email: p.email,
    phone_number: p.phoneNumber,
    // Keep optional fields if your backend/webhook wants to forward them as services:
    passport: p.passportNumber
      ? {
          number: p.passportNumber,
          issuing_country_code: p.passportIssuingCountry || undefined,
        }
      : undefined,
    frequent_flyer: p.frequentFlyerProgram && p.frequentFlyerNumber
      ? {
          program: p.frequentFlyerProgram,
          number: p.frequentFlyerNumber,
        }
      : undefined,
  };
}

export function mapPassengers(raw: RawPassenger[]) {
  return raw.map(toDuffelPassenger);
}
