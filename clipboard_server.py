import os

import pyperclip
from flask import Flask, jsonify
from flask_cors import CORS
from fugashi import Tagger

app = Flask(__name__)
CORS(app)
tagger = Tagger()

is_reading = True


@app.route("/clipboard")
def get_clipboard():
    global is_reading
    if not is_reading:
        return jsonify({"text": "", "tokens": [], "is_reading": False})
    current_text = pyperclip.paste()
    if not current_text or not isinstance(current_text, str):
        return jsonify({"text": "", "tokens": [], "is_reading": True})

    tokens = []
    for word in tagger(current_text):
        pos_category = word.pos.split(",")[0]
        is_word = pos_category not in ["助詞", "補助記号", "空白"]
        lemma = getattr(word.feature, "lemma", None)
        if not lemma or lemma == "*":
            lemma = word.surface
        tokens.append({"surface": word.surface, "lemma": lemma, "isWord": is_word})

    return jsonify({"text": current_text, "tokens": tokens, "is_reading": True})


@app.route("/toggle", methods=["POST"])
def toggle():
    global is_reading
    is_reading = not is_reading
    return jsonify({"is_reading": is_reading})


@app.route("/shutdown", methods=["POST"])
def shutdown():
    os._exit(0)
    return jsonify({"status": "shutting down"})


if __name__ == "__main__":
    print("Clipboard Server Running...")
    pyperclip.copy("")
    app.run(port=5000)
