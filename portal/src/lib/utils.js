import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
// Add to your utils.js or create a new file
export function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

// Utility function to shorten MongoDB IDs for display
export function shortenId(id, length = 8) {
  if (!id) return 'N/A';
  const stringId = id.toString();
  if (stringId.length <= length) return stringId;
  return `${stringId.substring(0, length)}...`;
}

// Utility function to format MongoDB ID for display with tooltip
export function formatIdForDisplay(id, length = 8) {
  if (!id) return 'N/A';
  const stringId = id.toString();
  if (stringId.length <= length) return stringId;
  return {
    display: `${stringId.substring(0, length)}...`,
    full: stringId
  };
}
