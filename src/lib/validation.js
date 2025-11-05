/**
 * Input Validation and Sanitization
 * Protects against injection attacks and invalid data
 */

/**
 * Sanitize string input
 */
export function sanitizeString(input) {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  // Limit length (adjust as needed)
  if (sanitized.length > 10000) {
    sanitized = sanitized.substring(0, 10000);
  }

  return sanitized;
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate URL format
 */
export function isValidURL(url) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Sanitize object - remove potentially dangerous fields
 */
export function sanitizeObject(obj, allowedFields) {
  if (typeof obj !== 'object' || obj === null) {
    return {};
  }

  const sanitized = {};

  for (const field of allowedFields) {
    if (obj.hasOwnProperty(field)) {
      const value = obj[field];

      // Recursively sanitize nested objects
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // For now, just include it as-is
        // You can add more specific handling for nested objects
        sanitized[field] = value;
      } else if (typeof value === 'string') {
        sanitized[field] = sanitizeString(value);
      } else {
        sanitized[field] = value;
      }
    }
  }

  return sanitized;
}

/**
 * Validate request body against schema
 */
export function validateSchema(data, schema) {
  const errors = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];

    // Required check
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      continue;
    }

    // Skip validation if field is not required and not provided
    if (!rules.required && (value === undefined || value === null)) {
      continue;
    }

    // Type check
    if (rules.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== rules.type) {
        errors.push(`${field} must be of type ${rules.type}`);
        continue;
      }
    }

    // String validations
    if (rules.type === 'string' && typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`${field} must be at least ${rules.minLength} characters`);
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${field} must be at most ${rules.maxLength} characters`);
      }
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(`${field} format is invalid`);
      }
      if (rules.email && !isValidEmail(value)) {
        errors.push(`${field} must be a valid email`);
      }
      if (rules.uuid && !isValidUUID(value)) {
        errors.push(`${field} must be a valid UUID`);
      }
      if (rules.url && !isValidURL(value)) {
        errors.push(`${field} must be a valid URL`);
      }
    }

    // Number validations
    if (rules.type === 'number' && typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        errors.push(`${field} must be at least ${rules.min}`);
      }
      if (rules.max !== undefined && value > rules.max) {
        errors.push(`${field} must be at most ${rules.max}`);
      }
    }

    // Array validations
    if (rules.type === 'array' && Array.isArray(value)) {
      if (rules.minItems && value.length < rules.minItems) {
        errors.push(`${field} must have at least ${rules.minItems} items`);
      }
      if (rules.maxItems && value.length > rules.maxItems) {
        errors.push(`${field} must have at most ${rules.maxItems} items`);
      }
    }

    // Enum validation
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
    }

    // Custom validation
    if (rules.validate) {
      const customError = rules.validate(value, data);
      if (customError) {
        errors.push(customError);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Middleware wrapper for schema validation
 * Usage: export default withValidation(schema)(handler)
 */
export function withValidation(schema) {
  return function validationMiddleware(handler) {
    return async (req, res) => {
      const { valid, errors } = validateSchema(req.body, schema);

      if (!valid) {
        return res.status(400).json({
          error: 'Validation Error',
          errors
        });
      }

      // Continue to handler
      return handler(req, res);
    };
  };
}

export default {
  sanitizeString,
  sanitizeObject,
  isValidEmail,
  isValidUUID,
  isValidURL,
  validateSchema,
  withValidation,
};
