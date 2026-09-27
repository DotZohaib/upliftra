// server/middleware/errorHandler.js
export function errorHandler(err, req, res, next) {
  console.error('[Server Error]', err.message || err);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'An internal server error occurred. Please try again.'
      : (err.message || 'Internal Server Error'),
  });
}

export function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function sheetsUnavailable(req, res) {
  res.status(503).json({
    success: false,
    offline: true,
    message: 'Google Sheets database not configured. Please add credentials to .env and run npm run setup-sheets.',
  });
}
