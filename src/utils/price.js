export function formatPrice(amount) {
  if (!amount && amount !== 0) return '₹0';
  const num = Number(amount);
  if (num % 1 === 0) return `₹${num.toLocaleString()}`;
  return `₹${num.toFixed(2)}`;
}

export function formatPriceRaw(amount) {
  if (!amount && amount !== 0) return '0';
  const num = Number(amount);
  if (num % 1 === 0) return num.toLocaleString();
  return num.toFixed(2);
}
