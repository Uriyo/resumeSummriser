import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Resume Analysis & Search API',
      version: '1.0.0',
      description: 'API documentation for the Resume Analysis & Search project'
    },
    servers: [
      {
        url: 'https://resumesummriser.onrender.com',
        description: 'Dev server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js'], // Adjust according to your project structure
};

const swaggerSpec = swaggerJSDoc(options);

export { swaggerUi, swaggerSpec };
