const API_CONFIG = {
  production: "https://api.intervo.ai", // Production API URL
  development: "https://development-api.intervo.ai", // Development API URL
};

const returnAPIUrl = () => {
  return API_CONFIG[process.env.NODE_ENV] || API_CONFIG.development;
};

export default returnAPIUrl;
