const API_CONFIG = {
  production: "https://api.intervo.ai", // Production API URL
  development: "https://development-api.intervo.ai", // Development API URL
};

// Safely check for process.env.NODE_ENV
const environment = "development";

// Return the appropriate config without modifying your existing values
const returnAPIUrl = () => {
  return API_CONFIG[environment] || API_CONFIG.development;
};

export default returnAPIUrl;
