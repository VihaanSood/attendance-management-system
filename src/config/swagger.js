// src/config/swagger.js — Swagger/OpenAPI 3.0 configuration
'use strict';

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Attendance & Employee Management System API',
      version: '1.0.0',
      description: `
## Overview
A full-featured multi-tenant Attendance & Employee Management REST API.

## Authentication
All protected routes require a **Bearer JWT token** in the Authorization header:
\`\`\`
Authorization: Bearer <your_token>
\`\`\`

## Multi-Tenancy
Each authenticated user manages **only their own organization's data**. 
Data isolation is enforced at the service layer on every query.

## Rate Limiting
- General API: 100 requests per 15 minutes
- Auth endpoints: 10 requests per 15 minutes
      `,
      contact: { name: 'API Support', email: 'support@company.com' },
    },
    servers: [
      { url: 'http://localhost:5000/api/v1', description: 'Development' },
      { url: 'https://api.yourapp.com/api/v1', description: 'Production' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'object' } },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            totalPages: { type: 'integer' },
            hasNext: { type: 'boolean' },
            hasPrev: { type: 'boolean' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],  // JSDoc comments in route files
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerSpec, swaggerUi };
