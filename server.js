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

// Math solver endpoint
app.post('/api/math/solve', async (req, res) => {
  try {
    const { problem } = req.body;
    
    if (!problem) {
      return res.status(400).json({ error: "No problem provided" });
    }

    // Try basic calculation first
    let result;
    try {
      // Safe evaluation for simple math
      if (/^[0-9+\-*/().\s]+$/.test(problem)) {
        result = eval(problem);
      } else {
        throw new Error("Complex expression - needs AI");
      }
      
      res.json({
        success: true,
        problem: problem,
        result: result.toString(),
        type: "basic_calculation",
        steps: [`Calculated: ${problem} = ${result}`]
      });
      
    } catch (calcError) {
      // If basic calculation fails, use AI
      const aiResponse = await callDeepSeekAI([
        {
          role: "system",
          content: "You are a math tutor. Solve math problems step by step."
        },
        {
          role: "user",
          content: `Solve this math problem: ${problem}. Show step-by-step solution.`
        }
      ]);
      
      res.json({
        success: true,
        problem: problem,
        result: aiResponse || "AI solution pending",
        type: "ai_solution",
        aiResponse: aiResponse
      });
    }
    
  } catch (error) {
    console.error("Math solve error:", error);
    res.status(500).json({ 
      error: "Failed to solve problem",
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