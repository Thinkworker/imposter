// ---------------------------------------------------------
// Firebase Imports (Modular v9+)
// ---------------------------------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
    getDatabase,
    ref,
    set,
    push,
    onValue,
    remove
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// ---------------------------------------------------------
// Firebase Config (Your Real Config)
// ---------------------------------------------------------
const firebaseConfig = {
    apiKey: "AIzaSyDkFGExSNcK4E9PfEUZ7kWm7LsMb07uRrM",
    authDomain: "imposter-b6e5d.firebaseapp.com",
    projectId: "imposter-b6e5d",
    storageBucket: "imposter-b6e5d.appspot.com",
    messagingSenderId: "225144767478",
    appId: "1:225144767478:web:c4e2cca3c8bb58c9d2bdd7",
    measurementId: "G-RCFTXLD2RT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ---------------------------------------------------------
// Word Packs
// ---------------------------------------------------------
const words = {
    "Animals": ["Lion", "Shark", "Eagle", "Giraffe", "Penguin", "Kangaroo", "Octopus"],
    "Video Games": ["Minecraft", "Fortnite", "Mario", "Zelda", "Halo", "Roblox", "Overwatch"],
    "Items": ["Backpack", "Laptop", "Water Bottle", "Headphones", "Flashlight", "Notebook", "Sunglasses"],
    "People": ["Teacher", "Doctor", "Athlete", "Chef", "Actor", "Pilot", "Streamer"],
    "Controversial": ["Pineapple Pizza", "NFTs", "AI Art", "Cancel Culture", "TikTok Ban", "Spoiler Culture"],
    "Pop Culture": ["Taylor Swift", "Marvel", "Star Wars", "Barbie", "Drake", "Stranger Things", "K‑Pop"]
};

// ---------------------------------------------------------
// Global State
// ---------------------------------------------------------
let roomCode = null;
let playerId = null;
let isHost = false;
let playersInRoom = [];

let secretWord = "";
let imposterIndex = -1;
let currentIndex = 0;

// ---------------------------------------------------------
// DOM Helper
// ---------------------------------------------------------
function $(id) {
    return document.getElementById(id);
}

// ---------------------------------------------------------
// Screen Switching
// ---------------------------------------------------------
function showScreen(screenId) {
    ["partySetup", "lobby", "reveal", "voting"].forEach(id => {
        const el = $(id);
        if (!el) return;
        el.classList.toggle("hidden", id !== screenId);
    });
}

// ---------------------------------------------------------
// CREATE ROOM
// ---------------------------------------------------------
window.createRoom = async function () {
    const name = $("hostNameInput").value.trim();
    if (!name) return alert("Enter your name.");

    const code = Math.floor(1000 + Math.random() * 9000).toString();

    // Create room
    await set(ref(db, `rooms/${code}`), {
        createdAt: Date.now()
    });

    // Add host as first player
    const newPlayerRef = push(ref(db, `rooms/${code}/players`));
    await set(newPlayerRef, {
        name: name,
        isHost: true
    });

    roomCode = code;
    playerId = newPlayerRef.key;
    isHost = true;

    localStorage.setItem("roomCode", code);
    localStorage.setItem("playerId", playerId);
    localStorage.setItem("isHost", "true");

    $("hostRoomCode").textContent = `Room Code: ${code}`;
    $("hostRoomCode").classList.remove("hidden");

    attachLobbyListeners();
    $("roomCodeDisplay").textContent = code;
    showScreen("lobby");
};

// ---------------------------------------------------------
// JOIN ROOM
// ---------------------------------------------------------
window.joinRoom = async function () {
    const code = $("joinCodeInput").value.trim();
    const name = $("joinNameInput").value.trim();
    const error = $("joinError");

    if (!code || !name) {
        error.textContent = "Enter both code and name.";
        return;
    }

    try {
        const newPlayerRef = push(ref(db, `rooms/${code}/players`));
        await set(newPlayerRef, {
            name: name,
            isHost: false
        });

        roomCode = code;
        playerId = newPlayerRef.key;
        isHost = false;

        localStorage.setItem("roomCode", code);
        localStorage.setItem("playerId", playerId);
        localStorage.setItem("isHost", "false");

        attachLobbyListeners();
        $("roomCodeDisplay").textContent = code;
        showScreen("lobby");

    } catch (e) {
        error.textContent = "Room not found.";
    }
};

// ---------------------------------------------------------
// LEAVE ROOM
// ---------------------------------------------------------
window.leaveRoom = async function () {
    if (roomCode && playerId) {
        await remove(ref(db, `rooms/${roomCode}/players/${playerId}`));
    }

    localStorage.clear();
    roomCode = null;
    playerId = null;
    isHost = false;
    playersInRoom = [];

    showScreen("partySetup");
};

// ---------------------------------------------------------
// LOBBY LISTENERS
// ---------------------------------------------------------
function attachLobbyListeners() {
    if (!roomCode) return;

    const playersRef = ref(db, `rooms/${roomCode}/players`);
    onValue(playersRef, snapshot => {
        const data = snapshot.val() || {};
        playersInRoom = Object.keys(data).map(id => ({
            id,
            name: data[id].name,
            isHost: data[id].isHost
        }));

        const list = $("playerList");
        list.innerHTML = "";

        playersInRoom.forEach(p => {
            const row = document.createElement("div");
            row.className = "player-row";
            row.innerHTML = `
                <span>${p.name}</span>
                ${p.isHost ? '<span class="host-tag">HOST</span>' : ""}
            `;
            list.appendChild(row);
        });
    });
}

// ---------------------------------------------------------
// START GAME (HOST ONLY)
// ---------------------------------------------------------
window.hostStartGame = function () {
    if (!isHost) return alert("Only the host can start the game.");
    if (playersInRoom.length < 3) return alert("At least 3 players recommended.");

    const category = $("categorySelect").value;
    const pool = words[category];

    secretWord = pool[Math.floor(Math.random() * pool.length)];
    imposterIndex = Math.floor(Math.random() * playersInRoom.length);
    currentIndex = 0;

    startRevealPhase();
};

// ---------------------------------------------------------
// REVEAL PHASE
// ---------------------------------------------------------
function startRevealPhase() {
    showScreen("reveal");
    resetCard();
    updatePlayerLabel();
}

function updatePlayerLabel() {
    $("playerLabel").textContent = `Secret for: ${playersInRoom[currentIndex].name}`;
}

window.flipCard = function () {
    const card = $("revealCard");
    const wordDisplay = $("wordDisplay");

    if (!card.classList.contains("flipped")) {
        const isImposter = currentIndex === imposterIndex;
        wordDisplay.textContent = isImposter
            ? "❓ You are the IMPOSTER!"
            : `Word: ${secretWord}`;

        card.classList.add("flipped");
        $("revealBtn").classList.add("hidden");
        $("nextBtn").classList.remove("hidden");
    }
};

function resetCard() {
    $("revealCard").classList.remove("flipped");
    $("wordDisplay").textContent = "";
    $("revealBtn").classList.remove("hidden");
    $("nextBtn").classList.add("hidden");
}

window.nextPlayer = function () {
    currentIndex++;

    if (currentIndex >= playersInRoom.length) {
        startVoting();
        return;
    }

    resetCard();
    updatePlayerLabel();
};

// ---------------------------------------------------------
// VOTING
// ---------------------------------------------------------
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
    const imposter = playersInRoom[imposterIndex];

    if (votedIndex === imposterIndex) {
        alert(`Correct! ${imposter.name} was the imposter.`);
    } else {
        alert(`Wrong! ${imposter.name} was the imposter.`);
    }
}

window.backToLobby = function () {
    showScreen("lobby");
};

// ---------------------------------------------------------
// AUTO RESTORE SESSION
// ---------------------------------------------------------
(function restore() {
    const savedRoom = localStorage.getItem("roomCode");
    const savedId = localStorage.getItem("playerId");
    const savedHost = localStorage.getItem("isHost");

    if (savedRoom && savedId) {
        roomCode = savedRoom;
        playerId = savedId;
        isHost = savedHost === "true";

        attachLobbyListeners();
        $("roomCodeDisplay").textContent = roomCode;
        showScreen("lobby");
    }
})();
