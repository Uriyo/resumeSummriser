import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { decrypt } from '../utils/encryption.js';
import mongoose from 'mongoose';

const router = express.Router();

router.post('/name', verifyToken, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name search parameter is required' });
    }

    console.log('Searching for applicants...');
    const applicants = await mongoose.model('Applicant').find({});
    
    // Filter and decrypt results
    const matchingApplicants = applicants.filter(applicant => {
      try {
        const decryptedName = decrypt(applicant.name);
        return decryptedName.toLowerCase().includes(name.toLowerCase());
      } catch (error) {
        console.error('Error decrypting name:', error);
        return false;
      }
    });

    if (matchingApplicants.length === 0) {
      return res.status(404).json({ error: 'No matching applicants found' });
    }

    // Process and format the results
    const results = matchingApplicants.map(applicant => {
      try {
        return {
          name: decrypt(applicant.name),
          email: decrypt(applicant.email),
          education: applicant.education,
          experience: applicant.experience,
          skills: applicant.skills,
          summary: applicant.summary
        };
      } catch (error) {
        console.error('Error processing applicant data:', error);
        return null;
      }
    }).filter(result => result !== null);

    console.log(`Found ${results.length} matching applicants`);
    return res.json(results);

  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ error: 'Failed to search resumes' });
  }
});

export const searchRouter = router;