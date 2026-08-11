// Deterministic date formatting for anything rendered during SSR that also
// hydrates on the client. Two separate hazards, both fixed here:
// toLocaleDateString() depends on locale/ICU data that can differ between
// server and browser, AND local-time getters (getDate(), getMonth()) depend
// on the runtime's timezone — a UTC-midnight timestamp (what
// `new Date("2026-07-14")` produces) rolls back a day in any
// negative-UTC-offset browser versus Render's UTC server. UTC getters make
// this timezone-independent too, not just locale-independent.
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${mm}/${dd}/${d.getUTCFullYear()}`;
}

// Same reasoning as formatDate — toLocaleString() on a number depends on
// runtime locale data too, and can mismatch between server and client.
export function formatNumber(n: number): string {
  const [whole, frac] = Math.abs(n).toFixed(Number.isInteger(n) ? 0 : 2).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${n < 0 ? "-" : ""}${grouped}${frac ? `.${frac}` : ""}`;
}
