// src/Game.js

// TOP OF Game.js
window.aiBridge = {
    isAiEnabled: false,
    decide: () => false,
    getGen: () => 1,
    getAlive: () => 0,
    nextGen: () => {}
};

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

let isTraining = false;

function toggleSettings(lock) {
    isTraining = lock;
    const sliders = document.querySelectorAll('#config-panel input');
    const startBtn = document.getElementById('ai-start-btn');
    const stopBtn = document.getElementById('ai-stop-btn');

    sliders.forEach(slider => {
        slider.disabled = lock; // This makes them immovable
    });

    if (lock) {
        startBtn.style.display = 'none';
        stopBtn.style.display = 'block';
    } else {
        startBtn.style.display = 'block';
        stopBtn.style.display = 'none';
    }
}

// Button Listeners
document.getElementById('ai-start-btn').addEventListener('click', () => {
    toggleSettings(true);
    currentState = gameState.start; // Trigger the game loop
});

document.getElementById('ai-stop-btn').addEventListener('click', () => {
    toggleSettings(false);
    currentState = gameState.ready; // Pause/Reset the simulation
});

window.gameConfig = {
    gravity: 0.125,
    jumpPower: 3.8,
    showHitboxes: false
};

// Stop the game from reacting when interacting with setting

// --- Pause Logic ---
document.getElementById('config-panel').addEventListener('mousedown', () => {
    isPaused = true;
    pauseOverlay.style.display = 'flex';
});

canvas.addEventListener('mousedown', () => {
    isPaused = false;
    pauseOverlay.style.display = 'none';
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
let birds = [];
const POP_SIZE = 50;

birds.push(new Bird(
    100, canvas.height / 2, 10, '#FF0000', 40, 30, 
    () => currentState, gameState, 'assets/images/flappy-bird.png'
));

window.addEventListener('gameStart', (e) => {
    const mode = e.detail.mode;

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

    document.getElementById('hitbox-toggle').addEventListener('change', (e) => {
        window.gameConfig.showHitboxes = e.target.checked;
    });

    console.log(`${mode.toUpperCase()} Mode Activated`);

    // 1. Configure AI Bridge
    window.aiBridge.isAiEnabled = (mode === 'ai');
    
    // 2. UI Updates
    const aiStats = document.getElementById('ai-stats');
    if (aiStats) aiStats.style.display = (mode === 'ai') ? 'block' : 'none';

    // 3. Population Management
    birds = []; // Clear existing birds
    const count = (mode === 'ai') ? POP_SIZE : 1;
    
    for (let i = 0; i < count; i++) {
        birds.push(new Bird(
            100, canvas.height / 2, 10, '#FF0000', 40, 30, 
            () => currentState, gameState, 'assets/images/flappy-bird.png'
        ));
    }

    // 4. Start the Game
    // We set it to 'ready' first to show the "Tap to Flap", 
    // or set it to 'start' to jump straight into action.
    currentState = gameState.ready; 
});

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
            birds[0].y = canvas.height/2;
            birds[0].velocity = 2;
            birds[0].rotation = 0;
            birds[0].dead = false;

            resetPipes(); 
            resetScore();

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
        if (!window.aiBridge.isAiEnabled) {
            birds[0].triggerFlapAction();
        }
    }
    
    // 3. If game over, restart the game (Tapping to restart is intuitive on mobile)
    else if (currentState === gameState.game_over) {
        birds[0].y = canvas.height / 2;
        birds[0].velocity = 2;
        birds[0].rotation = 0;

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
        birds[0].x - birds[0].width / 2, 
        birds[0].y - birds[0].height / 2, 
        birds[0].width, 
        birds[0].height
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
                    birds[0].dead = false;
                }
                if (birds.length > 0) {
                    birds[0].draw(ctx);
                    drawStartScreen(birds[0]); // Just show the first bird as a preview
                }
                break;
                
            case gameState.start:
                let allDead = true;
                const pipes = getPipes();
                
                // Use the first bird to find the next pipe (since they all see the same pipes)
                const nextPipe = pipes.find(p => p.x + pipeWidth > birds[0].x - birds[0].width/2);

                birds.forEach((b, index) => {
                    if (b.dead) return; // Skip dead birds
                    allDead = false;

                    // 1. AI Decision Making
                    if (window.aiBridge.isAiEnabled && nextPipe) {
                        const data = { 
                            birdY: b.y, 
                            distToPipe: nextPipe.x - b.x, 
                            pipeCenter: nextPipe.center, 
                            velocity: b.velocity 
                        };
                        // Python decide() now takes the 'index' to know which bird it's helping
                        if (window.aiBridge.decide(data, index)) {
                            b.triggerFlapAction();
                        }
                    }

                    // 2. Physics and Collision
                    b.update();
                    if (isColliding(b, pipes, canvas.height)) {
                        b.dead = true; 
                    }

                    // 3. Drawing
                    b.draw(ctx);
                    drawHitboxes(ctx, b);
                });

                // 4. World Update (Move pipes)
                updatePipes(ctx, canvas.width, canvas.height, birds[0]);
                drawScore();

                // 5. AI Management (Check if everyone is dead)
                if (window.aiBridge.isAiEnabled) {
                    document.getElementById('gen-val').innerText = window.aiBridge.getGen();
                    document.getElementById('alive-val').innerText = window.aiBridge.getAlive();
                    
                    if (allDead) {
                        window.aiBridge.nextGen(); // Tell Python to evolve
                        resetPipes();
                        // Reset birds for next generation
                        birds.forEach(b => { 
                            b.dead = false; 
                            b.y = canvas.height/2; 
                            b.velocity = 0; 
                        });
                    }
                } else if (allDead) {
                    // Manual mode behavior
                    currentState = gameState.game_over;
                }
                break;

            case gameState.game_over:
                const deadBird = birds[0];
                getPipes().forEach(pipe => drawPipe(ctx, pipe, canvas.height));

                // Make bird fall until it hits the floor
                if (deadBird.y + deadBird.height / 2 < canvas.height) {
                    deadBird.update();
                }

                // 2. Draw the bird (it might still be falling or rotating)
                deadBird.draw(ctx);
                
                // 3. Handle the UI animations
                if (gameOverScreenXOffset > gameOverScreenTargetOffset) {
                    gameOverScreenXOffset -= gameOverScreenSpeed;
                }
                gameOverFloatOffset = Math.sin(Date.now() * gameOverFloatSpeed) * gameOverFloatAmplitude;

                drawGameOverScreen(); 
                drawHitboxes(ctx, deadBird);
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
const gravitySlider = document.getElementById('gravity-slider');
const gravityVal = document.getElementById('gravity-val');

if (gravitySlider) {
    gravitySlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        // Update the global config
        window.gameConfig.gravity = val; 
        // Update the UI text
        if (gravityVal) gravityVal.innerText = val.toFixed(3);
        console.log("New Gravity:", window.gameConfig.gravity);
    });
}