const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();

// Allow requests from anywhere
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: "✅ Backend is working!",
    status: "online",
    timestamp: new Date().toISOString()
  });
});

// SIMPLE Math solver endpoint - GUARANTEED TO WORK
app.post('/api/math/solve', (req, res) => {
  console.log('Math endpoint called with:', req.body);
  
  try {
    const { problem } = req.body;
    
    if (!problem) {
      return res.json({
        success: false,
        error: "No problem provided"
      });
    }
    
    // Always respond with success for testing
    return res.json({
      success: true,
      problem: problem,
      result: "4", // Hardcoded for testing
      type: "test",
      steps: ["Test mode: Would solve " + problem],
      message: "Backend is working! Math endpoint active."
    });
    
  } catch (error) {
    console.error('Error in math endpoint:', error);
    return res.json({
      success: false,
      error: "Server error",
      message: error.message
    });
  }
});

// DeepSeek AI function
async function callDeepSeekAI(messages) {
  try {
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: "deepseek-chat",
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("DeepSeek API Error:", error.message);
    return "I'm sorry, I couldn't process that request. Please check your API key or try again.";
  }
}

// More endpoints
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    const aiResponse = await callDeepSeekAI([
      {
        role: "system",
        content: "You are an AI tutor for students. Help with homework, explain concepts, and provide educational support."
      },
      {
        role: "user",
        content: message
      }
    ]);
    
    res.json({
      success: true,
      response: aiResponse
    });
    
  } catch (error) {
    res.status(500).json({ error: "AI chat failed" });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ai-student-backend',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Access at: http://localhost:${PORT}`);
});
