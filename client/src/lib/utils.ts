import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parse a list field that may be stored as JSON array or legacy comma-separated string.
 * Handles backward compatibility with existing data while supporting items with commas.
 */
export function parseListField(value: string): string[] {
  if (!value || !value.trim()) return [];
  
  const trimmed = value.trim();
  
  // Try parsing as JSON array first
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map(item => String(item).trim()).filter(Boolean);
      }
    } catch {
      // Fall through to comma-split
    }
  }
  
  // Fallback to comma-separated for legacy data
  return trimmed.split(',').map(item => item.trim()).filter(Boolean);
}

/**
 * Serialize a list of items to JSON array string for storage.
 * This format properly handles items containing commas.
 */
export function serializeListField(items: string[]): string {
  if (!items || items.length === 0) return '';
  return JSON.stringify(items);
}
