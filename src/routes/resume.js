import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { encrypt } from '../utils/encryption.js';
import axios from 'axios';
import pdf from 'pdf-parse';
import mongoose from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

/**
 * @swagger
 * /api/resume/analyze:
 *   post:
 *     summary: Analyze resume PDF
 *     description: Downloads a PDF from a URL, extracts text, processes it with Gemini API, encrypts sensitive data and stores the applicant data.
 *     tags:
 *       - Resume Analysis
 *     security:
 *       - BearerAuth: []    # <--- Requires Bearer token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 example: "https://www.dhli.in/uploaded_files/resumes/resume_3404.pdf"
 *     responses:
 *       200:
 *         description: Resume processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 education:
 *                   type: object
 *                 experience:
 *                   type: object
 *                 skills:
 *                   type: array
 *                 summary:
 *                   type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Failed to process resume
 */

const router = express.Router();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define the applicant schema
const applicantSchema = new mongoose.Schema({
  name: {
    encryptedData: String,
    iv: String,
    authTag: String
  },
  email: {
    encryptedData: String,
    iv: String,
    authTag: String
  },
  education: {
    degree: String,
    branch: String,
    institution: String,
    year: Number
  },
  experience: {
    job_title: String,
    company: String,
    start_date: String,
    end_date: String
  },
  skills: [String],
  summary: String
});

const Applicant = mongoose.model('Applicant', applicantSchema);

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/analyze', verifyToken, async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'PDF URL is required' });
    }

    console.log('Downloading PDF from URL:', url);
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    
    if (!response.headers['content-type'].includes('application/pdf')) {
      return res.status(400).json({ error: 'URL must point to a PDF file' });
    }

    console.log('Extracting text from PDF...');
    const data = await pdf(response.data);
    
    if (!data.text) {
      return res.status(500).json({ error: 'No text could be extracted from the PDF' });
    }

    console.log('Sending text to Gemini API for processing...');
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      Analyze the following resume text and Please parse the following resume text and return strictly valid JSON **only** (no extra text, no code fences, no disclaimers). The JSON must include exactly these fields:
{
  "name": "string",
  "email": "string",
  "education": {
    "degree": "string",
    "branch": "string",
    "institution": "string",
    "year": number
  },
  "experience": {
    "job_title": "string",
    "company": "string",
    "start_date": "YYYY-MM",
    "end_date": "YYYY-MM or 'present'"
  },
  "skills": ["string", "string", ...],
  "summary": "string"
}

If any field is missing from the resume, return it as an empty string, an empty array, or a suitable default (e.g., 0 for the year).

Resume text:
${data.text}
    `;

    const result = await model.generateContent(prompt);
    const response_text = result.response.text();
    console.log('Raw Gemini API response:', response_text);

    // Parse the JSON response from Gemini
    const cleanResponseText = response_text
    .replace(/^JSON\s*/, '')       // remove "JSON" at the start if present
    .replace(/```json\s*/g, '')    // remove ```json fences
    .replace(/```/g, '') 
    .trim();

    const processedData = JSON.parse(cleanResponseText);
    console.log('Parsed resume data:', processedData);

    // Encrypt sensitive data
    const encryptedName = encrypt(processedData.name);
    const encryptedEmail = encrypt(processedData.email);

    // Create new applicant record
    const applicant = new Applicant({
      name: encryptedName,
      email: encryptedEmail,
      education: processedData.education,
      experience: processedData.experience,
      skills: processedData.skills,
      summary: processedData.summary
    });

    console.log('Saving to MongoDB...');
    await applicant.save();
    console.log('Successfully saved to MongoDB');

    return res.json({
      name: encryptedName.encryptedData,
      email: encryptedEmail.encryptedData,
      education: processedData.education,
      experience: processedData.experience,
      skills: processedData.skills,
      summary: processedData.summary
    });

  } catch (error) {
    console.error('Resume analysis error:', error);
    return res.status(500).json({ error: 'Failed to process resume' });
  }
});

export const resumeRouter = router;