export const APP_NAME = "CampusFlow";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
export const DEFAULT_ATTENDANCE_THRESHOLD = 75;

export const UNIVERSES = [
  { id: "srm", name: "SRM Institute of Science and Technology", shortName: "SRM", provider: "srm" },
] as const;

export const EVENT_CATEGORIES = [
  "technical",
  "cultural",
  "sports",
  "workshop",
  "hackathon",
  "career",
  "club",
  "fest",
] as const;

export const CLUB_CATEGORIES = [
  "technical",
  "cultural",
  "sports",
  "entrepreneurship",
  "music",
  "dance",
  "gaming",
  "photography",
  "social_service",
] as const;

export const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;
