import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';

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