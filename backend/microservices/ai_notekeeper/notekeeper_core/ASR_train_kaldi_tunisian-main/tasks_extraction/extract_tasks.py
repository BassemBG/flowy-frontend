"""
Minimal pipeline orchestrator.

This file intentionally acts as a small entry-point that attempts to run the
existing pipeline steps (record -> transcribe -> translate -> extract -> report).
It imports available modules and falls back to reading the latest translated
text file when necessary. Only minimal orchestration logic is included here
so existing modules and their internal logic are unchanged.
"""

import os
import platform
from datetime import datetime
import traceback
import subprocess
import sys
from datetime import datetime

today_date = datetime.now().strftime("%d/%m/%Y")



def _read_latest_translation_file(folder=None):
    if folder is None:
        folder = os.path.join(os.path.dirname(__file__), "..", "translate_texts")
    folder = os.path.abspath(folder)
    if not os.path.exists(folder):
        return None
    files = [os.path.join(folder, f) for f in os.listdir(folder) if f.endswith(".txt")]
    if not files:
        return None
    latest = max(files, key=os.path.getmtime)
    with open(latest, "r", encoding="utf-8") as fh:
        return fh.read()


def _save_translation(text, folder=None):
    if folder is None:
        folder = os.path.join(os.path.dirname(__file__), "..", "translate_texts")
    os.makedirs(folder, exist_ok=True)
    path = os.path.join(folder, f"transcription_{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}.txt")
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(text)
    return path


def extract_and_generate_report(conversation_text: str):
    """Run the task-extraction + PDF report generation logic.

    The function keeps the extraction and report behaviour self-contained so
    the orchestrator simply calls it with the conversation text.
    """
    try:
        import httpx
        from openai import OpenAI
        from fpdf import FPDF
    except Exception as exc:
        raise RuntimeError("Missing packages required for extraction/reporting: " + str(exc))

    http_client = httpx.Client(verify=False)
    client = OpenAI(
        api_key="sk-9436d68b02fd495696f213ea0218f752",
        base_url="https://tokenfactory.esprit.tn/api",
        http_client=http_client,
    )

    prompt = f"""
You are an assistant that extracts tasks with exact dates from a text.

Use ONLY today's real system date as the reference date.
Today's date is: {today_date} (DD/MM/YYYY).

Convert relative dates (e.g. "tomorrow", "next Monday", "in two days")
ONLY based on today's date above.
Do NOT assume, infer, or invent any other dates.

Output format:
DATE: Task description

Rules:
- One task per line
- No bullet points or symbols
- No explanations or comments
- If a task has no explicit or relative date, output the task WITHOUT adding a date
- Do NOT mention how the date was calculated

Text:
\"\"\"{conversation_text}\"\"\"
"""


    response = client.chat.completions.create(
        model="hosted_vllm/Llama-3.1-70B-Instruct",
        messages=[
            {"role": "system", "content": "You are a practical assistant."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
        max_tokens=300,
        top_p=0.9,
    )

    raw_output = response.choices[0].message.content.strip()

    cleaned_lines = []
    for line in raw_output.split("\n"):
        line = line.strip()
        if not line:
            continue
        if line.lower().startswith("since i don't know"):
            continue
        if line.lower().startswith("since i do not know"):
            continue
        if line.lower().startswith("assuming the current date"):
            continue
        # Skip generic assumption lines like "Assuming today's date is ..."
        if line.lower().startswith("assuming") or ("assume" in line.lower() and "date" in line.lower()):
            continue
        cleaned_lines.append(line)

    tasks_output = "\n".join(cleaned_lines)

    print("======= EXTRACTED TASKS =======")
    print(tasks_output)

    reports_folder = os.path.join(os.path.dirname(__file__), "..", "tasks_reports")
    os.makedirs(reports_folder, exist_ok=True)
    pdf_file_path = os.path.join(reports_folder, f"tasks_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf")

    pdf = FPDF('P', 'mm', 'A4')
    pdf.add_page()

    pdf.set_fill_color(60, 0, 100)
    pdf.rect(10, 10, 190, 25, 'F')

    pdf.set_xy(10, 10)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Arial", 'B', 20)
    pdf.cell(190, 25, "DAILY TASK REPORT", ln=True, align="C")

    pdf.set_xy(10, 40)
    pdf.set_text_color(0, 0, 0)
    pdf.set_font("Arial", '', 12)
    pdf.cell(25, 8, "Date:", ln=False)
    pdf.line(35, 48, 100, 48)

    pdf.set_xy(10, 55)
    pdf.set_fill_color(60, 0, 100)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Arial", 'B', 12)
    pdf.cell(20, 8, "TASK:", ln=True, fill=True)

    pdf.set_xy(10, 63)
    pdf.set_fill_color(245, 245, 245)
    pdf.rect(10, 63, 190, 150, 'F')

    pdf.set_xy(12, 65)
    pdf.set_text_color(0, 0, 0)
    pdf.set_font("Arial", '', 12)

    for line in tasks_output.split("\n"):
        if line.strip():
            pdf.multi_cell(0, 8, line)

    pdf.output(pdf_file_path)
    print(f"\nPDF report saved at: {pdf_file_path}")

    try:
        if platform.system() == "Windows":
            os.startfile(pdf_file_path)
        elif platform.system() == "Darwin":
            os.system(f"open '{pdf_file_path}'")
        else:
            os.system(f"xdg-open '{pdf_file_path}'")
    except Exception:
        pass


def main():
    # Orchestrate the pipeline by running `test_asr.py` (preferred), then
    # locate the latest translated text in `translate_texts/`, and finally
    # perform task/date extraction and report generation.
    try:
        # Prefer invoking the existing `test_asr.py` script which handles
        # recording, ASR and translation and writes to translate_texts/.
        test_asr_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "test_asr.py"))
        if os.path.exists(test_asr_path):
            try:
                print(f"[orchestrator] Running test_asr.py to produce translation file: {test_asr_path}")
                subprocess.run([sys.executable, test_asr_path], check=True)
            except Exception as e:
                print(f"[orchestrator] Running test_asr.py failed: {e}")

        # After running test_asr.py, try to load the latest translated file.
        latest = _read_latest_translation_file()
        if latest is not None:
            print("[orchestrator] Found translated text produced by test_asr.py; continuing to extraction.")
            extract_and_generate_report(latest)
            return

        # Fallback: if no translated file exists, attempt the per-step flow
        audio_path = None

        # 1) Record audio (if recorder module exists)
        try:
            import record_audio as recorder  # optional: user may have this module
            print("[orchestrator] Using record_audio.record()")
            audio_path = recorder.record()
        except Exception:
            # fall back: look for common file names
            candidates = [os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "meeting.wav")), os.path.abspath(os.path.join(os.path.dirname(__file__), "meeting.wav"))]
            for c in candidates:
                if os.path.exists(c):
                    audio_path = c
                    print(f"[orchestrator] Found existing audio: {audio_path}")
                    break

        # 2) Transcribe (use `stt.transcribe_audio` when available)
        transcript_text = None
        if audio_path:
            try:
                import stt
                print(f"[orchestrator] Transcribing {audio_path} using stt.transcribe_audio()")
                transcript_text = stt.transcribe_audio(audio_path)
                _save_translation(transcript_text)
            except Exception as e:
                print(f"[orchestrator] Transcription failed: {e}")

        # 3) Translate (if translator module exists)
        translated_text = None
        if transcript_text:
            tried = False
            # Try known translator modules (including Tunchat)
            for mod_name in ("Tunchat.translating", "translator_finetuned", "translator", "translator_nllb"):
                try:
                    parts = mod_name.split('.')
                    mod = __import__(mod_name)
                    for p in parts[1:]:
                        mod = getattr(mod, p)

                    if hasattr(mod, "translate_tn_to_en"):
                        print(f"[orchestrator] Translating using {mod_name}.translate_tn_to_en()")
                        translated_text = mod.translate_tn_to_en(transcript_text)
                        tried = True
                        break
                    if hasattr(mod, "translate_tunisian_to_english"):
                        print(f"[orchestrator] Translating using {mod_name}.translate_tunisian_to_english()")
                        translated_text = mod.translate_tunisian_to_english(transcript_text)
                        tried = True
                        break
                    if hasattr(mod, "translate"):
                        print(f"[orchestrator] Translating using {mod_name}.translate()")
                        translated_text = mod.translate(transcript_text)
                        tried = True
                        break
                except Exception:
                    continue
            if tried and translated_text:
                _save_translation(translated_text)

        # 4) If we don't have translated text at this point, fall back to latest file
        if not translated_text:
            latest = _read_latest_translation_file()
            if latest is None:
                raise FileNotFoundError("No translated text available to extract tasks from.")
            conversation_text = latest
        else:
            conversation_text = translated_text

        # 5) Extract tasks & generate PDF report
        extract_and_generate_report(conversation_text)

    except Exception as exc:
        print("[orchestrator] Pipeline failed:")
        traceback.print_exc()


if __name__ == "__main__":
    main()
