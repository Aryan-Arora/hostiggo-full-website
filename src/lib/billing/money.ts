// All monetary arithmetic in this module happens in integer paise to avoid
// floating-point rounding drift (0.1 + 0.2 !== 0.3 territory) -- rupee
// values only exist at the boundary (function inputs, and formatting for
// display/storage). Every intermediate GST/fee/commission calculation
// rounds to the nearest paisa before being summed, matching how a real
// invoice line-item calculation is done (round each line, not the total).

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/** Rounds paise to the nearest whole paisa (defensive -- inputs should already be integers). */
export function roundPaise(paise: number): number {
  return Math.round(paise);
}

export function percentOf(amountPaise: number, rate: number): number {
  return roundPaise(amountPaise * rate);
}

/** Formats a paise amount as an INR display string, e.g. 123456 -> "₹1,234.56". */
export function formatINR(paise: number): string {
  const rupees = paiseToRupees(paise);
  return `₹${rupees.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
