import { Response } from 'express';

/**
 * Send successful API response
 * Standardizes success response format with message and data payload
 */
export const sendSuccess = (
  res: Response,
  message: string,
  data: any = {},
  statusCode: number = 200
) => {
  res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Send error API response
 * Standardizes error response format with error message and HTTP status code
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 500
) => {
  res.status(statusCode).json({
    success: false,
    message
  });
};
