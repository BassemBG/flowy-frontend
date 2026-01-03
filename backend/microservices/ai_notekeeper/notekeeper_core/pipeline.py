import os
import sys
import importlib.util
import io
import contextlib
from typing import Dict, Any, List


def _load_module_from_path(name: str, path: str):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


def run_notekeeper_pipeline(audio_path: str) -> Dict[str, Any]:
    """Run ASR -> Translation -> Task extraction -> PDF generation."""

    # ✅ BASE PATH — FIXED
    base = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "ASR_train_kaldi_tunisian-main")
    )
    print("PIPELINE BASE PATH:", base)
    print("FILES IN BASE:", os.listdir(base))


    # Prepare paths to known modules
    stt_path = os.path.join(base, "stt.py")
    translating_path = os.path.join(base, "Tunchat", "translating.py")
    extract_path = os.path.join(base, "tasks_extraction", "extract_tasks.py")

    if not os.path.exists(stt_path):
        raise FileNotFoundError(f"stt.py not found at expected location: {stt_path}")

    # Load modules
    stt = _load_module_from_path("nk_stt", stt_path)

    translator = None
    if os.path.exists(translating_path):
        try:
            translator = _load_module_from_path("nk_translating", translating_path)
        except Exception:
            translator = None

    extract_mod = None
    if os.path.exists(extract_path):
        extract_mod = _load_module_from_path("nk_extract_tasks", extract_path)

    # 1) ASR
    try:
        transcription = stt.transcribe_audio(audio_path)
    except Exception as exc:
        raise RuntimeError(f"ASR transcription failed: {exc}")

    # 2) Translation
    translated_text = ""
    if translator and hasattr(translator, "translate_tunisian_to_english"):
        try:
            translated_text = translator.translate_tunisian_to_english(transcription)
        except Exception:
            translated_text = ""

    # 3) Task extraction + PDF generation
    tasks: List[str] = []
    pdf_path = ""

    if extract_mod and hasattr(extract_mod, "extract_and_generate_report"):
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            extract_mod.extract_and_generate_report(translated_text or transcription)

        out = buf.getvalue()
        lines = out.splitlines()

        for line in lines:
            if line.strip().startswith("PDF report saved at:"):
                pdf_path = line.split(":", 1)[1].strip()
            elif line.strip():
                tasks.append(line.strip())

    # Fallback: find latest PDF
    if not pdf_path:
        reports_dir = os.path.join(base, "tasks_reports")
        if os.path.isdir(reports_dir):
            pdfs = [
                os.path.join(reports_dir, f)
                for f in os.listdir(reports_dir)
                if f.lower().endswith(".pdf")
            ]
            if pdfs:
                pdf_path = max(pdfs, key=os.path.getmtime)

    return {
        "transcription": transcription,
        "translated_text": translated_text,
        "tasks": tasks,
        "pdf_path": pdf_path,
    }


if __name__ == "__main__":
    print(run_notekeeper_pipeline("temp_audio/sample.wav"))
