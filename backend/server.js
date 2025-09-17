const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable for development
    crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));

// Rate limiting - Allow more requests for development
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // limit each IP to 20 requests per windowMs
    message: {
        error: 'Too many requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/', limiter);
app.use(express.json({ limit: '1mb' }));

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API endpoint for image generation
app.post('/api/generate-image', async (req, res) => {
    try {
        const { prompt } = req.body;
        
        // Input validation
        if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
            return res.status(400).json({
                error: 'Please provide a valid prompt (at least 3 characters)'
            });
        }

        if (prompt.length > 500) {
            return res.status(400).json({
                error: 'Prompt is too long. Please keep it under 500 characters.'
            });
        }

        // Check if API key is configured
        if (!process.env.HUGGINGFACE_API_KEY) {
            console.error('HUGGINGFACE_API_KEY not found in environment variables');
            return res.status(500).json({
                error: 'Server configuration error. Please check API key setup.'
            });
        }

        console.log(`Generating image for prompt: "${prompt}"`);

        // Make request to Hugging Face API
        const response = await fetch(
            'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inputs: prompt,
                    options: {
                        wait_for_model: true,
                        use_cache: false
                    }
                })
            }
        );

        console.log(`Hugging Face API response status: ${response.status}`);

        if (!response.ok) {
            let errorMessage = 'Failed to generate image';
            
            if (response.status === 401) {
                errorMessage = 'API authentication failed. Please check your Hugging Face API key.';
                console.error('401 Error: Invalid API key');
            } else if (response.status === 503) {
                errorMessage = 'Model is loading, please try again in a few moments';
                console.log('503 Error: Model loading');
            } else if (response.status === 429) {
                errorMessage = 'Rate limit exceeded, please wait before trying again';
                console.log('429 Error: Rate limit');
            } else {
                console.error(`HTTP Error: ${response.status}`);
            }
            
            return res.status(response.status).json({ error: errorMessage });
        }

        // Convert to buffer and send as base64
        const buffer = await response.arrayBuffer();
        const base64Image = Buffer.from(buffer).toString('base64');
        
        console.log(`Image generated successfully for prompt: "${prompt}"`);
        
        res.json({
            success: true,
            image: `data:image/png;base64,${base64Image}`,
            prompt: prompt
        });

    } catch (error) {
        console.error('Error generating image:', error);
        res.status(500).json({
            error: 'Internal server error. Please try again later.'
        });
    }
});

// Catch-all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔒 API secured with environment variables`);
    console.log(`📁 Serving static files from: ${path.join(__dirname, '../frontend')}`);
    
    // Check if API key is configured
    if (process.env.HUGGINGFACE_API_KEY) {
        console.log('✅ Hugging Face API key configured');
    } else {
        console.error('❌ HUGGINGFACE_API_KEY not found! Please check your .env file');
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server')
    server.close(() => {
        console.log('HTTP server closed')
    })
});

module.exports = app;