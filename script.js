// script.js (module)

// Firebase imports (v9+ modular via CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
    getDatabase,
    ref,
    set,
    push,
    onValue,
    remove
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// --- Firebase config from your screenshot ---
const firebaseConfig = {
    apiKey: "AIzaSyDkFGExSNcK4E9PfEUZ7kWm7LsMb07uRrM",
    authDomain: "imposter-b6e5d.firebaseapp.com",
    projectId: "imposter-b6e5d",
    storageBucket: "imposter-b6e5d.appspot.com",
    messagingSenderId: "225144767478",
    appId: "1:225144767478:web:c4e2cca3c8bb58c9d2bdd7",
    measurementId: "G-RCFTXLD2RT"
};

// Initialize Firebase & Realtime Database
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- Word packs ---
const words = {
    "Animals": ["Lion", "Shark", "Eagle", "Giraffe", "Penguin", "Kangaroo", "Octopus"],
    "Video Games": ["Minecraft", "Fortnite", "Mario", "Zelda", "Halo", "Roblox", "Overwatch"],
    "Items": ["Backpack", "Laptop", "Water Bottle", "Headphones", "Flashlight", "Notebook", "Sunglasses"],
    "People": ["Teacher", "Doctor", "Athlete", "Chef", "Actor", "Pilot", "Streamer"],
    "Controversial": ["Pineapple Pizza", "NFTs", "AI Art", "Cancel Culture", "TikTok Ban", "Spoiler Culture"],
    "Pop Culture": ["Taylor Swift", "Marvel", "Star Wars", "Barbie", "Drake", "Stranger Things", "K‑Pop"]
};

// --- Party state ---
let roomCode = null;
let isHost = false;
let playerId = null;
let playersInRoom = []; // { id, name, isHost }

// --- Local game state (pass-the-device) ---
let secretWord = "";
let imposterIndex = -1;
let currentIndex = 0;

// DOM helpers
function $(id) {
    return document.getElementById(id);
}

// Show/hide screens
function showScreen(screenId) {
    ["partySetup", "lobby", "reveal", "voting"].forEach(id => {
        const el = $(id);
        if (!el) return;
        if (id === screenId) {
            el.classList.remove("hidden");
        } else {
            el.classList.add("hidden");
        }
    });
}

// --- ROOM CREATION / JOINING ---

window.createRoom = async function createRoom() {
    const name = $("hostNameInput").value.trim();
    const errorEl = $("joinError");
    errorEl.textContent = "";

    if (!name) {
        alert("Enter your name to host a game.");
        return;
    }

    // 4-digit room code
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    // Create room skeleton
    const roomRef = ref(db, `rooms/${code}`);
    await set(roomRef, {
        createdAt: Date.now()
    });

    // Add host as first player
    const playersRef = ref(db, `rooms/${code}/players`);
    const newPlayerRef = push(playersRef);
    await set(newPlayerRef, {
        name: name,
        isHost: true
    });

    roomCode = code;
    playerId = newPlayerRef.key;
    isHost = true;

    localStorage.setItem("roomCode", roomCode);
    localStorage.setItem("playerId", playerId);
    localStorage.setItem("isHost", "true");

    $("hostRoomCode").textContent = `Room Code: ${roomCode}`;
    $("hostRoomCode").classList.remove("hidden");

    attachLobbyListeners();
    showScreen("lobby");
    $("roomCodeDisplay").textContent = roomCode;
};

window.joinRoom = async function joinRoom() {
    const code = $("joinCodeInput").value.trim();
    const name = $("joinNameInput").value.trim();
    const errorEl = $("joinError");
    errorEl.textContent = "";

    if (!code || !name) {
        errorEl.textContent = "Enter both room code and your name.";
        return;
    }

    // Add player to that room's players list
    const playersRef = ref(db, `rooms/${code}/players`);
    const newPlayerRef = push(playersRef);

    try {
        await set(newPlayerRef, {
            name: name,
            isHost: false
        });
    } catch (e) {
        errorEl.textContent = "Could not join room. Check the code.";
        return;
    }

    roomCode = code;
    playerId = newPlayerRef.key;
    isHost = false;

    localStorage.setItem("roomCode", roomCode);
    localStorage.setItem("playerId", playerId);
    localStorage.setItem("isHost", "false");

    attachLobbyListeners();
    showScreen("lobby");
    $("roomCodeDisplay").textContent = roomCode;
};

// Leave room
window.leaveRoom = async function leaveRoom() {
    if (roomCode && playerId) {
        const playerRef = ref(db, `rooms/${roomCode}/players/${playerId}`);
        await remove(playerRef);
    }

    roomCode = null;
    playerId = null;
    isHost = false;
    playersInRoom = [];

    localStorage.removeItem("roomCode");
    localStorage.removeItem("playerId");
    localStorage.removeItem("isHost");

    showScreen("partySetup");
};

// Attach lobby listeners for players list
function attachLobbyListeners() {
    if (!roomCode) return;

    const playersRef = ref(db, `rooms/${roomCode}/players`);
    onValue(playersRef, snapshot => {
        const val = snapshot.val() || {};
        const listEl = $("playerList");
        listEl.innerHTML = "";

        playersInRoom = Object.keys(val).map(id => ({
            id,
            name: val[id].name,
            isHost: !!val[id].isHost
        }));

        playersInRoom.forEach(p => {
            const row = document.createElement("div");
            row.className = "player-row";

            const nameSpan = document.createElement("span");
            nameSpan.textContent = p.name;

            row.appendChild(nameSpan);

            if (p.isHost) {
                const hostTag = document.createElement("span");
                hostTag.className = "host-tag";
                hostTag.textContent = "HOST";
                row.appendChild(hostTag);
            }

            listEl.appendChild(row);
        });

        // Host-only UI
        const startBtn = $("startGameBtn");
        if (isHost) {
            startBtn.style.display = "block";
        } else {
            startBtn.style.display = "none";
        }
    });
}

// Restore session from localStorage on reload (optional small convenience)
(function restoreSession() {
    const storedCode = localStorage.getItem("roomCode");
    const storedId = localStorage.getItem("playerId");
    const storedHost = localStorage.getItem("isHost");

    if (storedCode && storedId && storedHost !== null) {
        roomCode = storedCode;
        playerId = storedId;
        isHost = storedHost === "true";
        attachLobbyListeners();
        showScreen("lobby");
        $("roomCodeDisplay").textContent = roomCode;
    } else {
        showScreen("partySetup");
    }
})();

// --- GAME LOGIC (LOCAL / PASS-THE-DEVICE) ---

window.hostStartGame = function hostStartGame() {
    if (!isHost) {
        alert("Only the host can start the game.");
        return;
    }
    if (!playersInRoom.length) {
        alert("At least 3 players are recommended.");
        return;
    }

    const category = $("categorySelect").value;
    const pool = words[category];
    if (!pool || !pool.length) {
        alert("No words found for this category.");
        return;
    }

    secretWord = pool[Math.floor(Math.random() * pool.length)];
    imposterIndex = Math.floor(Math.random() * playersInRoom.length);
    currentIndex = 0;

    // Start reveal phase on host device
    startRevealPhase();
};

function startRevealPhase() {
    if (!playersInRoom.length) return;

    showScreen("reveal");
    resetCard();
    updatePlayerLabel();
}

function updatePlayerLabel() {
    const player = playersInRoom[currentIndex];
    $("playerLabel").innerText = `Secret for: ${player.name}`;
}

window.flipCard = function flipCard() {
    const flipCardEl = $("revealCard");
    const wordDisplay = $("wordDisplay");
    const nextBtn = $("nextBtn");
    const revealBtn = $("revealBtn");

    if (!flipCardEl.classList.contains("flipped")) {
        const isImposter = currentIndex === imposterIndex;

        if (isImposter) {
            wordDisplay.textContent = "❓ You are the IMPOSTER!";
        } else {
            wordDisplay.textContent = `Word: ${secretWord}`;
        }

        flipCardEl.classList.add("flipped");
        revealBtn.classList.add("hidden");
        nextBtn.classList.remove("hidden");
    }
};

function resetCard() {
    const flipCardEl = $("revealCard");
    const wordDisplay = $("wordDisplay");
    const nextBtn = $("nextBtn");
    const revealBtn = $("revealBtn");

    flipCardEl.classList.remove("flipped");
    wordDisplay.textContent = "";
    nextBtn.classList.add("hidden");
    revealBtn.classList.remove("hidden");
}

window.nextPlayer = function nextPlayer() {
    currentIndex++;

    if (currentIndex >= playersInRoom.length) {
        // All players have seen card -> go to voting
        startVoting();
        return;
    }

    resetCard();
    updatePlayerLabel();
};

function startVoting() {
    showScreen("voting");
    const voteList = $("voteList");
    voteList.innerHTML = "";

    playersInRoom.forEach((p, index) => {
        const btn = document.createElement("button");
        btn.className = "vote-btn";
        btn.textContent = p.name;
        btn.onclick = () => revealImposter(index);
        voteList.appendChild(btn);
    });
}

function revealImposter(votedIndex) {
    const imposterPlayer = playersInRoom[imposterIndex];

    if (votedIndex === imposterIndex) {
        alert(`Correct! ${imposterPlayer.name} was the imposter.`);
    } else {
        alert(`Wrong! ${imposterPlayer.name} was the imposter.`);
    }
}

window.backToLobby = function backToLobby() {
    showScreen("lobby");
};
