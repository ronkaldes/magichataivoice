const API_CONFIG = {
  production: import.meta.env.VITE_API_URL_PRODUCTION, // Production API URL from env
  development: import.meta.env.VITE_API_URL_DEVELOPMENT, // Development API URL from env
};

// Get environment from Vite's mode or default to development
const environment =
  import.meta.env.MODE === "production" ? "production" : "development";

// Return the appropriate config based on environment
const returnAPIUrl = () => {
  return API_CONFIG[environment] || API_CONFIG.development;
};

export default returnAPIUrl;
