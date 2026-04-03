const outputDiv = document.getElementById("output");
const toggleBtn = document.getElementById("toggle-btn");
const selectedWordsContainer = document.getElementById("anki-selected-words");
const sendAnkiBtn = document.getElementById("send-anki-btn");
const screenshotPreview = document.getElementById("screenshot-preview");

let lastText = "";
let serverIsReading = true;
let selectedTokens = [];
let screenshotBase64 = null;

const deckSelect = document.getElementById("deck-select");
const modelSelect = document.getElementById("model-select");
const refreshAnkiBtn = document.getElementById("refresh-anki-btn");

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
      clearAnkiSelections();
    }
  } catch (e) {
    outputDiv.innerHTML =
      "<span style='color: red;'>Cannot reach Python server. Did you run the .bat file?</span>";
  }
});

function updateButtonUI() {
  if (serverIsReading) {
    toggleBtn.textContent = "Stop clipboard server";
    toggleBtn.className = "btn btn-red";
  } else {
    toggleBtn.textContent = "Start clipboard server";
    toggleBtn.className = "btn btn-green";
  }
}

function processTokens(tokens) {
  outputDiv.innerHTML = "";
  clearAnkiSelections();

  tokens.forEach((token) => {
    if (token.isWord) {
      const link = document.createElement("a");
      link.href = `https://jisho.org/search/${encodeURIComponent(token.lemma)}`;
      link.target = "jisho-frame";
      link.className = "word";
      link.textContent = token.surface;
      link.title = `Dictionary form: ${token.lemma}\nRight-click to select for Anki`;
      link.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        toggleAnkiSelection(token, link);
      });
      outputDiv.appendChild(link);
    } else {
      const span = document.createElement("span");
      span.textContent = token.surface;
      outputDiv.appendChild(span);
    }
  });
}

function toggleAnkiSelection(token, htmlElement) {
  const existingIndex = selectedTokens.findIndex(
    (t) => t.surface === token.surface,
  );
  if (existingIndex > -1) {
    selectedTokens.splice(existingIndex, 1);
    htmlElement.classList.remove("selected-word");
  } else {
    if (selectedTokens.length >= 5) {
      alert("Your template only supports up to 5 target words!");
      return;
    }
    selectedTokens.push(token);
    htmlElement.classList.add("selected-word");
  }
  updateAnkiUI();
}

function clearAnkiSelections() {
  selectedTokens = [];
  screenshotBase64 = null;
  screenshotPreview.innerHTML = "Paste Image Here";
  document.querySelectorAll(".selected-word").forEach((node) => {
    node.classList.remove("selected-word");
  });
  updateAnkiUI();
}

function updateAnkiUI() {
  selectedWordsContainer.innerHTML = "";
  selectedTokens.forEach((token) => {
    const span = document.createElement("span");
    span.textContent = token.surface;
    selectedWordsContainer.appendChild(span);
  });
  sendAnkiBtn.disabled = selectedTokens.length === 0;
}

window.addEventListener("paste", (e) => {
  const items = e.clipboardData.items;
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf("image") !== -1) {
      const blob = items[i].getAsFile();
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Url = event.target.result;
        screenshotBase64 = base64Url.split(",")[1];
        screenshotPreview.innerHTML = `<img src="${base64Url}" />`;
      };
      reader.readAsDataURL(blob);
    }
  }
});

async function getJishoData(lemma) {
  try {
    const res = await fetch(
      `http://127.0.0.1:5000/api/jisho/${encodeURIComponent(lemma)}`,
    );
    if (!res.ok) {
      console.error(`Server error: ${res.status}`);
      return { reading: "", definitions: "Proxy Error" };
    }
    const data = await res.json();
    if (data.data && data.data.length > 0) {
      const topResult = data.data[0];
      const japInfo = topResult.japanese[0];
      const reading = japInfo.reading || japInfo.word || lemma;
      let definitions = "No definition found";
      if (topResult.senses && topResult.senses.length > 0) {
        definitions = topResult.senses[0].english_definitions.join("; ");
      }
      return { reading, definitions };
    }
  } catch (e) {
    console.error("Jisho fetch failed", e);
  }
  return { reading: "", definitions: "Not found" };
}

sendAnkiBtn.addEventListener("click", async () => {
  sendAnkiBtn.disabled = true;
  sendAnkiBtn.textContent = "Building...";

  let formattedSentence = lastText;
  selectedTokens.forEach((token) => {
    const regex = new RegExp(token.surface, "g");
    formattedSentence = formattedSentence.replace(
      regex,
      `<b>${token.surface}</b>`,
    );
  });

  let fields = { Sentence: formattedSentence };

  for (let i = 0; i < selectedTokens.length; i++) {
    const wordData = await getJishoData(selectedTokens[i].lemma);
    fields[`Target word ${i + 1}`] = selectedTokens[i].surface;
    fields[`Reading ${i + 1}`] = wordData.reading;
    fields[`Definitions ${i + 1}`] = wordData.definitions;
  }

  let pictureData = [];
  if (screenshotBase64) {
    const filename = `jisho_mining_${Date.now()}.png`;
    pictureData.push({
      data: screenshotBase64,
      filename: filename,
      fields: ["Screenshot"],
    });
  }

  const payload = {
    action: "addNote",
    version: 6,
    params: {
      note: {
        deckName: deckSelect.value,
        modelName: modelSelect.value,
        fields: fields,
        picture: pictureData,
        options: {
          allowDuplicate: false,
        },
      },
    },
  };

  try {
    const response = await fetch("http://127.0.0.1:8765", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (result.error) {
      alert("Anki Error: " + result.error);
      sendAnkiBtn.textContent = "Send to Anki";
      sendAnkiBtn.disabled = false;
    } else {
      sendAnkiBtn.style.background = "#2e7d32";
      sendAnkiBtn.textContent = "Added!";
      setTimeout(() => {
        clearAnkiSelections();
        sendAnkiBtn.style.background = "";
        sendAnkiBtn.textContent = "Send to Anki";
      }, 2000);
    }
  } catch (e) {
    alert("Failed to connect to Anki. Is Anki open and AnkiConnect installed?");
    sendAnkiBtn.textContent = "Send to Anki";
    sendAnkiBtn.disabled = false;
  }
});

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
    toggleBtn.className = "btn";
    toggleBtn.style.background = "#666";
  }
}, 1000);

window.addEventListener("beforeunload", () => {
  navigator.sendBeacon("http://127.0.0.1:5000/shutdown");
});

async function invokeAnki(action, params = {}) {
  try {
    const response = await fetch("http://127.0.0.1:8765", {
      method: "POST",
      body: JSON.stringify({ action, version: 6, params }),
    });
    const result = await response.json();
    if (result.error) throw new Error(result.error);
    return result.result;
  } catch (e) {
    console.error("AnkiConnect error:", e);
    return null;
  }
}

async function loadAnkiDropdowns() {
  deckSelect.innerHTML = "<option>Loading...</option>";
  modelSelect.innerHTML = "<option>Loading...</option>";
  const decks = await invokeAnki("deckNames");
  const models = await invokeAnki("modelNames");
  if (decks) {
    deckSelect.innerHTML = decks
      .map((deck) => `<option value="${deck}">${deck}</option>`)
      .join("");
    if (decks.includes("Mining")) deckSelect.value = "Mining";
  } else {
    deckSelect.innerHTML = "<option>Anki not found</option>";
  }
  if (models) {
    modelSelect.innerHTML = models
      .map((model) => `<option value="${model}">${model}</option>`)
      .join("");
    if (models.includes("Jisho Card")) modelSelect.value = "Jisho Card";
  } else {
    modelSelect.innerHTML = "<option>Anki not found</option>";
  }
}

loadAnkiDropdowns();
refreshAnkiBtn.addEventListener("click", loadAnkiDropdowns);
