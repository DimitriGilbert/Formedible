import type { DateFieldProps } from "./types";

// Import Matcher type from react-day-picker
type Matcher = boolean | ((date: Date) => boolean) | Date | Date[] | { from: Date; to: Date } | { before: Date } | { after: Date } | { dayOfWeek: number[] };

/**
 * Builds an array of disabled date matchers for react-day-picker based on dateConfig
 */
export function buildDisabledMatchers(dateConfig?: DateFieldProps["dateConfig"]): Matcher[] {
  const matchers: Matcher[] = [];
  
  if (!dateConfig) return matchers;
  
  // Days of week restrictions (0=Sunday, 6=Saturday)
  if (dateConfig.disabledDaysOfWeek?.length) {
    matchers.push({ dayOfWeek: dateConfig.disabledDaysOfWeek });
  }
  
  // Specific dates
  if (dateConfig.disabledDates?.length) {
    matchers.push(...dateConfig.disabledDates);
  }
  
  // Date ranges
  if (dateConfig.disabledDateRanges?.length) {
    matchers.push(...dateConfig.disabledDateRanges);
  }
  
  // Past dates (disable all dates before today)
  if (dateConfig.disablePastDates) {
    matchers.push({ before: new Date() });
  }
  
  // Future dates (disable all dates after today)
  if (dateConfig.disableFutureDates) {
    matchers.push({ after: new Date() });
  }
  
  // Custom disable function
  if (dateConfig.disableDate) {
    matchers.push((date: Date) => {
      // Call the disableDate function with just the date parameter
      // The form values are handled in the DateField component
      return dateConfig.disableDate!(date);
    });
  }
  
  return matchers;
}