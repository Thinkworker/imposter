const words = {
    "Animals": ["Lion", "Shark", "Eagle", "Giraffe", "Penguin", "Kangaroo", "Octopus"],
    "Video Games": ["Minecraft", "Fortnite", "Mario", "Zelda", "Halo", "Roblox", "Overwatch"],
    "Items": ["Backpack", "Laptop", "Water Bottle", "Headphones", "Flashlight", "Notebook", "Sunglasses"],
    "People": ["Teacher", "Doctor", "Athlete", "Chef", "Actor", "Pilot", "Streamer"],
    "Controversial": ["Pineapple Pizza", "NFTs", "AI Art", "Cancel Culture", "TikTok Ban", "Spoiler Culture"],
    "Pop Culture": ["Taylor Swift", "Marvel", "Star Wars", "Barbie", "Drake", "Stranger Things", "K‑Pop"]
};

let secretWord = "";
let players = 0;
let currentPlayer = 1;
let imposter = 0;

// Generate QR code of current page
window.addEventListener("load", () => {
    const url = window.location.href;
    const gameLinkEl = document.getElementById("gameLink");
    const qrCanvas = document.getElementById("qrCanvas");

    if (gameLinkEl && qrCanvas && window.QRious) {
        gameLinkEl.textContent = url;

        new QRious({
            element: qrCanvas,
            value: url,
            size: 140,
            background: "white",
            foreground: "#111827",
            level: "H"
        });
    }
});

function startGame() {
    const category = document.getElementById("categorySelect").value;
    players = parseInt(document.getElementById("playersInput").value);

    if (!players || players < 3) {
        alert("Enter at least 3 players");
        return;
    }

    const pool = words[category];
    secretWord = pool[Math.floor(Math.random() * pool.length)];
    imposter = Math.floor(Math.random() * players) + 1;
    currentPlayer = 1;

    document.getElementById("setup").classList.add("hidden");
    document.getElementById("voting").classList.add("hidden");
    document.getElementById("reveal").classList.remove("hidden");

    resetCard();
    updatePlayerLabel();
}

function updatePlayerLabel() {
    document.getElementById("playerLabel").innerText = `Player ${currentPlayer}`;
}

function flipCard() {
    const flipCard = document.getElementById("revealCard");
    const wordDisplay = document.getElementById("wordDisplay");
    const nextBtn = document.getElementById("nextBtn");
    const revealBtn = document.getElementById("revealBtn");

    if (!flipCard.classList.contains("flipped")) {
        if (currentPlayer === imposter) {
            wordDisplay.textContent = "❓ You are the IMPOSTER!";
        } else {
            wordDisplay.textContent = `Word: ${secretWord}`;
        }

        flipCard.classList.add("flipped");
        revealBtn.classList.add("hidden");
        nextBtn.classList.remove("hidden");
    }
}

function resetCard() {
    const flipCard = document.getElementById("revealCard");
    const wordDisplay = document.getElementById("wordDisplay");
    const nextBtn = document.getElementById("nextBtn");
    const revealBtn = document.getElementById("revealBtn");

    flipCard.classList.remove("flipped");
    wordDisplay.textContent = "";
    nextBtn.classList.add("hidden");
    revealBtn.classList.remove("hidden");
}

function nextPlayer() {
    currentPlayer++;

    if (currentPlayer > players) {
        startVoting();
        return;
    }

    resetCard();
    updatePlayerLabel();
}

function startVoting() {
    document.getElementById("reveal").classList.add("hidden");
    document.getElementById("voting").classList.remove("hidden");

    const voteList = document.getElementById("voteList");
    voteList.innerHTML = "";

    for (let i = 1; i <= players; i++) {
        const btn = document.createElement("button");
        btn.classList.add("vote-btn");
        btn.innerText = `Player ${i}`;
        btn.onclick = () => revealImposter(i);
        voteList.appendChild(btn);
    }
}

function revealImposter(voted) {
    if (voted === imposter) {
        alert(`Correct! Player ${imposter} was the imposter.`);
    } else {
        alert(`Wrong! Player ${imposter} was the imposter.`);
    }

    // Back to setup for a new round
    document.getElementById("voting").classList.add("hidden");
    document.getElementById("setup").classList.remove("hidden");
}
