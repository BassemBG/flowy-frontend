# stt.py - Speech-to-Text module for transcribing audio files
import json
import os
import wave
import numpy as np
from vosk import Model, KaldiRecognizer

# Model directory (same as in test_asr.py)
MODEL_DIR = r"C:\linTO_model\vosk-model"

# Load model once (cached)
_model = None

def _get_model():
    """Load and cache the vosk model"""
    global _model
    if _model is None:
        _model = Model(MODEL_DIR)
    return _model

def file_to_bytes(file_path):
    """
    Read a WAV file and return sample rate and audio bytes.
    Converts stereo to mono if needed.
    """
    if not os.path.isfile(file_path):
        raise FileNotFoundError(f"Audio file not found: {file_path}")
    
    try:
        with wave.open(file_path, "rb") as f:
            sample_rate = f.getframerate()
            audio = f.readframes(-1)
            
            # Convert stereo to mono if needed
            if f.getnchannels() == 2:
                dtype = {1: np.int8, 2: np.int16, 4: np.int32}.get(f.getsampwidth())
                if dtype is None:
                    raise ValueError(f"Unsupported sample width: {f.getsampwidth()}")
                
                audio_array = np.frombuffer(audio, dtype=dtype)
                audio_array = audio_array.reshape(-1, 2)
                audio_array = np.mean(audio_array, axis=1).astype(np.int16)
                audio = audio_array.tobytes()
    
    except wave.Error as e:
        raise RuntimeError(f"Could not read WAV file {file_path}: {e}")
    
    return sample_rate, audio

def transcribe_audio(audio_file_path):
    """
    Transcribe an audio file (WAV format) to text.
    
    Args:
        audio_file_path: Path to the WAV audio file
        
    Returns:
        str: Transcribed text
    """
    # Load model
    model = _get_model()
    
    # Read audio file
    sample_rate, audio_data = file_to_bytes(audio_file_path)
    
    # Create recognizer with the audio's sample rate
    rec = KaldiRecognizer(model, sample_rate)
    
    # Set partial words to True for better recognition
    rec.SetWords(True)
    
    # Process the audio file in chunks (better for large files)
    chunk_size = 4000  # Process 4000 bytes at a time
    for i in range(0, len(audio_data), chunk_size):
        chunk = audio_data[i:i + chunk_size]
        if len(chunk) > 0:
            rec.AcceptWaveform(chunk)
    
    # Get the final result
    result = json.loads(rec.FinalResult())
    text = result.get("text", "").strip()
    
    return text

