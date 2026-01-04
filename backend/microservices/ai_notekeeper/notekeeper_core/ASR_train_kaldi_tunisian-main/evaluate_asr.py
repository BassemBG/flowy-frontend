import os
import json
import jiwer
import soundfile as sf
from vosk import Model, KaldiRecognizer

# ----------------------------
# CONFIG
# ----------------------------
MODEL_DIR = r"C:\linTO_model\vosk-model"
DATASET_DIR = r"C:\dataset_asr"
LABEL_FILE = os.path.join(DATASET_DIR, "labels.txt")

sample_rate = 16000

# ----------------------------
# LOAD MODEL
# ----------------------------
model = Model(MODEL_DIR)

# ----------------------------
# LOAD GROUND TRUTH LABELS
# ----------------------------
labels = {}
with open(LABEL_FILE, "r", encoding="utf-8") as f:
    for line in f:
        audio, text = line.strip().split("|")
        labels[audio] = text.lower()

# ----------------------------
# METRICS ACCUMULATORS
# ----------------------------
all_refs = []
all_hyps = []

# ----------------------------
# EVALUATION LOOP
# ----------------------------
for audio_file, ref_text in labels.items():
    audio_path = os.path.join(DATASET_DIR, audio_file)

    data, sr = sf.read(audio_path)

    if sr != sample_rate:
        raise ValueError(f"Sample rate mismatch for {audio_file}. Expected 16kHz")

    rec = KaldiRecognizer(model, sample_rate)

    rec.AcceptWaveform(data.tobytes())
    result = json.loads(rec.FinalResult())
    hyp_text = result.get("text", "")

    print(f"GT:  {ref_text}")
    print(f"HYP: {hyp_text}\n")

    all_refs.append(ref_text)
    all_hyps.append(hyp_text)

# ----------------------------
# METRIC COMPUTATION
# ----------------------------
wer = jiwer.wer(all_refs, all_hyps)
cer = jiwer.cer(all_refs, all_hyps)

print("\n===============================")
print(" ASR MODEL EVALUATION RESULTS ")
print("===============================")
print(f"WER: {wer * 100:.2f}%")
print(f"CER: {cer * 100:.2f}%")
