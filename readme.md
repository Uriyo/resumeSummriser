# Resume Analysis & Search API

This Node.js project provides RESTful endpoints for analyzing resumes and searching by name. It integrates with external services to extract and process data from PDF resumes, encrypts sensitive information, and stores applicant data in MongoDB. Authentication is handled via JSON Web Tokens (JWT).

## Features
- User Authentication: Login endpoint to authenticate users and issue JWT tokens.
- Resume Analysis: Upload a resume via a URL (pointing to a PDF), extract text using pdf-parse, analyze with Gemini API, and store encrypted sensitive fields in MongoDB.
- Search by Name: Secure endpoint to search for applicants by name.

## Technologies Used
- Node.js & Express: For building the RESTful API.
- MongoDB & Mongoose: For data storage.
- pdf-parse: To extract text from PDF resumes.
- Google Generative AI (Gemini API): For resume analysis.
- Crypto Module: For encrypting sensitive data.
- JWT: For user authentication.
- dotenv: For managing environment variables.

## Prerequisites

- Node.js (v14 or later)
- npm (Node Package Manager)
- A running instance of MongoDB (or use MongoDB Atlas)
- Gemini API credentials

## Installation
Clone the repository:
```
   git clone https://github.com/yourusername/your-repo.git
   cd your-repo 
```


Install dependencies:
```
npm install
```

Create a .env file in the project root
```
PORT=3000
GEMINI_API_KEY=your-gemini-api-key
ENCRYPTION_KEY=your-encryption-key-32-characters
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.vb7pyds.mongodb.net/your-db-name
JWT_SECRET=your-jwt-secret
```
Note: Make sure ENCRYPTION_KEY is either exactly 32 characters or use a key derivation method (like hashing) in your code.

Start the application:
```
npm run dev
```
## Endpoints
### 1. User Authentication
```
POST /api/auth/login
Description: Authenticate a user and receive a JWT token.
Headers:Content-Type: application/json

Body Example:
{
  "username": "naval.ravikant",
  "password": "05111974"
}
```
Response: Returns a JWT token that must be used for subsequent authenticated requests.
### 2. Search by Name
POST /api/search/name
Description: Search for applicants by name.
Headers:Authorization: Bearer <your-jwt-token>Content-Type: application/json

Body Example:
{
  "name": "raj"
}

Response: Returns search results for the provided name.
### 3. Resume Analysis
```
POST /api/resume/analyze
Description: Analyze a resume provided via a PDF URL. This endpoint downloads the PDF, extracts the text, processes it with Gemini API, encrypts sensitive data (name and email), and saves the applicant record to MongoDB.
Headers:Authorization: Bearer <your-jwt-token>Content-Type: application/json
```
Body Example:
```
{
  "url": "https://www.dhli.in/uploaded_files/resumes/resume_3404.pdf"
}
```

Response: Returns the processed resume data with encrypted sensitive fields.
Example Requests
Use cURL or any API client (e.g., Postman) to test the endpoints:
### Login:
```
curl -X POST http://localhost:3000/api/auth/login \
-H "Content-Type: application/json" \
-d '{
      "username": "naval.ravikant",
      "password": "05111974"
    }'

```

### Search by Name:
```
curl -X POST http://localhost:3000/api/search/name \
-H "Authorization: Bearer <your-jwt-token>" \
-H "Content-Type: application/json" \
-d '{"name": "raj"}'
```

### Resume Analysis:
```
curl -X POST http://localhost:3000/api/resume/analyze \
-H "Authorization: Bearer <your-jwt-token>" \
-H "Content-Type: application/json" \
-d '{"url": "https://www.dhli.in/uploaded_files/resumes/resume_3404.pdf"}'
```
## Troubleshooting
#### Environment Variables Not Loaded:
Ensure that you are calling dotenv.config() at the top of your main file (e.g., index.js or server.js) and that your .env file is correctly formatted.
#### PDF Parsing Errors:
Confirm that the provided URL points to a valid PDF file. You can check the content-type header in the response to verify.
#### MongoDB Connection Issues:
Verify your MongoDB URI and credentials in the .env file.

