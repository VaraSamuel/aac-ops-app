// Deterministic date formatting for anything rendered during SSR that also
// hydrates on the client — toLocaleDateString() depends on the runtime's
// locale/ICU data, which can differ between the server and the browser and
// trigger a hydration mismatch. This never varies by environment.
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}/${d.getFullYear()}`;
}

// Same reasoning as formatDate — toLocaleString() on a number depends on
// runtime locale data too, and can mismatch between server and client.
export function formatNumber(n: number): string {
  const [whole, frac] = Math.abs(n).toFixed(Number.isInteger(n) ? 0 : 2).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${n < 0 ? "-" : ""}${grouped}${frac ? `.${frac}` : ""}`;
}
