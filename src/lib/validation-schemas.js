/**
 * Validation Schemas for All API Endpoints
 * Auto-generated validation rules
 */

// Workflow schemas
export const workflowCreateSchema = {
  name: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 255,
  },
  description: {
    required: false,
    type: 'string',
    maxLength: 2000,
  },
  steps: {
    required: true,
    type: 'array',
    minItems: 1,
    maxItems: 100,
  },
  status: {
    required: false,
    type: 'string',
    enum: ['draft', 'active', 'archived'],
  },
  metadata: {
    required: false,
    type: 'object',
  },
};

export const workflowUpdateSchema = {
  id: {
    required: true,
    type: 'string',
    uuid: true,
  },
  name: {
    required: false,
    type: 'string',
    minLength: 1,
    maxLength: 255,
  },
  description: {
    required: false,
    type: 'string',
    maxLength: 2000,
  },
  steps: {
    required: false,
    type: 'array',
    minItems: 1,
    maxItems: 100,
  },
  status: {
    required: false,
    type: 'string',
    enum: ['draft', 'active', 'archived'],
  },
};

// Product schemas
export const productCreateSchema = {
  name: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 255,
  },
  description: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 5000,
  },
  price: {
    required: false,
    type: 'number',
    min: 0,
  },
  category: {
    required: false,
    type: 'string',
    maxLength: 100,
  },
  url: {
    required: false,
    type: 'string',
    url: true,
    maxLength: 500,
  },
};

export const productUpdateSchema = {
  id: {
    required: true,
    type: 'string',
    uuid: true,
  },
  name: {
    required: false,
    type: 'string',
    minLength: 1,
    maxLength: 255,
  },
  description: {
    required: false,
    type: 'string',
    maxLength: 5000,
  },
  price: {
    required: false,
    type: 'number',
    min: 0,
  },
};

// Campaign schemas
export const campaignCreateSchema = {
  name: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 255,
  },
  description: {
    required: false,
    type: 'string',
    maxLength: 2000,
  },
  platforms: {
    required: true,
    type: 'array',
    minItems: 1,
    validate: (value) => {
      const validPlatforms = ['twitter', 'linkedin', 'reddit', 'facebook'];
      const invalid = value.filter(p => !validPlatforms.includes(p));
      if (invalid.length > 0) {
        return `Invalid platforms: ${invalid.join(', ')}`;
      }
      return null;
    },
  },
  keywords: {
    required: true,
    type: 'array',
    minItems: 1,
    maxItems: 50,
  },
  hashtags: {
    required: false,
    type: 'array',
    maxItems: 20,
  },
  interval_minutes: {
    required: false,
    type: 'number',
    min: 5,
    max: 1440, // Max 24 hours
  },
};

// Saved search schemas
export const savedSearchSchema = {
  name: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 255,
  },
  query: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 1000,
  },
  platforms: {
    required: true,
    type: 'array',
    minItems: 1,
  },
  alert_enabled: {
    required: false,
    type: 'boolean',
  },
  alert_frequency: {
    required: false,
    type: 'string',
    enum: ['immediate', 'hourly', 'daily', 'weekly'],
  },
};

// Trigger word schemas
export const triggerWordSchema = {
  word: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 100,
  },
  category: {
    required: false,
    type: 'string',
    enum: ['buying-intent', 'problem', 'question', 'complaint', 'positive'],
  },
  score: {
    required: false,
    type: 'number',
    min: 1,
    max: 100,
  },
  product_id: {
    required: false,
    type: 'string',
    uuid: true,
  },
};

// Outreach rule schemas
export const outreachRuleSchema = {
  campaign_id: {
    required: true,
    type: 'string',
    uuid: true,
  },
  name: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 255,
  },
  triggers: {
    required: true,
    type: 'object',
  },
  response_template: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 5000,
  },
  use_ai_personalization: {
    required: false,
    type: 'boolean',
  },
  require_approval: {
    required: false,
    type: 'boolean',
  },
  channels: {
    required: true,
    type: 'object',
  },
};

// User data schemas (GDPR)
export const dataExportSchema = {
  format: {
    required: false,
    type: 'string',
    enum: ['json', 'csv'],
  },
  include: {
    required: false,
    type: 'array',
    validate: (value) => {
      const validTypes = ['workflows', 'products', 'campaigns', 'mentions', 'searches'];
      const invalid = value.filter(t => !validTypes.includes(t));
      if (invalid.length > 0) {
        return `Invalid data types: ${invalid.join(', ')}`;
      }
      return null;
    },
  },
};

export const dataDeleteSchema = {
  confirm: {
    required: true,
    type: 'string',
    validate: (value) => {
      if (value !== 'DELETE MY ACCOUNT') {
        return 'Please type "DELETE MY ACCOUNT" to confirm';
      }
      return null;
    },
  },
  reason: {
    required: false,
    type: 'string',
    maxLength: 1000,
  },
};

// Email schemas
export const emailSchema = {
  to: {
    required: true,
    type: 'string',
    email: true,
  },
  subject: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 255,
  },
  body: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 10000,
  },
};

// Generic ID validation
export const idSchema = {
  id: {
    required: true,
    type: 'string',
    uuid: true,
  },
};

// Pagination schema
export const paginationSchema = {
  page: {
    required: false,
    type: 'number',
    min: 1,
    max: 10000,
  },
  limit: {
    required: false,
    type: 'number',
    min: 1,
    max: 100,
  },
  sort: {
    required: false,
    type: 'string',
    enum: ['asc', 'desc'],
  },
};

export default {
  workflowCreateSchema,
  workflowUpdateSchema,
  productCreateSchema,
  productUpdateSchema,
  campaignCreateSchema,
  savedSearchSchema,
  triggerWordSchema,
  outreachRuleSchema,
  dataExportSchema,
  dataDeleteSchema,
  emailSchema,
  idSchema,
  paginationSchema,
};
