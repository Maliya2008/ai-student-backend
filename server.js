const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// FIXED: Allow all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());

// ========== HEALTH CHECK ==========
app.get('/', (req, res) => {
  res.json({
    message: "🚀 AI Student Backend is LIVE!",
    status: "online",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    endpoints: {
      math_solver: "POST /api/math/solve",
      ai_chat: "POST /api/ai/chat",
      health: "GET /api/health"
    }
  });
});

// ========== MATH SOLVER ENDPOINT ==========
app.post('/api/math/solve', (req, res) => {
  console.log('🔢 Math request received:', req.body);
  
  try {
    const { problem } = req.body;
    
    if (!problem) {
      return res.status(400).json({
        success: false,
        error: "No math problem provided",
        example: 'Send {"problem": "2+2"}'
      });
    }
    
    console.log(`Solving: ${problem}`);
    
    // SIMPLE MATH CALCULATOR - WORKS 100%
    try {
      // Remove spaces for safety
      const cleanProblem = problem.toString().replace(/\s+/g, '');
      
      // Only allow numbers and basic operators
      if (/^[\d+\-*/().]+$/.test(cleanProblem)) {
        // Safe calculation using Function constructor
        const result = new Function('return ' + cleanProblem)();
        
        return res.json({
          success: true,
          problem: problem,
          result: result.toString(),
          type: "calculation",
          steps: [
            `1. Problem: ${problem}`,
            `2. Cleaned: ${cleanProblem}`,
            `3. Result: ${cleanProblem} = ${result}`
          ],
          timestamp: new Date().toISOString()
        });
      } else {
        // For non-math queries
        return res.json({
          success: true,
          problem: problem,
          result: "This appears to be a text question",
          type: "text_query",
          suggestion: "Try basic math like 2+2, 3*4, or (10+5)/3",
          ai_response: "I can solve math problems! Try '2+2' or '5*3' for a quick test."
        });
      }
    } catch (calcError) {
      return res.json({
        success: true,
        problem: problem,
        result: "Could not calculate",
        type: "error",
        message: calcError.message,
        suggestion: "Try: 2+2, 10*5, 100/4, or (2+3)*4"
      });
    }
    
  } catch (error) {
    console.error('Math endpoint error:', error);
    return res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message
    });
  }
});

// ========== AI CHAT ENDPOINT ==========
app.post('/api/ai/chat', (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: "No message provided"
      });
    }
    
    return res.json({
      success: true,
      response: `I received: "${message}". This would be answered by AI. For now, try the math solver!`,
      type: "mock_response"
    });
    
  } catch (error) {
    return res.status(500).json({ error: "Chat error" });
  }
});

// ========== HEALTH ENDPOINT ==========
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ai-student-backend',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ========== TEST ENDPOINT ==========
app.get('/api/test', (req, res) => {
  res.json({
    message: "✅ Test endpoint working!",
    math_endpoint: "Send POST to /api/math/solve with {'problem':'2+2'}",
    timestamp: new Date().toISOString()
  });
});

// ========== ERROR HANDLING ==========
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    available_endpoints: [
      "GET /",
      "GET /api/health",
      "GET /api/test",
      "POST /api/math/solve",
      "POST /api/ai/chat"
    ]
  });
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📡 Health: http://localhost:${PORT}/`);
  console.log(`🔢 Math: POST http://localhost:${PORT}/api/math/solve`);
});
