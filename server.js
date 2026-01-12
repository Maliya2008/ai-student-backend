const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();

// Configure file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/jpg', 
      'application/pdf', 'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDF, TXT, DOCX allowed.'));
    }
  }
});

// CORS Configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if not exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// ========== HEALTH CHECK ==========
app.get('/', (req, res) => {
  res.json({
    message: "🚀 AI Student Backend with File Upload",
    status: "online",
    timestamp: new Date().toISOString(),
    endpoints: [
      "POST /api/math/solve - Solve math problems",
      "POST /api/upload/math - Upload math problem images",
      "POST /api/upload/essay - Upload essays for analysis",
      "POST /api/ai/chat - General AI chat",
      "GET /api/health - Health check"
    ]
  });
});

// ========== TEXT MATH SOLVER ==========
app.post('/api/math/solve', async (req, res) => {
  try {
    const { problem } = req.body;
    
    if (!problem) {
      return res.status(400).json({
        success: false,
        error: "No problem provided"
      });
    }

    console.log(`Solving math: ${problem}`);
    
    // Check for DeepSeek API key
    const apiKey = process.env.DEEPSEEK_API_KEY;
    
    if (apiKey && apiKey !== 'your_api_key_here') {
      // Use DeepSeek AI for complex problems
      try {
        const aiResponse = await callDeepSeekAI([
          {
            role: "system",
            content: "You are a math tutor. Solve math problems step by step. Explain each step clearly. For equations, show the solving process. For word problems, break them down."
          },
          {
            role: "user",
            content: `Solve this math problem: ${problem}. Show step-by-step solution with explanations.`
          }
        ]);
        
        return res.json({
          success: true,
          problem: problem,
          result: "Solved with AI",
          solution: aiResponse,
          type: "ai_solution",
          steps: ["AI analyzed and solved the problem"],
          timestamp: new Date().toISOString()
        });
      } catch (aiError) {
        console.log("AI failed, using basic solver:", aiError.message);
      }
    }
    
    // Basic math solver as fallback
    try {
      const cleanProblem = problem.replace(/\s+/g, '');
      if (/^[\d+\-*/().^√π]+$/.test(cleanProblem)) {
        const safeEval = new Function('return ' + cleanProblem
          .replace(/√/g, 'Math.sqrt')
          .replace(/π/g, 'Math.PI')
          .replace(/\^/g, '**'));
        const result = safeEval();
        
        return res.json({
          success: true,
          problem: problem,
          result: result.toString(),
          type: "basic_calculation",
          steps: [
            `Step 1: Clean expression: ${cleanProblem}`,
            `Step 2: Evaluate: ${cleanProblem} = ${result}`
          ],
          timestamp: new Date().toISOString()
        });
      }
    } catch (calcError) {
      // Continue to fallback
    }
    
    // Final fallback
    return res.json({
      success: true,
      problem: problem,
      result: "Problem received",
      type: "text_analysis",
      message: "Would be solved with AI",
      steps: ["AI analysis required for this problem"]
    });
    
  } catch (error) {
    console.error('Math solver error:', error);
    return res.status(500).json({
      success: false,
      error: "Math solving failed",
      message: error.message
    });
  }
});

// ========== FILE UPLOAD: MATH PROBLEMS ==========
app.post('/api/upload/math', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded"
      });
    }
    
    const file = req.file;
    const fileType = file.mimetype;
    const fileName = file.filename;
    const filePath = file.path;
    
    console.log(`Math file uploaded: ${fileName}, Type: ${fileType}`);
    
    // Extract text from different file types
    let extractedText = "";
    
    if (fileType.startsWith('image/')) {
      // For images, we would use OCR here
      // For now, return mock response
      extractedText = `[Image: ${fileName}] Math problem in image format. Would be processed with OCR.`;
    } else if (fileType === 'application/pdf') {
      extractedText = `[PDF: ${fileName}] Math problem in PDF. Text extraction available.`;
    } else if (fileType === 'text/plain') {
      // Read text file
      extractedText = fs.readFileSync(filePath, 'utf8');
    } else {
      extractedText = `[File: ${fileName}] Uploaded for math solving.`;
    }
    
    // Clean up file after processing (optional)
    setTimeout(() => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }, 5000);
    
    // Check for DeepSeek API
    const apiKey = process.env.DEEPSEEK_API_KEY;
    let aiSolution = "";
    
    if (apiKey && apiKey !== 'your_api_key_here') {
      try {
        aiSolution = await callDeepSeekAI([
          {
            role: "system",
            content: "You are a math expert. Solve math problems from uploaded files. Extract the math problem and solve it step by step."
          },
          {
            role: "user",
            content: `Solve the math problem from this uploaded file. File info: ${fileName}, Type: ${fileType}. Content: ${extractedText}`
          }
        ]);
      } catch (aiError) {
        aiSolution = "AI solution temporarily unavailable.";
      }
    } else {
      aiSolution = "Please add DeepSeek API key for AI solutions.";
    }
    
    return res.json({
      success: true,
      message: "Math file uploaded successfully",
      file: {
        name: fileName,
        type: fileType,
        size: file.size,
        path: filePath
      },
      extracted_text: extractedText.substring(0, 500) + (extractedText.length > 500 ? "..." : ""),
      solution: aiSolution || "Math problem ready for solving",
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('File upload error:', error);
    return res.status(500).json({
      success: false,
      error: "File upload failed",
      message: error.message
    });
  }
});

// ========== FILE UPLOAD: ESSAYS & DOCUMENTS ==========
app.post('/api/upload/essay', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded"
      });
    }
    
    const file = req.file;
    const fileType = file.mimetype;
    const fileName = file.filename;
    const filePath = file.path;
    
    console.log(`Essay file uploaded: ${fileName}, Type: ${fileType}`);
    
    // Extract text
    let extractedText = "";
    
    if (fileType === 'text/plain') {
      extractedText = fs.readFileSync(filePath, 'utf8');
    } else if (fileType === 'application/pdf') {
      extractedText = `[PDF: ${fileName}] Essay/document in PDF format.`;
    } else if (fileType.includes('wordprocessingml')) {
      extractedText = `[DOCX: ${fileName}] Word document uploaded.`;
    } else {
      extractedText = `[File: ${fileName}] Uploaded for analysis.`;
    }
    
    // AI Analysis
    const apiKey = process.env.DEEPSEEK_API_KEY;
    let analysis = "";
    
    if (apiKey && apiKey !== 'your_api_key_here') {
      try {
        analysis = await callDeepSeekAI([
          {
            role: "system",
            content: "You are an essay analyzer. Provide feedback on structure, grammar, content, and suggestions for improvement. Be constructive and helpful."
          },
          {
            role: "user",
            content: `Analyze this essay/document: ${extractedText.substring(0, 3000)}`
          }
        ]);
      } catch (aiError) {
        analysis = "Essay analysis temporarily unavailable.";
      }
    } else {
      analysis = "Please add DeepSeek API key for essay analysis.";
    }
    
    // Clean up
    setTimeout(() => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }, 5000);
    
    return res.json({
      success: true,
      message: "Essay uploaded successfully",
      file: {
        name: fileName,
        type: fileType,
        size: file.size
      },
      analysis: analysis || "Essay ready for analysis",
      suggestions: [
        "Check grammar and spelling",
        "Improve paragraph structure",
        "Add more supporting evidence",
        "Strengthen conclusion"
      ],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Essay upload error:', error);
    return res.status(500).json({
      success: false,
      error: "Essay upload failed",
      message: error.message
    });
  }
});

// ========== AI CHAT ENDPOINT ==========
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: "No message provided"
      });
    }
    
    const apiKey = process.env.DEEPSEEK_API_KEY;
    let aiResponse = "";
    
    if (apiKey && apiKey !== 'your_api_key_here') {
      try {
        aiResponse = await callDeepSeekAI([
          {
            role: "system",
            content: "You are a student assistant. Help with homework, explain concepts, answer questions about all subjects."
          },
          {
            role: "user",
            content: message
          }
        ]);
      } catch (aiError) {
        aiResponse = "I'm currently unavailable. Please try again later.";
      }
    } else {
      aiResponse = "Hello! I'm your student assistant. Add DeepSeek API key for full AI capabilities.";
    }
    
    return res.json({
      success: true,
      response: aiResponse,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Chat error",
      message: error.message
    });
  }
});

// ========== DEEPSEEK AI FUNCTION ==========
async function callDeepSeekAI(messages) {
  try {
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: "deepseek-chat",
        messages: messages,
        max_tokens: 2000,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("DeepSeek API Error:", error.response?.data || error.message);
    throw error;
  }
}

// ========== HEALTH ENDPOINT ==========
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ai-student-backend',
    uploads_directory: fs.existsSync('uploads'),
    deepseek_api: process.env.DEEPSEEK_API_KEY ? 'configured' : 'not configured',
    timestamp: new Date().toISOString()
  });
});

// ========== LIST UPLOADED FILES ==========
app.get('/api/uploads', (req, res) => {
  try {
    if (fs.existsSync('uploads')) {
      const files = fs.readdirSync('uploads');
      return res.json({
        success: true,
        count: files.length,
        files: files,
        timestamp: new Date().toISOString()
      });
    }
    return res.json({ success: true, count: 0, files: [] });
  } catch (error) {
    return res.status(500).json({ error: "Cannot read uploads" });
  }
});

// ========== ERROR HANDLER ==========
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      error: "File upload error",
      message: err.message
    });
  }
  res.status(500).json({
    success: false,
    error: "Server error",
    message: err.message
  });
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`📁 Uploads: http://localhost:${PORT}/api/uploads`);
  console.log(`🔢 Math: POST http://localhost:${PORT}/api/math/solve`);
  console.log(`📎 File Upload: POST http://localhost:${PORT}/api/upload/math`);
});
