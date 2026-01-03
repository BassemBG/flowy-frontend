import pyaudio
import json
import os
import threading
from datetime import datetime
from vosk import Model, KaldiRecognizer

# -------------------------------
# ✅ SETTINGS
# -------------------------------

MODEL_DIR = r"C:\linTO_model\vosk-model"
OUTPUT_FOLDER = r"texts"   # Folder to save transcription files

# Create folder if it doesn't exist
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# Create unique file name using timestamp
timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
output_file = os.path.join(OUTPUT_FOLDER, f"transcription_{timestamp}.txt")

# Create/clear the file
open(output_file, "w", encoding="utf-8").close()

# -------------------------------
# ✅ LOAD MODEL
# -------------------------------
model = Model(MODEL_DIR)
sample_rate = 16000
rec = KaldiRecognizer(model, sample_rate)

# -------------------------------
# ✅ STOP FLAG (press ENTER)
# -------------------------------
stop_recording = False

def wait_for_enter():
    global stop_recording
    input("👉 Press ENTER to stop recording...\n")
    stop_recording = True

threading.Thread(target=wait_for_enter, daemon=True).start()

# -------------------------------
# ✅ AUDIO STREAM
# -------------------------------
p = pyaudio.PyAudio()
stream = p.open(format=pyaudio.paInt16,
                channels=1,
                rate=sample_rate,
                input=True,
                frames_per_buffer=8000)
stream.start_stream()

print("[INFO] Recording... (Transcription is saved to file)")
print(f"[INFO] File: {output_file}")
print("[INFO] Speak clearly into the microphone...\n")

# -------------------------------
# ✅ MAIN LOOP
# -------------------------------
transcription_count = 0
while not stop_recording:
    try:
        data = stream.read(4000, exception_on_overflow=False)
        if len(data) == 0:
            continue

        if rec.AcceptWaveform(data):
            result = json.loads(rec.Result())
            text = result.get("text", "").strip()

            if text != "":
                transcription_count += 1
                print(f"[INFO] Recognized: {text}")

                # Save Tunisian dialect text (UTF-8)
                with open(output_file, "a", encoding="utf-8") as f:
                    f.write(text + "\n")

    except Exception as e:
        print(f"[ERROR] Error during recognition: {e}")
        continue

# -------------------------------
# ✅ CLEANUP
# -------------------------------
stream.stop_stream()
stream.close()
p.terminate()

# Get remaining text
try:
    final_result = json.loads(rec.FinalResult())
    final_text = final_result.get("text", "").strip()

    if final_text != "":
        transcription_count += 1
        print(f"[INFO] Final: {final_text}")
        with open(output_file, "a", encoding="utf-8") as f:
            f.write(final_text + "\n")
except Exception as e:
    print(f"[ERROR] Error getting final result: {e}")

print("\n[INFO] Recording stopped.")
print(f"[INFO] Total transcriptions: {transcription_count}")

if transcription_count == 0:
    print("[WARNING] No text recognized!")
else:
    print(f"[INFO] Final transcription saved in:\n{output_file}")
