/**
 * Send a standardized success response.
 */
export function sendSuccess(res, data = null, message = 'Success', statusCode = 200) {
  const response = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(response);
}

/**
 * Send a standardized paginated success response.
 */
export function sendPaginated(res, data, pagination, message = 'Success') {
  const response = {
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    },
  };
  return res.status(200).json(response);
}

/**
 * Send a standardized error response.
 */
export function sendError(res, statusCode, code, message, details = null) {
  const response = {
    success: false,
    error: {
      code,
      message,
    },
  };
  if (details) {
    response.error.details = details;
  }
  return res.status(statusCode).json(response);
}
