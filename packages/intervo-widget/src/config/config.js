const API_CONFIG = {
  production:
    import.meta.env?.VITE_API_URL_PRODUCTION ||
    (typeof process !== "undefined" &&
      process.env?.NEXT_PUBLIC_API_URL_PRODUCTION) ||
    "https://api.intervo.ai", // Production API URL from env
  development:
    import.meta.env?.VITE_API_URL_DEVELOPMENT ||
    (typeof process !== "undefined" &&
      process.env?.NEXT_PUBLIC_API_URL_DEVELOPMENT) ||
    "https://development-api.intervo.ai", // Development API URL from env
};

// Get environment from Vite's MODE or Next.js NODE_ENV, default to development
const environment =
  import.meta.env?.MODE === "production" ||
  (typeof process !== "undefined" && process.env?.NODE_ENV === "production")
    ? "production"
    : "development";

// Return the appropriate config based on environment
const returnAPIUrl = () => {
  return API_CONFIG[environment] || API_CONFIG.development;
};

export default returnAPIUrl;
