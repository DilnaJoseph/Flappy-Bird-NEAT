// src/Bird.js

// Define bird properties using a class for better structure
export class Bird {
    constructor(x, y, radius, color, width, height, getCurrentState, gameState, imagePath) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.width = width;
        this.height = height;
        this.velocity = 0; // Initial fall velocity
        this.space = false; // Tracks spacebar state
        this.rotation = 0 // Setting current rotation

        this.getCurrentState = getCurrentState; // Function to get current state
        this.gameState = gameState;

        // Load image asset
        this.image = new Image();
        // NOTE: Paths are relative to index.html when served by the browser
        this.image.src = imagePath; 

        this.dead = false;

        this.setupInputListeners(); // Set up the event listeners
    }

    // Existing function logic is now a class method
    draw(ctx) {
        // We will remove the circle later, but keeping it for now
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();

        // Rotation
        ctx.save();
        ctx.translate(this.x,this.y);
        ctx.rotate(this.rotation);
        
        // Draw the image, centered on bird.x, bird.y
        ctx.drawImage(
            this.image, 
            -this.width / 2, 
            -this.height / 2, 
            this.width, 
            this.height
        );
        ctx.restore();
    }

    // --- NEW: Public method to trigger the immediate flap action ---
    triggerFlapAction() {
        // Only allow flapping when the game is actively playing
        if (this.getCurrentState() === this.gameState.start) {
            this.velocity = -(window.gameConfig.jumpPower); // Strong, immediate jump velocity
        }
    }

    // Setup input listeners (only keydown is needed now)
    setupInputListeners() {
        window.addEventListener('keydown', (event) => {
            if (event.code === 'Space' && this.getCurrentState() !== this.gameState.game_over) {
                // When SPACE is pressed, call the action method
                this.triggerFlapAction();
            }
        });
        
        // Keyup listener and this.space variable are no longer needed.
    }

    // Handles the flap action (setting initial negative velocity)
    flap() {
        window.addEventListener('keydown', (event) => {
            if (event.code === 'Space' && this.getCurrentState() === this.gameState.start) {
                this.space = true;
            }
        });

        window.addEventListener('keyup', (event) => {
            if (event.code === 'Space') {
                this.space = false;
            }
        });
    }

    // Updates position based on velocity and gravity
    update() {
        this.y = this.y + this.velocity;
        
        // Simple gravity: if not the max terminal velocity (2), accelerate towards it
        if (this.velocity < 6) { // Setting a max terminal velocity of 10 for realism
             this.velocity += window.gameConfig.gravity;
        }
        
        // Smooth rotation: flap up tilts -25 degrees, falling tilts +90 degrees
        const maxUpAngle = -25 * Math.PI / 180;
        const maxDownAngle = 90 * Math.PI / 180;

        // Map velocity to angle
        // velocity: -10 → angle ≈ -25°
        // velocity: 0   → angle = 0°
        // velocity: 10  → angle ≈ 90°
        let targetAngle = (this.velocity / 10) * maxDownAngle;

        // Clamp angle between -25° and 90°
        targetAngle = Math.max(maxUpAngle, Math.min(maxDownAngle, targetAngle));

        // Smooth rotation
        const rotationSpeed = 0.1;
        this.rotation += (targetAngle - this.rotation) * rotationSpeed;
    }
}
