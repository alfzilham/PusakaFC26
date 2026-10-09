// App-wide constants for PusakaFC26

export const APP_NAME = "PusakaFC26";
export const APP_TAGLINE = "Sistem Pendaftaran Jersey";
export const APP_VERSION = "v1.2.0";

export const UPDATE_NOTIFICATION = {
  label: `Update ${APP_VERSION}`,
  summary: "Admin read-only dan akses developer",
  href: `https://github.com/alfzilham/PusakaFC26/releases/tag/${APP_VERSION}`,
};

export const DEVELOPER = {
  name: "Alfiz Ilham",
  whatsapp: "0852-1389-6460",
  // E.164 format for wa.me links (Indonesia +62, strip leading 0)
  whatsappHref: "https://wa.me/6285213896460",
};

export const ADMIN_PASSWORD_ENV = "ADMIN_PASSWORD";
export const DEVELOPER_PASSWORD_ENV = "DEVELOPER_PASSWORD";
export const ADMIN_SESSION_COOKIE = "jc26_admin";
export const DEVELOPER_SESSION_COOKIE = "jc26_developer";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours
export const DEVELOPER_SESSION_MAX_AGE = 60 * 60; // 1 hour

// Rate limiting config
export const LOGIN_MAX_ATTEMPTS = 5;
export const LOGIN_LOCK_MINUTES = 15;
export const LOGIN_LOCK_MS = LOGIN_LOCK_MINUTES * 60 * 1000;

// Default admin password for local dev when env var is not set.
// In production (Railway) set ADMIN_PASSWORD env var to override.
export const DEFAULT_ADMIN_PASSWORD = "jeumala26";
