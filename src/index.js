import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.js';
import { resumeRouter } from './routes/resume.js';
import { searchRouter } from './routes/search.js';
import { errorHandler } from './middleware/errorHandler.js';
import { swaggerUi, swaggerSpec } from './swagger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes

app.use('/api/auth', authRouter);
app.use('/api/resume', resumeRouter);
app.use('/api/search', searchRouter);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});