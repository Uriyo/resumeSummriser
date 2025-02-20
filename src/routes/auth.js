/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user and generate a JWT token
 *     description: >
 *       Authenticates a user using a username and password. On successful authentication, 
 *       returns a JSON Web Token (JWT) which can be used to access protected endpoints.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: "naval.ravikant"
 *               password:
 *                 type: string
 *                 example: "05111974"
 *     responses:
 *       200:
 *         description: User authenticated successfully and JWT token is returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 JWT:
 *                   type: string
 *                   description: The JSON Web Token for accessing protected endpoints.
 *       400:
 *         description: Missing username or password in the request.
 *       401:
 *         description: Invalid credentials provided.
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET ;

const VALID_CREDENTIALS = {
  username: "naval.ravikant",
  password: "05111974"
};

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  if (username === VALID_CREDENTIALS.username && password === VALID_CREDENTIALS.password) {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ JWT: token });
  }

  return res.status(401).json({ error: 'Invalid credentials' });
});

export const authRouter = router;