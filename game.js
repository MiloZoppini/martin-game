// Elementi DOM
const gameArea = document.getElementById("gameArea");
const player = document.getElementById("player");
const dog = document.getElementById("dog");
const scoreDisplay = document.getElementById("score");
const livesDisplay = document.getElementById("lives");
const menuScreen = document.getElementById("menuScreen");
const playButton = document.getElementById("playButton");
const moveLeftButton = document.getElementById("moveLeftButton");
const moveRightButton = document.getElementById("moveRightButton");
const extraLivesButton = document.getElementById("extraLivesButton");
const shop = document.getElementById("shop");
const shopOverlay = document.getElementById("shopOverlay");
const closeShopButton = document.querySelector(".close-shop");
const betaTestButton = document.getElementById("betaTestButton");

// Costanti di gioco
const COLLECTIBLE_SPAWN_RATE = 2000;
const OBSTACLE_SPAWN_RATE = 3000;
const FALL_SPEED = 3;

// Variabili di gioco
let score = 0;
let lives = 3;
let extraLivesAvailable = 3; // Numero di vite extra disponibili
let playerX = 320;
let dogX = playerX - 50;
let keysPressed = {
    left: false,
    right: false
};
let playerSpeed = 5;
let playerDirection = 'right';
let isMoving = false;
let isGameRunning = false;
let isInvulnerable = false;
let isTouchDevice = false;
let isSuperMode = false; // Stato modalità super
let superModeTimer = null; // Timer per la modalità super
let lastMillion = 0; // Per tenere traccia dell'ultimo milione raggiunto
let collectibleInterval = null;
let obstacleInterval = null;
let gameItems = [];
let animationFrame = null;

// Funzione per avviare il gioco
function startGame() {
    console.log("Avvio del gioco...");
    menuScreen.style.display = "none";
    gameArea.style.display = "block";
    
    // Resetta il gioco
    score = 0;
    lives = 3;
    currentLevel = 1;
    gameSpeed = GAME_LEVELS[1].speed;
    isGameRunning = true;
    gameItems = [];
    
    // Avvia la musica di sottofondo
    AUDIO.background.loop = true;
    AUDIO.background.play();
    
    // Inizializza posizione giocatore
    const gameWidth = window.innerWidth;
    playerX = gameWidth / 2 - 80;
    dogX = playerX - 50;
    
    // Posiziona il player e il cane
    if (player) {
        player.style.left = playerX + "px";
        player.style.transform = 'scaleX(1)';
    }
    if (dog) {
        dog.style.left = dogX + "px";
        dog.style.transform = 'scaleX(-1)';
    }
    
    // Aggiorna interfaccia
    updateScore();
    updateLives();
    
    // Avvia il loop di gioco e gli spawn
    startGameLoop();
    startSpawning();
}

function startSpawning() {
    if (collectibleInterval) clearInterval(collectibleInterval);
    if (obstacleInterval) clearInterval(obstacleInterval);
    
    function updateSpawnRates() {
        const level = GAME_LEVELS[currentLevel];
        
        if (collectibleInterval) clearInterval(collectibleInterval);
        if (obstacleInterval) clearInterval(obstacleInterval);
        
        collectibleInterval = setInterval(() => {
            if (isGameRunning) {
                spawnCollectible();
                if (Math.random() < level.powerUpChance) {
                    spawnPowerUp();
                }
            }
        }, level.spawnRate);
        
        obstacleInterval = setInterval(() => {
            if (isGameRunning) spawnObstacle();
        }, level.obstacleRate);
    }
    
    updateSpawnRates();
}

function spawnCollectible() {
    const collectible = document.createElement('div');
    collectible.className = 'collectible';
    const x = Math.random() * (window.innerWidth - 40);
    collectible.style.left = x + 'px';
    collectible.style.top = '0px';
    gameArea.appendChild(collectible);
    
    const item = {
        element: collectible,
        type: 'collectible',
        x: x,
        y: 0
    };
    
    gameItems.push(item);
}

function spawnObstacle() {
    const obstacle = document.createElement('div');
    obstacle.className = 'obstacle';
    const x = Math.random() * (window.innerWidth - 40);
    obstacle.style.left = x + 'px';
    obstacle.style.top = '0px';
    gameArea.appendChild(obstacle);
    
    const item = {
        element: obstacle,
        type: 'obstacle',
        x: x,
        y: 0
    };
    
    gameItems.push(item);
}

function startGameLoop() {
    console.log("Inizializzazione loop di gioco");
    
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
    }
    
    function gameLoop() {
        if (!isGameRunning) {
            cancelAnimationFrame(animationFrame);
            return;
        }
        
        movePlayer();
        updateItems();
        
        animationFrame = requestAnimationFrame(gameLoop);
    }
    
    animationFrame = requestAnimationFrame(gameLoop);
}

function movePlayer() {
    if (!isGameRunning) return;
    
    let moved = false;
    
    if (keysPressed.left && playerX > 0) {
        playerX -= playerSpeed;
        moved = true;
        playerDirection = 'left';
    }
    if (keysPressed.right && playerX < window.innerWidth - 160) {
        playerX += playerSpeed;
        moved = true;
        playerDirection = 'right';
    }
    
    if (moved !== isMoving) {
        isMoving = moved;
        updatePlayerAnimation();
    }
    
    if (player) player.style.left = playerX + "px";
    updateDogPosition();
}

function updateItems() {
    const itemsToRemove = [];
    
    gameItems.forEach((item, index) => {
        item.y += FALL_SPEED;
        item.element.style.top = item.y + 'px';
        
        if (checkCollision(item)) {
            if (item.type === 'collectible') {
                score += 10;
                updateScore();
                createCollectParticles(item.x, item.y);
            } else if (item.type === 'obstacle') {
                lives--;
                updateLives();
                showDamageAnimation();
                if (lives <= 0) {
                    gameOver();
                }
            } else if (item.type === 'powerUp') {
                activatePowerUp(item.powerUpType);
            }
            itemsToRemove.push(index);
        }
        
        if (item.y > window.innerHeight) {
            itemsToRemove.push(index);
        }
    });
    
    itemsToRemove.reverse().forEach(index => {
        const item = gameItems[index];
        item.element.remove();
        gameItems.splice(index, 1);
    });
}

function checkCollision(item) {
    const playerRect = player.getBoundingClientRect();
    const itemRect = item.element.getBoundingClientRect();
    
    return !(playerRect.right < itemRect.left || 
             playerRect.left > itemRect.right || 
             playerRect.bottom < itemRect.top || 
             playerRect.top > itemRect.bottom);
}

function updatePlayerAnimation() {
    if (!player || !dog) return;
    
    if (playerDirection === 'left') {
        player.style.transform = 'scaleX(-1)';
        dog.style.transform = 'scaleX(1)';
    } else {
        player.style.transform = 'scaleX(1)';
        dog.style.transform = 'scaleX(-1)';
    }
}

function updateDogPosition() {
    if (!dog) return;
    
    let targetDogX = playerDirection === 'left' ? 
        playerX + 160 + 20 : // Il cane sta a destra
        playerX - 60;        // Il cane sta a sinistra
    
    targetDogX = Math.max(0, Math.min(window.innerWidth - 40, targetDogX));
    
    dogX = dogX + (targetDogX - dogX) * 0.1;
    dog.style.left = dogX + "px";
}

function createCollectParticles(x, y) {
    for (let i = 0; i < 10; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        
        const angle = (Math.random() * Math.PI * 2);
        const velocity = Math.random() * 5 + 2;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;
        
        gameArea.appendChild(particle);
        
        let frame = 0;
        const animate = () => {
            frame++;
            const newX = x + vx * frame;
            const newY = y + vy * frame + 0.5 * frame * frame;
            particle.style.left = newX + 'px';
            particle.style.top = newY + 'px';
            particle.style.opacity = 1 - frame / 30;
            
            if (frame < 30) {
                requestAnimationFrame(animate);
            } else {
                particle.remove();
            }
        };
        requestAnimationFrame(animate);
    }
}

function showDamageAnimation() {
    player.style.animation = 'damage 0.5s';
    setTimeout(() => player.style.animation = '', 500);
}

function updateScore() {
    if (scoreDisplay) {
        scoreDisplay.textContent = "Score: " + score;
    }
}

function updateLives() {
    if (livesDisplay) {
        let heartsDisplay = "";
        for (let i = 0; i < lives; i++) {
            heartsDisplay += "❤️";
        }
        livesDisplay.textContent = heartsDisplay;
    }
}

function gameOver() {
    isGameRunning = false;
    if (collectibleInterval) clearInterval(collectibleInterval);
    if (obstacleInterval) clearInterval(obstacleInterval);
    
    gameItems.forEach(item => item.element.remove());
    gameItems = [];
    
    menuScreen.style.display = "flex";
    gameArea.style.display = "none";
}

// Setup controlli touch
function setupControls() {
    // Eventi touch per il pulsante sinistro
    moveLeftButton.addEventListener("touchstart", (e) => {
        e.preventDefault();
        keysPressed.left = true;
    });
    
    moveLeftButton.addEventListener("touchend", (e) => {
        e.preventDefault();
        keysPressed.left = false;
    });
    
    // Eventi touch per il pulsante destro
    moveRightButton.addEventListener("touchstart", (e) => {
        e.preventDefault();
        keysPressed.right = true;
    });
    
    moveRightButton.addEventListener("touchend", (e) => {
        e.preventDefault();
        keysPressed.right = false;
    });
    
    // Mouse click per desktop
    moveLeftButton.addEventListener("mousedown", () => {
        keysPressed.left = true;
    });
    
    moveLeftButton.addEventListener("mouseup", () => {
        keysPressed.left = false;
    });
    
    moveRightButton.addEventListener("mousedown", () => {
        keysPressed.right = true;
    });
    
    moveRightButton.addEventListener("mouseup", () => {
        keysPressed.right = false;
    });
}

// Eventi tastiera
document.addEventListener("keydown", (e) => {
    if (e.code === "KeyA" || e.code === "ArrowLeft") {
        keysPressed.left = true;
    }
    if (e.code === "KeyD" || e.code === "ArrowRight") {
        keysPressed.right = true;
    }
});

document.addEventListener("keyup", (e) => {
    if (e.code === "KeyA" || e.code === "ArrowLeft") {
        keysPressed.left = false;
    }
    if (e.code === "KeyD" || e.code === "ArrowRight") {
        keysPressed.right = false;
    }
});

// Inizializzazione
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM caricato, inizializzazione gioco...");
    setupControls();
});
