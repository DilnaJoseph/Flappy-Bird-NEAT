// src/Game.js

// ---------------- IMPORTS ----------------
import { Bird } from './Bird.js';
import { updatePipes, getScore, pipeWidth, pipeGap, getPipes, resetScore, resetPipes, drawPipe} from './Pipes.js';
import { isColliding } from './utils.js';

import { setPipeGap, setPipeFrequency, setPipeSpeed } from './Pipes.js';

// ---------------- INITIALIZATION ----------------
const canvas = document.getElementById('canvas'); // getting canva element
const ctx = canvas.getContext('2d'); // 2D drawing context
const pauseOverlay = document.getElementById('pause-overlay');
const configPanel = document.getElementById('config-panel');


let isPaused = false;

window.gameConfig = {
    gravity: 0.125,
    jumpPower: 3.8,
    showHitboxes: false
};

// Update via sliders
document.getElementById('gravity-slider').addEventListener('input', (e) => {
    window.gameConfig.gravity = parseFloat(e.target.value);
    document.getElementById('gravity-val').innerText = e.target.value;
});

document.getElementById('hitbox-toggle').addEventListener('change', (e) => {
    window.gameConfig.showHitboxes = e.target.checked;
});

// --- Pause Logic ---
document.getElementById('config-panel').addEventListener('mousedown', () => {
    isPaused = true;
    pauseOverlay.style.display = 'flex';
});

canvas.addEventListener('mousedown', () => {
    isPaused = false;
    pauseOverlay.style.display = 'none';
});

// --- Slider Listeners ---
document.getElementById('speed-slider').addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    document.getElementById('speed-val').innerText = val + 'x';
    setPipeSpeed(val); 
});

document.getElementById('gap-slider').addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    document.getElementById('gap-val').innerText = val;
    setPipeGap(val);
});

document.getElementById('freq-slider').addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    document.getElementById('freq-val').innerText = val;
    setPipeFrequency(val);
});

window.addEventListener('gameStart', (e) => {
    const mode = e.detail.mode;
    if (mode === 'ai') {
        console.log("AI Mode Activated");
        // We can speed up the game here later for faster training
    } else {
        console.log("Manual Mode Activated");
    }
    currentState = gameState.ready;
});

// ---------------- GAME STATES ----------------
const gameState = {
    ready: 0,
    start: 1,
    game_over: 2
};

let currentState = gameState.ready;
let isRestarting = false;
let hasNewHighScore = false;

// Load High Score from browser storage, default to 0 if none is found
let highScore = localStorage.getItem('flappyHighScore') || 0; // <-- ADD THIS LINE
// Ensure it's treated as a number
highScore = Number(highScore);

// const canvas = document.getElementById('canvas'); // getting canva element
// const ctx = canvas.getContext('2d'); // 2D drawing context

// --- NEW: Game Over Screen Animation Variables ---
let gameOverScreenSpeed = 8;        // Speed of the slide-in animation
let gameOverFloatOffset = 0;        // For the subtle floating effect
let gameOverFloatSpeed = 0.003;     // Speed of the floating sine wave
let gameOverFloatAmplitude = 3;     // How much it floats up/down

let gameOverScreenXOffset = canvas.width / 2; // Start half a screen width to the right
let gameOverScreenTargetOffset = 0;           // Target is 0 offset (centered)

// setting background image
const backgroundImage = new Image();
// NOTE: Paths are relative to index.html when served by the browser
backgroundImage.src = 'assets/images/flappy-bg.jpg';

// Instantiate the Bird object
const bird = new Bird(
    100, // x
    canvas.height / 2, // y (start in center)
    10, // radius
    '#FF0000', // color
    40, // width
    30, // height
    () => currentState, // function to dynamically get current state
    gameState, // game state
    'assets/images/flappy-bird.png' // imagePath
);

// ---------------- INPUT HANDLING ----------------
window.addEventListener('keydown',(e)=>{
    if(e.code === 'Space'){
        // if ready --> play
        if(currentState === gameState.ready){
            currentState = gameState.start;
        }
        // if play --> play(no change)
        // if game over --> restart game
        else if(currentState === gameState.game_over){
             bird.y = canvas.height/2;
             bird.velocity = 2;
            bird.rotation = 0;

            isRestarting = true;
            currentState = gameState.ready;

            gameOverScreenXOffset = canvas.width / 2; // Reset off-screen
            gameOverFloatOffset = 0;                  // Reset float
        }
    }
});

canvas.addEventListener('touchstart', (e) => {
    // Prevent default browser actions (like scrolling or zooming)
    e.preventDefault(); 
    
    // 1. If ready, start the game
    if (currentState === gameState.ready) {
        currentState = gameState.start;
    } 
    
    // 2. If playing, flap the bird
    else if (currentState === gameState.start) {
        bird.triggerFlapAction();
    }
    
    // 3. If game over, restart the game (Tapping to restart is intuitive on mobile)
    else if (currentState === gameState.game_over) {
        bird.y = canvas.height / 2;
        bird.velocity = 2;
        bird.rotation = 0;

        isRestarting = true;
        currentState = gameState.ready;

        gameOverScreenXOffset = canvas.width / 2; // Reset off-screen
        gameOverFloatOffset = 0;                  // Reset float
    }
});

// --- WINDOW AND INITIAL DRAWING HANDLERS ---
// The dimensions are now fixed by the HTML canvas attributes
function initialDraw() {
    // We no longer read innerWidth/innerHeight, we use the fixed dimensions
    const width = canvas.width;  // 288
    const height = canvas.height; // 512

    // Redraw the background immediately after resize
    ctx.drawImage(backgroundImage, 0, 0, width, height);
    // NOTE: We don't need to update bird.y here unless we want to reset it explicitly
}

// Initial setup and handling resize
backgroundImage.onload = function () {
    initialDraw();
    gameloop(); // Start the loop only once the background is loaded
}

// functions for different screens
function drawCenteredText(text, size,offsetY = 0) {
    ctx.font = `${size}px 'Press Start 2P', monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Outline (makes text readable on any background)
    ctx.strokeStyle = "black";
    ctx.lineWidth = 4;
    ctx.strokeText(text, canvas.width / 2, canvas.height / 2 + offsetY);

    // White fill
    ctx.fillStyle = "white";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 + offsetY);
}

// "Press SPACE to start" screen
function drawStartScreen(bird){ 
    // 1. Title
    drawCenteredText("FLAPPY BIRD", 28, -120); // Move title up

    // 2. High Score Status
    ctx.font = "15px 'Press Start 2P', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Text Outline for High Score
    ctx.strokeStyle = "black";
    ctx.lineWidth = 4;
    ctx.strokeText("HIGH SCORE: " + highScore, canvas.width / 2, 180);

    // Text Fill for High Score (use a different color for pop)
    ctx.fillStyle = "#FFDD00"; 
    ctx.fillText("HIGH SCORE: " + highScore, canvas.width / 2, 180); 
    
    // 3. Tutorial Bird & Animation (Bounce)
    const bounceAmplitude = 5;
    const bounceSpeed = 0.005; // Time-based speed
    const bounceOffset = Math.sin(Date.now() * bounceSpeed) * bounceAmplitude;

    // Define the central ready position
    const readyY = canvas.height / 2 - 20 + bounceOffset; 
    
    // Temporarily set the bird's position for drawing
    bird.y = readyY; 
    bird.draw(ctx); 

    if (window.gameConfig.showHitboxes) {
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;

        // Bird Hitbox (Bird is centered at x,y)
        ctx.strokeRect(
            bird.x - bird.width / 2, 
            bird.y - bird.height / 2, 
            bird.width, 
            bird.height
        );

        // Pipes Hitbox
        const currentPipes = getPipes();
        currentPipes.forEach(pipe => {
            const topPipeEnd = pipe.center - (pipeGap / 2);
            const bottomPipeStart = pipe.center + (pipeGap / 2);

            // Top Pipe Box
            ctx.strokeRect(pipe.x, 0, pipeWidth, topPipeEnd);
            
            // Bottom Pipe Box
            ctx.strokeRect(pipe.x, bottomPipeStart, pipeWidth, canvas.height - bottomPipeStart);
        });
    }

    // 4. Instructions/Prompt (Tap to Flap)
    drawCenteredText("TAP TO FLAP", 20, readyY - canvas.height / 2 + 60); // Centered relative to bird
    
    // 5. Start Prompt
    drawCenteredText("Press SPACE to begin", 15, canvas.height / 2 - 50); // Moved to the bottom
}

// Game Over screen
function drawGameOverScreen(){
    const finalScore = getScore(); 
    
    const oldHighScore = Number(highScore);

    // 1. Check and Save High Score (this logic remains the same)
    // --- NEW: Draw animated Game Over elements ---

    // Use a custom pixel-like font. You might need to import one or just use a fallback.
    // Example: 'Press Start 2P', monospace;
    // For now, let's just make Arial bolder/larger.

    // Calculate Y-offset due to floating
    const currentYOffset = gameOverFloatOffset; 

    // Helper to draw text for the animated screen
    const drawAnimatedText = (text, size, relativeY) => {
        ctx.font = `${size}px 'Press Start 2P', monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // FIX: Change 'gameOverScreenX' to 'gameOverScreenXOffset'
        const finalX = canvas.width / 2 + gameOverScreenXOffset; // Center of screen + Slide Offset
        const finalY = canvas.height / 2 + relativeY + currentYOffset; // Center Y + Relative Y + Float Offset

        // Outline (makes text readable on any background)
        ctx.strokeStyle = "black";
        ctx.lineWidth = 4;
        ctx.strokeText(text, finalX, finalY);

        // White fill
        ctx.fillStyle = "white";
        ctx.fillText(text, finalX, finalY);
    };

    // --- Draw the actual game over elements ---
    drawAnimatedText("GAME OVER", 28, -80); // Title
    
    if(hasNewHighScore) {
        drawAnimatedText(`NEW HIGH SCORE!`, 20, -20);
    } else {
        drawAnimatedText(`Score: ${finalScore}`, 25, -20);
    }

    drawAnimatedText(`Best: ${highScore}`, 25, 30);
    drawAnimatedText("Press SPACE to restart", 14, 90);
}

// Show score while playing
function drawScore(){
    const currentScore = getScore();
    ctx.fillStyle = "white";
    ctx.font = "18px 'Press Start 2P', monospace";
    ctx.textAlign = "left"; // align from left
    ctx.textBaseline = "top"; // align from top
    ctx.fillText(`Score: ${currentScore}`, 10, 10);
}

function drawHitboxes(ctx, bird) {
    if (!window.gameConfig.showHitboxes) return;

    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;

    // Bird Hitbox
    ctx.strokeRect(
        bird.x - bird.width / 2, 
        bird.y - bird.height / 2, 
        bird.width, 
        bird.height
    );

    // Pipes Hitbox
    const currentPipes = getPipes();
    currentPipes.forEach(pipe => {
        const topPipeEnd = pipe.center - (pipeGap / 2);
        const bottomPipeStart = pipe.center + (pipeGap / 2);

        // Top Pipe Box
        ctx.strokeRect(pipe.x, 0, pipeWidth, topPipeEnd);
        
        // Bottom Pipe Box
        ctx.strokeRect(pipe.x, bottomPipeStart, pipeWidth, canvas.height - bottomPipeStart);
    });
}

// ---------------- GAME LOOP ---------------
function gameloop() {

    // 1. CLEAR AND DRAW BACKGROUND
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    if (!isPaused) {

        switch(currentState){
            case gameState.ready:
                // bird visible but stationary

                if (isRestarting) {
                    resetScore(); 
                    resetPipes();
                    isRestarting = false; // Reset the flag
                    hasNewHighScore = false;
                }
                bird.draw(ctx);
                drawStartScreen(bird);
                break;
                
            case gameState.start:
                // currently playing
                bird.update();

                // Update pipes and draw them
                updatePipes(ctx, canvas.width, canvas.height, bird);

                // Check collision between bird and pipes/ground
                if (isColliding(bird, getPipes(), canvas.height)) {
                    // crashSound.play();
                    const finalScore = getScore();
                    const oldHighScore = Number(highScore);
                    
                    if (finalScore > oldHighScore) {
                        highScore = finalScore;
                        localStorage.setItem('flappyHighScore', highScore);
                        hasNewHighScore = true; // <-- Cache the status!
                    } else {
                        hasNewHighScore = false; // Important: Clear the status if not a new score
                    }

                    currentState = gameState.game_over;
                }

                bird.draw(ctx);
                drawScore();
                drawHitboxes(ctx, bird);
                break;

            case gameState.game_over:
                // 1. Draw the static pipes where they were at the moment of impact
                const finalPipes = getPipes();
                finalPipes.forEach(pipe => {
                    // We use the drawPipe function exported from Pipes.js
                    drawPipe(ctx, pipe, canvas.height);
                });
                getPipes().forEach(pipe => drawPipe(ctx, pipe, canvas.height));

                // Make bird fall until it hits the floor
                if (bird.y + bird.height / 2 < canvas.height) {
                    bird.update();
                }

                // 2. Draw the bird (it might still be falling or rotating)
                bird.draw(ctx);
                
                // 3. Handle the UI animations
                if (gameOverScreenXOffset > gameOverScreenTargetOffset) {
                    gameOverScreenXOffset -= gameOverScreenSpeed;
                }
                gameOverFloatOffset = Math.sin(Date.now() * gameOverFloatSpeed) * gameOverFloatAmplitude;

                drawGameOverScreen(); 
                drawHitboxes(ctx, bird); 
                break;  
        }
    }
    // Request next animation frame → loop never ends
    requestAnimationFrame(gameloop);
}

// No need to call flap() or gameloop() here, they are called inside the Bird constructor and backgroundImage.onload
// Link the Jump Power slider
const jumpSlider = document.getElementById('jump-slider');
const jumpVal = document.getElementById('jump-val');

if (jumpSlider) {
    jumpSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        window.gameConfig.jumpPower = val; // Update the config
        jumpVal.innerText = val.toFixed(1); // Update the label
    });
}