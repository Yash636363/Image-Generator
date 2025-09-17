// DOM Elements
const generateImageForm = document.getElementById('generate-image-form');
const formInput = document.getElementById('input-value');
const resultMessage = document.getElementById('result-message');
const generatedImage = document.getElementById('generated-image');
const imageContainer = document.getElementById('images-visible');
const generateBtn = document.getElementById('generate-btn');
const btnText = document.getElementById('btn-text');
const downloadBtn = document.getElementById('download-btn');
const loadingSpinner = document.getElementById('loading-spinner');
const errorContainer = document.getElementById('error-container');

// Configuration - NO API KEYS HERE!
const API_BASE_URL = '/api';

// Utility Functions
function showError(message) {
    errorContainer.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            ${message}
        </div>
    `;
    setTimeout(() => {
        errorContainer.innerHTML = '';
    }, 5000);
}

function showSuccess(message) {
    errorContainer.innerHTML = `
        <div class="success-message">
            <i class="fas fa-check-circle"></i>
            ${message}
        </div>
    `;
    setTimeout(() => {
        errorContainer.innerHTML = '';
    }, 3000);
}

// Main image generation function - Now calls our secure backend
async function generateImage(prompt) {
    try {
        // Show loading state
        loadingSpinner.style.display = 'block';
        generateBtn.disabled = true;
        btnText.textContent = 'Creating...';
        generateBtn.classList.add('loading');
        imageContainer.style.display = 'none';

        // Make secure API request to our backend
        const response = await fetch(`${API_BASE_URL}/generate-image`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to generate image');
        }

        if (data.success && data.image) {
            // Display the generated image
            generatedImage.src = data.image;
            generatedImage.onload = () => {
                resultMessage.textContent = `✨ Your AI masterpiece is ready! Prompt: "${prompt}"`;
                imageContainer.style.display = 'block';
                showSuccess('Image generated successfully!');
            };
        } else {
            throw new Error('Invalid response from server');
        }

    } catch (error) {
        console.error('Error generating image:', error);
        showError(error.message || 'Failed to generate image. Please try again.');
    } finally {
        // Reset loading state
        loadingSpinner.style.display = 'none';
        generateBtn.disabled = false;
        btnText.textContent = 'Generate Image';
        generateBtn.classList.remove('loading');
    }
}

// Form submission handler
generateImageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const prompt = formInput.value.trim();
    
    if (!prompt) {
        showError('Please enter a description for your image!');
        formInput.focus();
        return;
    }

    if (prompt.length < 3) {
        showError('Please enter a more detailed description (at least 3 characters).');
        return;
    }

    if (prompt.length > 500) {
        showError('Description is too long. Please keep it under 500 characters.');
        return;
    }

    generateImage(prompt);
});

// Download functionality
downloadBtn.addEventListener('click', async () => {
    try {
        const imageUrl = generatedImage.src;
        if (!imageUrl) return;

        // Create download link
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `ai-generated-image-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showSuccess('Image downloaded successfully!');
    } catch (error) {
        showError('Failed to download image. Please try right-clicking and saving manually.');
    }
});

// Input validation
formInput.addEventListener('input', (e) => {
    const value = e.target.value;
    if (value.length > 500) {
        showError('Description is too long. Please keep it under 500 characters.');
        e.target.value = value.substring(0, 500);
    }
});

// Example prompts
const examplePrompts = [
    "A futuristic city skyline at sunset with flying cars",
    "A magical forest with glowing mushrooms and fairy lights",
    "A steampunk robot playing violin in an old library",
    "A serene Japanese garden with cherry blossoms and koi fish",
    "An astronaut riding a horse on the moon"
];

formInput.addEventListener('focus', () => {
    if (!formInput.value) {
        const randomPrompt = examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
        formInput.placeholder = `Try: ${randomPrompt}`;
    }
});

// Confetti animation
function randomColor() {
    const colors = [
        "#ffb347", "#ff5e62", "#36d1c4", "#f7971e", "#c471f5",
        "#5f7cff", "#f093fb", "#fa71cd", "#ffd200", "#5b86e5"
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

function createConfettiPiece() {
    const confetti = document.createElement('div');
    confetti.className = 'confetti-piece';
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.background = randomColor();
    confetti.style.animationDuration = (2.5 + Math.random() * 1.5) + 's';
    confetti.style.opacity = 0.5 + Math.random() * 0.5;
    confetti.style.transform = `rotate(${Math.random()*360}deg)`;
    document.getElementById('confetti').appendChild(confetti);
    setTimeout(() => confetti.remove(), 4000);
}

setInterval(createConfettiPiece, 220);