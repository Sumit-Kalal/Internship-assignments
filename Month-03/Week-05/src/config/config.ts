/**
 * Centralized Configuration Management
 * All application configuration in one place for maintainability
 */

// JWT Configuration
export const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET || 'super-secret-key-change-this-in-production',
  EXPIRES_IN: '24h'
};

// Server Configuration
export const SERVER_CONFIG = {
  PORT: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  HOST: '0.0.0.0',
  NODE_ENV: process.env.NODE_ENV || 'development'
};

// File Upload Configuration
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/png', 'image/jpeg', 'application/pdf'],
  UPLOAD_DIR: 'uploads'
};

// Security Configuration
export const SECURITY_CONFIG = {
  BCRYPT_ROUNDS: 10,
  CORS_ORIGIN: '*'
};

// Warning for default secrets
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.warn('⚠️  WARNING: Using default JWT_SECRET in production. Set JWT_SECRET environment variable!');
}
