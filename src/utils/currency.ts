export function formatBudget(amount: number, language: string): string {
  return new Intl.NumberFormat(language === "id" ? "id-ID" : "en-US", {
    style: "currency",
    currency: language === "id" ? "IDR" : "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}
