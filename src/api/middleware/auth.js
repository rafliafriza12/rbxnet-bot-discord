// Simple API Key authentication middleware
export const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];

  if (!process.env.API_KEY) {
    // If no API key is set, skip authentication
    return next();
  }

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: "API key is required",
    });
  }

  if (apiKey !== process.env.API_KEY) {
    return res.status(403).json({
      success: false,
      error: "Invalid API key",
    });
  }

  next();
};

// Rate limiting middleware (simple implementation)
const requestCounts = new Map();

export const rateLimit = (maxRequests = 100, windowMs = 60000) => {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!requestCounts.has(ip)) {
      requestCounts.set(ip, { count: 1, startTime: now });
      return next();
    }

    const requestData = requestCounts.get(ip);

    if (now - requestData.startTime > windowMs) {
      requestCounts.set(ip, { count: 1, startTime: now });
      return next();
    }

    if (requestData.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: "Too many requests, please try again later",
      });
    }

    requestData.count++;
    next();
  };
};
