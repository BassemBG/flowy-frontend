import io
import os
import re
import numpy as np
import torch
import librosa
from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import (
    Wav2Vec2Processor,
    Wav2Vec2ForSequenceClassification,
    Wav2Vec2ForCTC
)

# =========================
# Config
# =========================
MODEL_DIR = r"backend\microservices\pronunciation_service\pronunciation_project\wav2vec2_pronunciation_model"
TARGET_SR = 16000

ASR_MODEL_NAME = "facebook/wav2vec2-base-960h"

app = Flask(__name__)
# Allow cross-origin requests from the frontend dev server / any origin
CORS(app, resources={r"/*": {"origins": "*"}})
device = "cuda" if torch.cuda.is_available() else "cpu"

LABELS = ["accuracy", "fluency", "prosodic"]

# =========================
# Load scoring model + processor
# =========================
if not os.path.isdir(MODEL_DIR):
    raise FileNotFoundError(f"Model folder '{MODEL_DIR}' not found. Make sure it exists next to app.py")

processor = Wav2Vec2Processor.from_pretrained(MODEL_DIR)
model = Wav2Vec2ForSequenceClassification.from_pretrained(MODEL_DIR).to(device)
model.eval()

# =========================
# Load ASR model for completeness + transcription
# =========================
stt_processor = Wav2Vec2Processor.from_pretrained(ASR_MODEL_NAME)
stt_model = Wav2Vec2ForCTC.from_pretrained(ASR_MODEL_NAME).to(device)
stt_model.eval()

# =========================
# Utils
# =========================
def load_wav_bytes(file_bytes: bytes):
    """Load audio from bytes -> mono float32 waveform @ TARGET_SR."""
    with io.BytesIO(file_bytes) as f:
        y, sr = librosa.load(f, sr=None, mono=True)
    if y is None or len(y) == 0:
        raise ValueError("Empty audio.")
    if sr != TARGET_SR:
        y = librosa.resample(y, orig_sr=sr, target_sr=TARGET_SR)
        sr = TARGET_SR
    return y.astype(np.float32), sr

def normalize_text(t: str):
    t = t.lower()
    t = re.sub(r"[^a-z'\s]", " ", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t

def edit_distance(ref, hyp):
    n, m = len(ref), len(hyp)
    dp = [[0]*(m+1) for _ in range(n+1)]
    for i in range(n+1): dp[i][0] = i
    for j in range(m+1): dp[0][j] = j
    for i in range(1, n+1):
        for j in range(1, m+1):
            cost = 0 if ref[i-1] == hyp[j-1] else 1
            dp[i][j] = min(dp[i-1][j]+1, dp[i][j-1]+1, dp[i-1][j-1]+cost)
    return dp[n][m]

def transcribe(audio: np.ndarray, sr: int):
    inputs = stt_processor(audio, sampling_rate=sr, return_tensors="pt", padding=True).input_values.to(device)
    with torch.no_grad():
        logits = stt_model(inputs).logits
    pred_ids = torch.argmax(logits, dim=-1)
    hyp = stt_processor.batch_decode(pred_ids)[0]
    return hyp.strip()

def completeness_score(ref_text: str, hyp_text: str):
    ref_words = normalize_text(ref_text).split()
    hyp_words = normalize_text(hyp_text).split()
    if len(ref_words) == 0:
        return 0.0, 1.0  # score, wer
    wer = edit_distance(ref_words, hyp_words) / max(len(ref_words), 1)
    score = max(0.0, min((1.0 - wer) * 10.0, 10.0))
    return float(score), float(wer)

def smooth_and_norm(x: np.ndarray, sr: int, win_ms: int = 20):
    x = np.asarray(x, dtype=np.float32)
    win = max(1, int(sr * (win_ms / 1000.0)))
    kernel = np.ones(win, dtype=np.float32) / win
    xs = np.convolve(x, kernel, mode="same")
    eps = 1e-9
    xs = (xs - xs.min()) / (xs.max() - xs.min() + eps)
    return xs

def top_segments(sal: np.ndarray, sr: int, seg_ms: int = 250, k: int = 5):
    seg_len = max(1, int(sr * (seg_ms / 1000.0)))
    nseg = len(sal) // seg_len
    scores = []
    for s in range(nseg):
        a = s * seg_len
        b = a + seg_len
        scores.append({
            "importance": float(np.mean(sal[a:b])),
            "t_start": float(a / sr),
            "t_end": float(b / sr)
        })
    scores.sort(key=lambda d: d["importance"], reverse=True)
    return scores[:k]

# =========================
# Routes
# =========================
@app.get("/health")
def health():
    return jsonify({"status": "ok", "device": device, "model_dir": MODEL_DIR})

@app.post("/predict")
def predict():
    """
    multipart/form-data:
      - file: .wav
      - ref_text: optional (string) -> used for completeness
    returns:
      scores (3), completeness, ref_text, hyp_text
    """
    if "file" not in request.files:
        return jsonify({"error": "No file provided. Use form-data key 'file'."}), 400

    f = request.files["file"]
    if not f.filename.lower().endswith(".wav"):
        return jsonify({"error": "Please upload a .wav file."}), 400

    try:
        wav_bytes = f.read()
        audio, sr = load_wav_bytes(wav_bytes)

        # --- predict 3 scores
        inputs = processor(
            audio,
            sampling_rate=sr,
            return_tensors="pt",
            padding=True,
            return_attention_mask=True
        )
        input_values = inputs["input_values"].to(device)
        attention_mask = inputs.get("attention_mask", None)
        if attention_mask is not None:
            attention_mask = attention_mask.to(device)

        with torch.no_grad():
            outputs = model(input_values, attention_mask=attention_mask)
            pred = outputs.logits.squeeze().detach().cpu().numpy()
            pred_0_10 = (pred * 10.0).astype(float)

        scores = {LABELS[i]: round(pred_0_10[i], 2) for i in range(3)}

        # --- ASR transcription (always)
        hyp_text = transcribe(audio, sr)

        # --- completeness (needs ref_text)
        ref_text = request.form.get("ref_text", "").strip()
        completeness = None
        wer = None
        if ref_text:
            completeness, wer = completeness_score(ref_text, hyp_text)

        return jsonify({
            "scores": scores,
            "completeness": (round(completeness, 2) if completeness is not None else None),
            "wer": (round(wer, 3) if wer is not None else None),
            "ref_text": ref_text if ref_text else None,
            "hyp_text": hyp_text,
            "sr": sr,
            "n_samples": int(len(audio))
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.post("/xai")
def xai():
    """
    multipart/form-data:
      - file: .wav
      - k: optional int (default 5)
      - seg_ms: optional int (default 250)
    returns:
      top segments for each label (text-only)
    """
    if "file" not in request.files:
        return jsonify({"error": "No file provided. Use form-data key 'file'."}), 400

    f = request.files["file"]
    if not f.filename.lower().endswith(".wav"):
        return jsonify({"error": "Please upload a .wav file."}), 400

    try:
        k = int(request.form.get("k", 5))
        seg_ms = int(request.form.get("seg_ms", 250))

        wav_bytes = f.read()
        audio, sr = load_wav_bytes(wav_bytes)

        inputs = processor(
            audio,
            sampling_rate=sr,
            return_tensors="pt",
            padding=True,
            return_attention_mask=True
        )
        input_values = inputs["input_values"].to(device)
        attention_mask = inputs.get("attention_mask", None)
        if attention_mask is not None:
            attention_mask = attention_mask.to(device)

        out_all = {}

        for name, idx in zip(LABELS, [0, 1, 2]):
            x = input_values.detach().clone().requires_grad_(True)
            outputs = model(x, attention_mask=attention_mask)
            target = outputs.logits[0, idx]

            model.zero_grad(set_to_none=True)
            if x.grad is not None:
                x.grad.zero_()
            target.backward()

            sal = x.grad.detach().abs().squeeze().float().cpu().numpy()
            sal = smooth_and_norm(sal, sr, win_ms=20)
            out_all[name] = top_segments(sal, sr, seg_ms=seg_ms, k=k)

        return jsonify({
            "segments": out_all,
            "seg_ms": seg_ms,
            "k": k,
            "sr": sr,
            "duration_s": round(len(audio) / sr, 3)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
