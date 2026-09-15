/**
 * Central error-handling middleware.
 * Must be registered AFTER all routes (4-arg signature signals Express it's an error handler).
 */
export function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500
  const message = err.message || 'Internal Server Error'

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} → ${status}: ${message}`)
    if (err.stack) console.error(err.stack)
  }

  res.status(status).json({
    error: {
      message,
      status,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
  })
}

/**
 * 404 catch-all — register AFTER routes but BEFORE errorHandler.
 */
export function notFound(req, res, next) {
  const err = new Error(`Not Found: ${req.method} ${req.originalUrl}`)
  err.status = 404
  next(err)
}
