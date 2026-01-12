const words = {
    "Animals": ["Lion", "Shark", "Eagle", "Giraffe", "Penguin"],
    "Video Games": ["Minecraft", "Fortnite", "Mario", "Zelda", "Halo"],
    "Items": ["Backpack", "Laptop", "Water Bottle", "Headphones", "Flashlight"],
    "People": ["Teacher", "Doctor", "Athlete", "Chef", "Actor"],
    "Controversial": ["Pineapple Pizza", "NFTs", "AI Art", "Flat Earth", "TikTok Ban"],
    "Pop Culture": ["Taylor Swift", "Marvel", "Star Wars", "Barbie", "Drake"]
};

let secretWord = "";
let players = 0;
let currentPlayer = 1;
let imposter = 0;

function startGame() {
    const category = document.getElementById("categorySelect").value;
    players = parseInt(document.getElementById("playersInput").value);

    if (players < 3) {
        alert("Enter at least 3 players");
        return;
    }

    secretWord = words[category][Math.floor(Math.random() * words[category].length)];
    imposter = Math.floor(Math.random() * players) + 1;

    document.getElementById("setup").classList.add("hidden");
    document.getElementById("reveal").classList.remove("hidden");

    updatePlayerLabel();
}

function updatePlayerLabel() {
    document.getElementById("playerLabel").innerText = `Player ${currentPlayer}`;
}

function revealWord() {
    const wordDisplay = document.getElementById("wordDisplay");
    const nextBtn = document.getElementById("nextBtn");

    if (currentPlayer === imposter) {
        wordDisplay.innerText = "❓ You are the IMPOSTER!";
    } else {
        wordDisplay.innerText = `Word: ${secretWord}`;
    }

    wordDisplay.classList.remove("hidden");
    nextBtn.classList.remove("hidden");
}

function nextPlayer() {
    currentPlayer++;

    if (currentPlayer > players) {
        startVoting();
        return;
    }

    document.getElementById("wordDisplay").classList.add("hidden");
    document.getElementById("nextBtn").classList.add("hidden");

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
        alert(`Correct! Player ${imposter} was the imposter`);
    } else {
        alert(`Wrong! Player ${imposter} was the imposter`);
    }
}
