const outputDiv = document.getElementById("output");
const toggleBtn = document.getElementById("toggle-btn");
let lastText = "";
let serverIsReading = true;

toggleBtn.addEventListener("click", async () => {
  try {
    const response = await fetch("http://127.0.0.1:5000/toggle", {
      method: "POST",
    });
    const data = await response.json();
    serverIsReading = data.is_reading;
    updateButtonUI();
    if (!serverIsReading) {
      outputDiv.innerHTML =
        "<span style='color: #666;'>Clipboard reading paused...</span>";
      lastText = "";
    }
  } catch (e) {
    outputDiv.innerHTML =
      "<span style='color: red;'>Cannot reach Python server. Did you run the .bat file?</span>";
  }
});

function updateButtonUI() {
  if (serverIsReading) {
    toggleBtn.textContent = "Stop clipboard server";
    toggleBtn.style.background = "#d84315";
  } else {
    toggleBtn.textContent = "Start clipboard server";
    toggleBtn.style.background = "#2e7d32";
  }
}

function processTokens(tokens) {
  outputDiv.innerHTML = "";
  tokens.forEach((token) => {
    if (token.isWord) {
      const link = document.createElement("a");
      link.href = `https://jisho.org/search/${encodeURIComponent(token.lemma)}`;
      link.target = "jisho-frame";
      link.className = "word";
      link.textContent = token.surface;
      link.title = `Dictionary form: ${token.lemma}`;
      outputDiv.appendChild(link);
    } else {
      const span = document.createElement("span");
      span.textContent = token.surface;
      outputDiv.appendChild(span);
    }
  });
}

setInterval(async () => {
  try {
    const response = await fetch("http://127.0.0.1:5000/clipboard");
    const data = await response.json();
    if (data.is_reading !== serverIsReading) {
      serverIsReading = data.is_reading;
      updateButtonUI();
    }
    if (data.is_reading && data.text && data.text !== lastText) {
      lastText = data.text;
      processTokens(data.tokens);
    }
  } catch (err) {
    toggleBtn.textContent = "Server Offline";
    toggleBtn.style.background = "#666";
  }
}, 1000);

window.addEventListener("beforeunload", () => {
  navigator.sendBeacon("http://127.0.0.1:5000/shutdown");
});
