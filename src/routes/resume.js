import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { encrypt } from '../utils/encryption.js';
import axios from 'axios';
import pdf from 'pdf-parse';
import mongoose from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();


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
      Analyze the following resume text and extract the information in strictly JSON format with these fields only:
      - name (string): The candidate's full name
      - email (string): The candidate's email address
      - education: object containing
        - degree (string): Highest degree obtained
        - branch (string): Field of study
        - institution (string): University or college name
        - year (number): Year of completion
      - experience: object containing
        - job_title (string): Current or most recent job title
        - company (string): Company name
        - start_date (string): Start date in YYYY-MM format
        - end_date (string): End date in YYYY-MM format or "present"
      - skills (array): List of technical and professional skills
      - summary (string): A brief professional summary of the candidate

      Resume text:
      ${data.text}
    `;

    const result = await model.generateContent(prompt);
    const response_text = result.response.text();
    console.log('Raw Gemini API response:', response_text);

    // Parse the JSON response from Gemini
    const cleanResponseText = response_text
  .replace(/```json\s*/, '')
  .replace(/\s*```/, '')
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