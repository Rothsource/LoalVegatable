const KHR_FORMATTER = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

export function formatKHR(value: number) {
  return `៛ ${KHR_FORMATTER.format(Math.round(value))}`;
}
