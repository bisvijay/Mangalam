import type { GSTSlab } from "@/types/config";

/**
 * Default GST slabs for hotel rooms (can be overridden from settings).
 * Rates per night per room.
 */
const DEFAULT_SLABS: GSTSlab[] = [
  {
    minRate: 0,
    maxRate: 999,
    gstPercent: 0,
    itcEligible: false,
    label: "Exempt (up to ₹999)",
  },
  {
    minRate: 1000,
    maxRate: 7500,
    gstPercent: 5,
    itcEligible: false,
    label: "5% GST (₹1,000 - ₹7,500)",
  },
  {
    minRate: 7501,
    maxRate: 999999,
    gstPercent: 18,
    itcEligible: true,
    label: "18% GST (above ₹7,500)",
  },
];

export interface GSTResult {
  baseAmount: number;
  gstPercent: number;
  cgstPercent: number;
  sgstPercent: number;
  cgstAmount: number;
  sgstAmount: number;
  totalGST: number;
  totalWithGST: number;
  itcEligible: boolean;
  slabLabel: string;
}

/**
 * Find the applicable GST slab for a given room rate.
 */
export function findSlab(
  ratePerNight: number,
  slabs: GSTSlab[] = DEFAULT_SLABS
): GSTSlab {
  const slab = slabs.find(
    (s) => ratePerNight >= s.minRate && ratePerNight <= s.maxRate
  );
  return slab ?? DEFAULT_SLABS[0];
}

/**
 * Calculate GST for room charges.
 * CGST and SGST are split equally (intra-state supply in Bihar).
 */
export function calculateRoomGST(
  ratePerNight: number,
  nights: number,
  roomCount: number = 1,
  slabs?: GSTSlab[]
): GSTResult {
  const slab = findSlab(ratePerNight, slabs);
  const baseAmount = ratePerNight * nights * roomCount;
  const gstPercent = slab.gstPercent;
  const halfPercent = gstPercent / 2;
  const totalGST = roundTo2(baseAmount * (gstPercent / 100));
  const cgstAmount = roundTo2(baseAmount * (halfPercent / 100));
  const sgstAmount = roundTo2(totalGST - cgstAmount); // avoid floating point drift

  return {
    baseAmount,
    gstPercent,
    cgstPercent: halfPercent,
    sgstPercent: halfPercent,
    cgstAmount,
    sgstAmount,
    totalGST,
    totalWithGST: roundTo2(baseAmount + totalGST),
    itcEligible: slab.itcEligible,
    slabLabel: slab.label,
  };
}

/**
 * Calculate GST for hall/banquet charges.
 * Banquet/convention services attract 18% GST with ITC.
 */
export function calculateHallGST(baseAmount: number): GSTResult {
  const gstPercent = 18;
  const halfPercent = 9;
  const totalGST = roundTo2(baseAmount * (gstPercent / 100));
  const cgstAmount = roundTo2(baseAmount * (halfPercent / 100));
  const sgstAmount = roundTo2(totalGST - cgstAmount);

  return {
    baseAmount,
    gstPercent,
    cgstPercent: halfPercent,
    sgstPercent: halfPercent,
    cgstAmount,
    sgstAmount,
    totalGST,
    totalWithGST: roundTo2(baseAmount + totalGST),
    itcEligible: true,
    slabLabel: "18% GST (Banquet/Convention)",
  };
}

/**
 * Calculate GST for food/catering charges.
 * Restaurant services in hotels: 5% without ITC (if not part of room tariff).
 */
export function calculateFoodGST(baseAmount: number): GSTResult {
  const gstPercent = 5;
  const halfPercent = 2.5;
  const totalGST = roundTo2(baseAmount * (gstPercent / 100));
  const cgstAmount = roundTo2(baseAmount * (halfPercent / 100));
  const sgstAmount = roundTo2(totalGST - cgstAmount);

  return {
    baseAmount,
    gstPercent,
    cgstPercent: halfPercent,
    sgstPercent: halfPercent,
    cgstAmount,
    sgstAmount,
    totalGST,
    totalWithGST: roundTo2(baseAmount + totalGST),
    itcEligible: false,
    slabLabel: "5% GST (Food & Catering)",
  };
}

/**
 * Calculate GST for a generic taxable service at a given rate.
 */
export function calculateGST(
  baseAmount: number,
  gstPercent: number,
  itcEligible: boolean = false,
  label: string = ""
): GSTResult {
  const halfPercent = gstPercent / 2;
  const totalGST = roundTo2(baseAmount * (gstPercent / 100));
  const cgstAmount = roundTo2(baseAmount * (halfPercent / 100));
  const sgstAmount = roundTo2(totalGST - cgstAmount);

  return {
    baseAmount,
    gstPercent,
    cgstPercent: halfPercent,
    sgstPercent: halfPercent,
    cgstAmount,
    sgstAmount,
    totalGST,
    totalWithGST: roundTo2(baseAmount + totalGST),
    itcEligible,
    slabLabel: label || `${gstPercent}% GST`,
  };
}

/**
 * Aggregate multiple GST results into a summary.
 */
export function aggregateGST(results: GSTResult[]): {
  totalBase: number;
  totalCGST: number;
  totalSGST: number;
  totalGST: number;
  grandTotal: number;
} {
  const totalBase = roundTo2(results.reduce((s, r) => s + r.baseAmount, 0));
  const totalCGST = roundTo2(results.reduce((s, r) => s + r.cgstAmount, 0));
  const totalSGST = roundTo2(results.reduce((s, r) => s + r.sgstAmount, 0));
  const totalGST = roundTo2(totalCGST + totalSGST);
  const grandTotal = roundTo2(totalBase + totalGST);

  return { totalBase, totalCGST, totalSGST, totalGST, grandTotal };
}

function roundTo2(num: number): number {
  return Math.round(num * 100) / 100;
}
