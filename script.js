let secretWord = "";
let players = 0;
let currentPlayer = 1;
let imposter = 0;

function startGame() {
    secretWord = document.getElementById("wordInput").value.trim();
    players = parseInt(document.getElementById("playersInput").value);

    if (!secretWord || players < 3) {
        alert("Enter a word and at least 3 players");
        return;
    }

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
