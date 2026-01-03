import os
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
import torch

MODEL_NAME = "saifamdouni/TunCHAT-V0.2"
TEXTS_FOLDER = "texts"   # folder where your Tunisian text files are stored

print("Loading TunCHAT on CPU with 4-bit quantization...")

# 4-bit quantization config
quant_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_compute_dtype=torch.float16,
)

# Load tokenizer
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

# Force CPU mode
model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    quantization_config=quant_config,
    device_map="cpu"
)

device = "cpu"


def get_latest_file(folder):
    """Return the newest file path inside the folder."""
    files = [os.path.join(folder, f) for f in os.listdir(folder) if os.path.isfile(os.path.join(folder, f))]
    if not files:
        print("❌ No files found in the 'texts' folder!")
        return None
    return max(files, key=os.path.getmtime)


def read_latest_text():
    """Load the content of the newest file in texts folder."""
    latest_file = get_latest_file(TEXTS_FOLDER)
    if latest_file is None:
        return None

    print(f"📄 Using latest file: {latest_file}")
    with open(latest_file, "r", encoding="utf-8") as f:
        return f.read()


def translate_tunisian_to_english(text, max_new_tokens=200):
    if not text or not text.strip():
        return ""

    messages = [
        {"role": "system", "content": "You are a professional translator."},
        {"role": "user", "content": f"Translate this Tunisian Arabic text into natural English:\n{text}"},
    ]

    inputs = tokenizer.apply_chat_template(
        messages,
        return_tensors="pt",
        add_generation_prompt=True
    ).to(device)

    with torch.no_grad():
        outputs = model.generate(
            inputs,
            max_new_tokens=max_new_tokens,
            do_sample=False
        )

    # Decode only the newly generated tokens
    generated_tokens = outputs[0][inputs.shape[-1]:]
    output_text = tokenizer.decode(generated_tokens, skip_special_tokens=True).strip()

    return output_text


# Main execution
if __name__ == "__main__":
    tunisian_text = read_latest_text()
    if tunisian_text:
        print("\n===== Tunisian Text Loaded =====")
        print(tunisian_text)

        print("\n===== English Translation =====")
        english = translate_tunisian_to_english(tunisian_text)
        print(english)
