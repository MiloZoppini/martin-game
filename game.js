// Elementi DOM essenziali
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
const speed = 5;
let playerSpeed = speed;
let playerDirection = 'right';
let isMoving = false;
let isGameRunning = false;
let isInvulnerable = false;
let isTouchDevice = false;
let isSuperMode = false; // Stato modalità super
let superModeTimer = null; // Timer per la modalità super
let lastMillion = 0; // Per tenere traccia dell'ultimo milione raggiunto

const powerUpTypes = {
  SPEED: {
    name: 'speed',
    cost: 25000,
    duration: 10000,
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#FF5722" d="M13.75 9L10 2L6.25 9H8.5V13H11.5V9H13.75M12 14C8.69 14 6 16.69 6 20H18C18 16.69 15.31 14 12 14Z"/></svg>'
  },
  SHIELD: {
    name: 'shield',
    cost: 35000,
    duration: 8000,
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#2196F3" d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z"/></svg>'
  },
  MAGNET: {
    name: 'magnet',
    cost: 45000,
    duration: 12000,
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#F44336" d="M3,7V13A9,9 0 0,0 12,22A9,9 0 0,0 21,13V7H17V13A5,5 0 0,1 12,18A5,5 0 0,1 7,13V7M17,5H21V2H3V5H7V2H17V5Z"/></svg>'
  }
};

// Rileva se il dispositivo è touch
function detectTouchDevice() {
    isTouchDevice = ('ontouchstart' in window) || 
                   (navigator.maxTouchPoints > 0) || 
                   (navigator.msMaxTouchPoints > 0);
    console.log("Dispositivo touch:", isTouchDevice);
}

// Aggiungi questa variabile in cima al file, dopo le altre variabili
const DEBUG_MODE = false; // Imposta a true per visualizzare la hitbox

// Crea l'elemento della hitbox se in debug mode
let hitboxElement = null;
if (DEBUG_MODE) {
  hitboxElement = document.createElement("div");
  hitboxElement.style.position = "absolute";
  hitboxElement.style.border = "2px solid red";
  hitboxElement.style.backgroundColor = "rgba(255, 0, 0, 0.2)";
  hitboxElement.style.zIndex = "15";
  hitboxElement.style.pointerEvents = "none";
  gameArea.appendChild(hitboxElement);
}

// Funzione per iniziare la modalità super
function startSuperMode() {
  isSuperMode = true;
  isInvulnerable = true;
  playerSpeed = speed * 2; // Raddoppia la velocità
  
  // Cambia l'immagine del player
  player.style.backgroundImage = "url('images/MuscleMartin.png')";
  
  // Crea l'effetto tremolio
  startScreenShake();
  
  // Imposta il timer per terminare la modalità super
  if (superModeTimer) clearTimeout(superModeTimer);
  superModeTimer = setTimeout(() => {
    endSuperMode();
  }, 10000); // 10 secondi
  
  // Visualizza un timer sullo schermo
  showSuperModeTimer(10);
}

// Funzione per terminare la modalità super
function endSuperMode() {
  isSuperMode = false;
  isInvulnerable = false;
  playerSpeed = speed; // Torna alla velocità normale
  
  // Reimposta l'immagine del player
  player.style.backgroundImage = "url('images/Martin.png')";
  
  // Interrompi l'effetto tremolio
  stopScreenShake();
  
  // Rimuovi il timer sullo schermo
  removeSuperModeTimer();
}

// Funzione per creare l'effetto tremolio
function startScreenShake() {
  if (!gameArea.shakeInterval) {
    gameArea.shakeInterval = setInterval(() => {
      const xPos = Math.random() * 6 - 3;
      const yPos = Math.random() * 6 - 3;
      gameArea.style.transform = `translate(${xPos}px, ${yPos}px)`;
    }, 50);
  }
}

// Funzione per interrompere l'effetto tremolio
function stopScreenShake() {
  if (gameArea.shakeInterval) {
    clearInterval(gameArea.shakeInterval);
    gameArea.shakeInterval = null;
    gameArea.style.transform = 'translate(0, 0)';
  }
}

// Funzione per mostrare il timer della modalità super
function showSuperModeTimer(seconds) {
  removeSuperModeTimer(); // Rimuovi timer esistenti
  
  const timerElement = document.createElement("div");
  timerElement.id = "superModeTimer";
  timerElement.style.position = "absolute";
  timerElement.style.top = "60px";
  timerElement.style.left = "50%";
  timerElement.style.transform = "translateX(-50%)";
  timerElement.style.backgroundColor = "rgba(255, 255, 0, 0.7)";
  timerElement.style.color = "#CC0000";
  timerElement.style.padding = "5px 15px";
  timerElement.style.borderRadius = "20px";
  timerElement.style.fontWeight = "bold";
  timerElement.style.fontSize = "20px";
  timerElement.style.zIndex = "50";
  timerElement.textContent = `SUPER: ${seconds}s`;
  gameArea.appendChild(timerElement);
  
  // Aggiorna il timer ogni secondo
  let timeLeft = seconds;
  const countdownInterval = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      clearInterval(countdownInterval);
      return;
    }
    if (document.getElementById("superModeTimer")) {
      document.getElementById("superModeTimer").textContent = `SUPER: ${timeLeft}s`;
    }
  }, 1000);
}

// Funzione per rimuovere il timer della modalità super
function removeSuperModeTimer() {
  const existingTimer = document.getElementById("superModeTimer");
  if (existingTimer) {
    existingTimer.remove();
  }
}

// Costanti per il gioco
const COLLECTIBLE_SPAWN_RATE = 2000; // Ogni 2 secondi
const OBSTACLE_SPAWN_RATE = 3000;    // Ogni 3 secondi
const FALL_SPEED = 3;
let collectibleInterval = null;
let obstacleInterval = null;
let gameItems = [];

// Funzione per avviare il gioco
function startGame() {
    console.log("Avvio del gioco...");
    menuScreen.style.display = "none";
    gameArea.style.display = "block";
    
    // Resetta il gioco
    score = 0;
    lives = 3;
    isGameRunning = true;
    gameItems = [];
    
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
    // Ferma eventuali interval precedenti
    if (collectibleInterval) clearInterval(collectibleInterval);
    if (obstacleInterval) clearInterval(obstacleInterval);
    
    // Avvia lo spawn di collezionabili
    collectibleInterval = setInterval(() => {
        if (isGameRunning) spawnCollectible();
    }, COLLECTIBLE_SPAWN_RATE);
    
    // Avvia lo spawn di ostacoli
    obstacleInterval = setInterval(() => {
        if (isGameRunning) spawnObstacle();
    }, OBSTACLE_SPAWN_RATE);
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

// Aggiorna il loop di gioco per includere gli items
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
        
        // Aggiorna la posizione del giocatore
        movePlayer();
        
        // Aggiorna gli items
        updateItems();
        
        // Continua il loop
        animationFrame = requestAnimationFrame(gameLoop);
    }
    
    animationFrame = requestAnimationFrame(gameLoop);
}

function updateItems() {
    const itemsToRemove = [];
    
    gameItems.forEach((item, index) => {
        // Aggiorna posizione
        item.y += FALL_SPEED;
        item.element.style.top = item.y + 'px';
        
        // Controlla collisioni
        if (checkCollision(item)) {
            if (item.type === 'collectible') {
                score += 10;
                updateScore();
                playCollectSound();
            } else if (item.type === 'obstacle') {
                lives--;
                updateLives();
                showDamageAnimation();
                if (lives <= 0) {
                    gameOver();
                }
            }
            itemsToRemove.push(index);
        }
        
        // Rimuovi se fuori schermo
        if (item.y > window.innerHeight) {
            itemsToRemove.push(index);
        }
    });
    
    // Rimuovi gli items
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

function gameOver() {
    isGameRunning = false;
    if (collectibleInterval) clearInterval(collectibleInterval);
    if (obstacleInterval) clearInterval(obstacleInterval);
    
    // Rimuovi tutti gli items
    gameItems.forEach(item => item.element.remove());
    gameItems = [];
    
    // Mostra il menu
    menuScreen.style.display = "flex";
    gameArea.style.display = "none";
}

function playCollectSound() {
    // Implementa il suono di raccolta se necessario
}

// Funzioni di utility
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

// Setup controlli touch
function setupMovementControls() {
    if (!moveLeftButton || !moveRightButton) return;
    
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

// Gestione eventi tastiera
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

// Inizializzazione all'avvio
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM caricato, inizializzazione gioco...");
    
    // Rileva se il dispositivo è touch
    detectTouchDevice();
    
    // Verifica elementi essenziali
    if (!menuScreen || !gameArea || !playButton) {
        console.error("Elementi essenziali mancanti:", {
            menuScreen: !!menuScreen,
            gameArea: !!gameArea,
            playButton: !!playButton
        });
        return;
    }
    
    console.log("Elementi essenziali trovati, configurazione pulsante play...");
    
    // Setup pulsante play (sia click che touch)
    playButton.onclick = startGame;
    
    if (isTouchDevice) {
        // Aggiungi gestione touch
        playButton.addEventListener("touchstart", function(e) {
            console.log("Touch rilevato sul pulsante play");
            e.preventDefault();
            startGame();
        });
    }
    
    // Setup controlli movimento
    setupMovementControls();
    
    // Mostra menu iniziale
    menuScreen.style.display = "flex";
    gameArea.style.display = "none";
    
    console.log("Inizializzazione completata");
});

// Funzione per attivare l'animazione di danno
function damageAnimation() {
  isInvulnerable = true;
  
  // Aggiungi classe di animazione danno
  player.classList.add("damage-animation");
  
  // Imposta un timer di lampeggiamento
  let blinkCount = 0;
  const blinkInterval = setInterval(() => {
    player.style.opacity = player.style.opacity === "0.3" ? "1" : "0.3";
    blinkCount++;
    
    if (blinkCount >= 10) {
      clearInterval(blinkInterval);
      player.style.opacity = "1";
      player.classList.remove("damage-animation");
      isInvulnerable = false;
    }
  }, 150);
}

// Aggiungi elementi da ufficio allo sfondo
function createOfficeItems() {
  const items = [
    {
      type: 'scrivania',
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#8B4513"><rect x="2" y="12" width="20" height="2"/><rect x="4" y="14" width="2" height="8"/><rect x="18" y="14" width="2" height="8"/></svg>'
    },
    {
      type: 'computer',
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#333"><rect x="5" y="6" width="14" height="10" rx="1"/><rect x="8" y="16" width="8" height="2"/><rect x="10" y="18" width="4" height="1"/></svg>'
    },
    {
      type: 'pianta',
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="9" y="15" width="6" height="6" fill="#8B4513"/><path d="M12,3 C16,5 18,8 15,15 M12,3 C8,5 6,8 9,15" stroke="#008800" stroke-width="2" fill="none"/></svg>'
    },
    {
      type: 'lampada',
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#666"><path d="M8,21 L16,21 L16,19 L8,19 Z M9,19 L15,19 L15,16 L9,16 Z M7,16 L17,16 C17,11 14,8 12,8 C10,8 7,11 7,16 Z M11,6 L13,6 L13,8 L11,8 Z"/></svg>'
    }
  ];

  const itemCount = 15;
  for (let i = 0; i < itemCount; i++) {
    const item = document.createElement("div");
    item.classList.add("office-item");
    
    // Dimensione casuale per gli elementi
    const size = Math.random() * 50 + 30;
    item.style.width = `${size}px`;
    item.style.height = `${size}px`;
    
    // Posizione casuale
    item.style.left = `${Math.random() * 100}%`;
    item.style.top = `${Math.random() * 100}%`;
    
    // Scegli un elemento casuale dall'ufficio
    const randomItem = items[Math.floor(Math.random() * items.length)];
    item.style.backgroundImage = `url('data:image/svg+xml;charset=UTF-8,${encodeURIComponent(randomItem.svg)}')`;
    
    // Aggiungi una rotazione casuale
    item.style.transform = `rotate(${Math.random() * 20 - 10}deg)`;
    
    gameArea.appendChild(item);
  }
}

// Tipi di denaro raccoglibile
const collectibleTypes = [
  {
    type: "coin",
    value: 1000,
    width: 30,
    height: 30,
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FFD700"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6" fill="#FFA500"/><text x="12" y="16" font-size="8" text-anchor="middle" fill="#FFD700">1€</text></svg>',
    animation: "coin-anim-1",
    speed: 4
  },
  {
    type: "banknote",
    value: 10000,
    width: 40,
    height: 20,
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#00FF00"><rect x="4" y="2" width="16" height="20" rx="2"/><text x="12" y="14" font-size="8" text-anchor="middle" fill="#006400">10€</text></svg>',
    animation: "coin-anim-2",
    speed: 5
  },
  {
    type: "moneybag",
    value: 25000,
    width: 40,
    height: 40,
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FFD700"><path d="M12,2C6.48,2 2,6.48 2,12s4.48,10 10,10 10,-4.48 10,-10S17.52,2 12,2zM12,20c-4.41,0 -8,-3.59 -8,-8s3.59,-8 8,-8 8,3.59 8,8 -3.59,8 -8,8z"/><text x="12" y="16" font-size="8" text-anchor="middle" fill="#FFD700">25€</text></svg>',
    animation: "coin-anim-3",
    speed: 6
  },
  {
    type: "package",
    value: 50000,
    width: 50,
    height: 50,
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FFA500"><rect x="4" y="4" width="16" height="16" rx="2"/><text x="12" y="16" font-size="10" text-anchor="middle" fill="#FFFFFF">50€</text></svg>',
    animation: "coin-anim-4",
    speed: 7
  },
  {
    type: "bigbag",
    value: 100000,
    width: 60,
    height: 60,
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FFD700"><path d="M12,2C6.48,2 2,6.48 2,12s4.48,10 10,10 10,-4.48 10,-10S17.52,2 12,2zM12,20c-4.41,0 -8,-3.59 -8,-8s3.59,-8 8,-8 8,3.59 8,8 -3.59,8 -8,8z"/><text x="12" y="16" font-size="12" text-anchor="middle" fill="#FFD700">100€</text></svg>',
    animation: "coin-anim-5",
    speed: 8
  },
  {
    type: "god",
    value: 500000,
    width: 80,
    height: 80,
    imgSrc: "images/God.png",
    animation: "god-anim",
    speed: 9
  }
];

// Funzione per gestire le collisioni in modo più preciso
function checkCollision(playerX, objectX, objectWidth) {
  // Dimensioni reali del personaggio (più piccole dell'immagine)
  const playerWidth = 50; // Larghezza effettiva del personaggio
  const playerHeight = 50; // Altezza effettiva del personaggio (ridotta da 150 a 100)
  const playerCenterOffset = 40; // Distanza dal bordo sinistro al centro del personaggio
  
  // Calcola i bordi effettivi del player
  const playerLeft = playerX + playerCenterOffset;
  const playerRight = playerLeft + playerWidth;
  const playerTop = 450; // Aggiornato per matchare la nuova zona di collisione
  const playerBottom = playerTop + playerHeight;
  
  // Bordi dell'oggetto
  const objectLeft = objectX;
  const objectRight = objectX + objectWidth;
  
  // Verifica se c'è una sovrapposizione orizzontale
  return objectRight > playerLeft && objectLeft < playerRight;
}

function spawnCollectible() {
  // Scegli un tipo di collezionabile casuale
  const collectibleIndex = getRandomWeightedIndex();
  const collectibleType = collectibleTypes[collectibleIndex];
  
  // Crea l'elemento
  const collectible = document.createElement("div");
  collectible.classList.add('collectible');
  collectible.classList.add(collectibleType.animation);
  
  // Imposta dimensioni e grafica
  collectible.style.width = collectibleType.width + 'px';
  collectible.style.height = collectibleType.height + 'px';
  
  // Usa l'immagine o l'SVG a seconda del tipo
  if (collectibleType.imgSrc) {
    collectible.style.backgroundImage = `url('${collectibleType.imgSrc}')`;
  } else {
    collectible.style.backgroundImage = `url('data:image/svg+xml;charset=UTF-8,${encodeURIComponent(collectibleType.svg)}')`;
  }
  
  // Posiziona l'elemento
  const x = Math.floor(Math.random() * (800 - collectibleType.width));
  collectible.style.left = x + "px";
  gameArea.appendChild(collectible);

  // Aggiungi dati del collezionabile
  collectible.dataset.value = collectibleType.value;
  collectible.dataset.type = collectibleType.type;

  let y = 0;
  const fall = setInterval(() => {
    if (!isGameRunning) {
      clearInterval(fall);
      collectible.remove();
      return;
    }
    
    y += collectibleType.speed;
    collectible.style.top = y + "px";

    if (y > 450 && y < 500 && checkCollision(playerX, x, collectibleType.width)) {
      score += collectibleType.value;
      updateScore();
      
      let colorEffect = "#00AA00";
      let textEffect = `+${formatNumber(collectibleType.value)}€`;
      
      if (collectibleType.value >= 50000 && collectibleType.value < 500000) {
        colorEffect = "#FFD700";
      } else if (collectibleType.value >= 500000) {
        colorEffect = "#FF00FF";
        textEffect = `+${formatNumber(collectibleType.value)}€ DIVINO!`;
        showDivineEffect();
      }
      
      createParticleEffect(x + collectibleType.width/2, y, colorEffect, textEffect);
      clearInterval(fall);
      collectible.remove();
      
      scoreDisplay.style.transform = "scale(1.2)";
      setTimeout(() => {
        scoreDisplay.style.transform = "scale(1)";
      }, 200);
    }

    if (y > 500) {
      clearInterval(fall);
      collectible.remove();
    }
  }, 20);

  setTimeout(spawnCollectible, Math.random() * 800 + 400);
}

// Funzione per ottenere un indice pesato (gli oggetti più rari hanno meno probabilità)
function getRandomWeightedIndex() {
  const weights = [50, 30, 5, 10, 4, 1]; // Probabilità relative: moneta, banconota, pacco, sacco, sacco grande, god
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < weights.length; i++) {
    if (random < weights[i]) {
      return i;
    }
    random -= weights[i];
  }
  
  return 0; // default alla moneta
}

function createParticleEffect(x, y, color, text) {
  const particleCount = 6;
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    particle.style.position = "absolute";
    particle.style.width = "12px";
    particle.style.height = "12px";
    particle.style.backgroundColor = color;
    particle.style.left = x + "px";
    particle.style.top = y + "px";
    particle.style.borderRadius = "50%";
    particle.style.pointerEvents = "none";
    
    if (i === 0 && text) {
      particle.style.backgroundColor = "transparent";
      particle.style.color = color;
      particle.style.fontSize = "18px";
      particle.style.fontWeight = "bold";
      // Formatta il numero nel testo
      const value = parseInt(text.replace(/[^0-9]/g, ''));
      if (!isNaN(value)) {
        text = text.replace(value.toString(), formatNumber(value));
      }
      particle.textContent = text;
      particle.style.width = "auto";
      particle.style.height = "auto";
    }
    
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    let opacity = 1;
    
    gameArea.appendChild(particle);
    
    const animateParticle = () => {
      const currentX = parseFloat(particle.style.left);
      const currentY = parseFloat(particle.style.top);
      
      particle.style.left = (currentX + vx) + "px";
      particle.style.top = (currentY + vy - 1) + "px";
      opacity -= 0.05;
      
      particle.style.opacity = opacity;
      
      if (opacity > 0) {
        requestAnimationFrame(animateParticle);
      } else {
        gameArea.removeChild(particle);
      }
    };
    
    requestAnimationFrame(animateParticle);
  }
}

function spawnObstacle() {
  if (!isGameRunning) return;
  
  const obstacle = document.createElement("div");
  obstacle.classList.add("obstacle");
  const x = Math.floor(Math.random() * 760);
  obstacle.style.left = x + "px";
  gameArea.appendChild(obstacle);

  let y = 0;
  const fall = setInterval(() => {
    if (!isGameRunning) {
      clearInterval(fall);
      obstacle.remove();
      return;
    }
    
    y += 8; // più veloce delle monete
    obstacle.style.top = y + "px";

    // Usa la funzione di collisione migliorata
    if (y > 450 && y < 500 && checkCollision(playerX, x, 40) && !isInvulnerable) {
      // Riduci una vita
      lives--;
      updateLives();
      
      // Crea effetto particellare
      createParticleEffect(playerX + 80, 350, "#CC0000", "!");
      
      if (lives <= 0) {
        // Game over
        clearInterval(fall);
        obstacle.remove();
        
        // Interrompi eventuali effetti della modalità super
        if (isSuperMode) {
          endSuperMode();
        }
        
        let shakeCount = 0;
        const shakeEffect = setInterval(() => {
          gameArea.style.transform = shakeCount % 2 === 0 
            ? 'translateX(5px)' 
            : 'translateX(-5px)';
          shakeCount++;
          if (shakeCount > 10) {
            clearInterval(shakeEffect);
            gameArea.style.transform = 'translateX(0)';
            
            setTimeout(() => {
              isGameRunning = false;
              alert("Game Over! Hai raccolto: " + formatNumber(score) + "€");
              
              // Torna al menu iniziale
              gameArea.style.display = "none";
              menuScreen.style.display = "flex";
            }, 100);
          }
        }, 50);
      } else {
        // Attiva l'animazione di danno
        damageAnimation();
        
        // Rimuovi l'ostacolo
        clearInterval(fall);
        obstacle.remove();
      }
    } else if (y > 450 && y < 500 && checkCollision(playerX, x, 40) && isSuperMode) {
      // In modalità super, distruggi l'ostacolo senza subire danni
      createParticleEffect(x + 20, y, "#FFFF00", "CRUSH!");
      clearInterval(fall);
      obstacle.remove();
    }

    if (y > 500) {
      clearInterval(fall);
      obstacle.remove();
    }
  }, 20);

  if (isGameRunning) {
  setTimeout(spawnObstacle, Math.random() * 1 + 300);
}
}

// Funzione per mostrare un effetto divino quando si raccoglie God
function showDivineEffect() {
  // Crea un overlay divino
  const divineOverlay = document.createElement("div");
  divineOverlay.classList.add("divine-effect");
  gameArea.appendChild(divineOverlay);
  
  // Rimuovi dopo un po'
  setTimeout(() => {
    divineOverlay.classList.add("fade-out");
    setTimeout(() => {
      divineOverlay.remove();
    }, 1000);
  }, 1000);
}

// Funzione per spawnare il powerup
function spawnPowerup() {
  if (!isGameRunning) return;
  
  // Crea il powerup del limone
  const powerup = document.createElement("div");
  powerup.classList.add("powerup");
  powerup.classList.add("lemon-powerup");
  
  // Dimensioni del powerup
  const width = 50;
  const height = 50;
  powerup.style.width = width + 'px';
  powerup.style.height = height + 'px';
  
  // Posiziona l'elemento
  const x = Math.floor(Math.random() * (800 - width));
  powerup.style.left = x + "px";
  gameArea.appendChild(powerup);
  
  let y = 0;
  const fall = setInterval(() => {
    if (!isGameRunning) {
      clearInterval(fall);
      powerup.remove();
      return;
    }
    
    y += 6; // Velocità di caduta media
    powerup.style.top = y + "px";
    
    // Controlla collisione con il giocatore
    if (y > 450 && y < 500 && checkCollision(playerX, x, width)) {
      // Attiva la modalità super
      startSuperMode();
      
      // Effetto visuale per il powerup raccolto
      createParticleEffect(x + width/2, y, "#FFFF00", "SUPER LIMONE!");
      
      clearInterval(fall);
      powerup.remove();
    }
    
    if (y > 500) {
      clearInterval(fall);
      powerup.remove();
    }
  }, 20);
  
  // Spawna un nuovo powerup dopo un lungo tempo casuale (più raro dei collezionabili)
  setTimeout(spawnPowerup, Math.random() * 20000 + 15000); // Tra 15 e 35 secondi
}

// Funzione per aggiornare lo stato del bottone delle vite extra
function updateExtraLivesButton() {
  if (extraLivesAvailable > 0) {
    extraLivesButton.classList.remove('disabled');
    extraLivesButton.title = `Aggiungi una vita extra (${extraLivesAvailable} rimanenti)`;
  } else {
    extraLivesButton.classList.add('disabled');
    extraLivesButton.title = "Nessuna vita extra disponibile";
  }
}

// Funzione per aggiungere una vita extra
function addExtraLife() {
  if (extraLivesAvailable > 0 && lives < 5) { // Massimo 5 vite
    lives++;
    extraLivesAvailable--;
    updateLives();
    updateExtraLivesButton();
    
    // Effetto visivo
    createParticleEffect(750, 300, "#ff6b6b", "❤️");
    
    // Effetto sonoro (se disponibile)
    const audio = new Audio('sounds/extra-life.mp3');
    audio.play().catch(() => {}); // Ignora errori se il file non esiste
  }
}

// Aggiungi event listener per il bottone delle vite extra
extraLivesButton.addEventListener('click', addExtraLife);

// Funzione per controllare se il punteggio ha raggiunto un nuovo milione
function checkShopAvailability() {
  const currentMillion = Math.floor(score / 1000000);
  if (currentMillion > lastMillion) {
    lastMillion = currentMillion;
    showShop();
  }
}

// Funzione per mostrare lo shop
function showShop() {
  shop.classList.add('visible');
}

// Funzione per nascondere lo shop
function hideShop() {
  shop.classList.remove('visible');
}

// Funzione per aprire lo shop overlay
function openShopOverlay() {
  shopOverlay.classList.add('visible');
  isGameRunning = false; // Pausa il gioco solo quando si apre l'overlay
  
  // Ferma il loop di animazione
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }
}

// Funzione per chiudere lo shop overlay
function closeShopOverlay() {
  shopOverlay.classList.remove('visible');
  isGameRunning = true;
  keysPressed.left = false;
  keysPressed.right = false;
  isMoving = false;
  updatePlayerAnimation();
  
  // Riavvia il loop di animazione
  if (!animationFrame) {
    startGameLoop();
  }
}

// Funzione per acquistare un item
function purchaseItem(itemType) {
  const prices = {
    speed: 500000,    // Ridotto da 1M a 500K
    shield: 1000000,  // Ridotto da 2M a 1M
    magnet: 1500000   // Ridotto da 3M a 1.5M
  };

  if (score >= prices[itemType]) {
    score -= prices[itemType];
    updateScore();
    
    // Applica l'effetto dell'item
    switch(itemType) {
      case 'speed':
        playerSpeed = speed * 1.5;
        setTimeout(() => {
          playerSpeed = speed;
        }, 30000);
        break;
      case 'shield':
        isInvulnerable = true;
        setTimeout(() => {
          isInvulnerable = false;
        }, 20000);
        break;
      case 'magnet':
        activateMagnet();
        break;
    }

    // Effetto visivo
    createParticleEffect(400, 300, "#4CAF50", "✨");
    
    // Effetto sonoro
    const audio = new Audio('sounds/purchase.mp3');
    audio.play().catch(() => {});

    // Chiudi lo shop e riprendi il gioco
    closeShopOverlay();
    hideShop();
    
    // Riprendi il gioco e riattiva i controlli
    isGameRunning = true;
    
    // Riavvia il loop di animazione
    if (!animationFrame) {
      startGameLoop();
    }
  }
}

// Funzione per attivare l'effetto magnete
function activateMagnet() {
  const magnetDuration = 15000;
  const magnetStrength = 5;
  const magnetInterval = setInterval(() => {
    const collectibles = document.querySelectorAll('.collectible');
    collectibles.forEach(collectible => {
      const collectibleRect = collectible.getBoundingClientRect();
      const playerRect = player.getBoundingClientRect();
      
      const dx = playerRect.left - collectibleRect.left;
      const dy = playerRect.top - collectibleRect.top;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 300) {
        const angle = Math.atan2(dy, dx);
        const x = collectibleRect.left + Math.cos(angle) * magnetStrength;
        const y = collectibleRect.top + Math.sin(angle) * magnetStrength;
        collectible.style.left = x + 'px';
        collectible.style.top = y + 'px';
      }
    });
  }, 16);

  setTimeout(() => {
    clearInterval(magnetInterval);
  }, magnetDuration);
}

// Modifica gli event listener dello shop
shopOverlay.addEventListener('click', (e) => {
  if (e.target === shopOverlay || e.target === closeShopButton) {
    closeShopOverlay();
  }
});

// Correggo l'event listener per il click sugli item dello shop
document.querySelectorAll('.shop-item-card').forEach(card => {
  card.addEventListener('click', function() {
    const itemType = this.dataset.item;
    purchaseItem(itemType);
  });
});

// Funzione per il beta testing
function betaTestAddResources() {
  // Aggiungi 1M di soldi
  score += 1000000;
updateScore();
  
  // Aggiungi vite extra
  extraLivesAvailable += 3;
  updateExtraLivesButton();
  
  // Effetto visivo
  createParticleEffect(750, 50, "#4CAF50", "+1M€ & Vite!");
  
  // Effetto sonoro (se disponibile)
  const audio = new Audio('sounds/coin.mp3');
  audio.play().catch(() => {});
}

// Aggiungi event listener per il bottone di beta testing
betaTestButton.addEventListener('click', betaTestAddResources);

// Avvia il gioco dal menu invece di avviarlo direttamente
initGame();

// Modifica la funzione che crea i power-up nello shop
function createPowerUpButton(type) {
  const button = document.createElement('button');
  button.classList.add('power-up-button');
  
  // Usa SVG invece delle immagini PNG
  const powerUp = powerUpTypes[type];
  button.innerHTML = powerUp.svg + `<span>${formatNumber(powerUp.cost)}€</span>`;
  
  button.onclick = () => purchasePowerUp(type);
  return button;
}

// Funzione per gestire il touch sul pulsante play
function handlePlayTouch(e) {
    console.log("Touch rilevato sul pulsante play");
    e.preventDefault(); // Previeni eventi click duplicati
    startGame();
}
