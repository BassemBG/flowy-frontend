import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

LLM_API_KEY = os.getenv("LLM_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

LLM_BASE_URL = "https://tokenfactory.esprit.tn/api"
LLM_MODEL = "hosted_vllm/Llama-3.1-70B-Instruct"



JUDGE_LLM_API_KEY = os.getenv("JUDGE_LLM_API_KEY")
JUDGE_LLM_BASE_URL="https://tokenfactory.esprit.tn/api"
JUDGE_LLM_MODEL="hosted_vllm/llava-1.5-7b-hf"

# ========== APPLICATION DEFAULTS ==========
DEFAULT_USER_ID = "translator_01"
DEFAULT_USER_NAME = "Wafa"

# Article generation settings
DEFAULT_TOPICS_COUNT = 3
ARTICLE_MIN_LENGTH = 300
ARTICLE_MAX_LENGTH = 400

# Similarity thresholds
DUPLICATE_THRESHOLD = 0.85
SIMILARITY_THRESHOLD = 0.65

# ========== VALIDATION ==========
def validate_config():
    """Validate required configuration variables."""
    required = {
        "LLM_API_KEY": LLM_API_KEY,
        "LLM_BASE_URL": LLM_BASE_URL,
        "TAVILY_API_KEY": TAVILY_API_KEY,
    }
    
    missing = [key for key, value in required.items() 
               if not value or value.startswith("your-")]
    
    if missing:
        raise ValueError(
            f"Missing required configuration: {', '.join(missing)}\n"
            f"Please set these in your .env file."
        )



# Whisper Configuration
WHISPER_MODEL_SIZE = "base"  # Options: tiny, base, small, medium, large
WHISPER_DEVICE = "cpu"  # Change to "cuda" if GPU available

# Scoring Weights
SCORING_WEIGHTS = {
    "semantic_similarity": 0.40,
    "content_coverage": 0.25,
    "grammar_quality": 0.15,
    "terminology_accuracy": 0.15,
    "fluency": 0.05
}

# Paths
BASE_DIR = Path(__file__).parent.parent
AUDIO_DIR = BASE_DIR / "audio_samples"
ARTICLES_DIR = BASE_DIR / "articles"
RESULTS_DIR = BASE_DIR / "results"

# Create directories if they don't exist
AUDIO_DIR.mkdir(exist_ok=True)
ARTICLES_DIR.mkdir(exist_ok=True)
RESULTS_DIR.mkdir(exist_ok=True)

# Language Settings
SUPPORTED_LANGUAGES = ["en", "fr", "ar"]
DEFAULT_LANGUAGE = "en"

# Scoring Thresholds
EXCELLENT_THRESHOLD = 85
GOOD_THRESHOLD = 70
NEEDS_IMPROVEMENT_THRESHOLD = 50



if __name__ == "__main__":
    validate_config()
    print("✅ Configuration is valid!")