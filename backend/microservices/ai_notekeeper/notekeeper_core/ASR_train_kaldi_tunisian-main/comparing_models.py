from transformers import AutoModelForCausalLM, AutoTokenizer, AutoModelForSeq2SeqLM
from datasets import load_metric
import torch
import pandas as pd
import os

# ------------------------------------------------------------
# 1. Define your models
# ------------------------------------------------------------
# TunCHAT (causal LM)
tunchat_model_name = "saifamdouni/TunCHAT-V0.2"

# Fine-tuned NLLB LoRA (Seq2Seq)
finetuned_nllb_dir = "nllb-lora-tunisian-en"  # path where your fine-tuned LoRA is saved

# Add more models here if needed
models_to_compare = [
    {"name": "TunCHAT-V0.2", "type": "causal", "path": tunchat_model_name},
    {"name": "NLLB-LORA", "type": "seq2seq", "path": finetuned_nllb_dir},
]

# ------------------------------------------------------------
# 2. Test examples (Tunisian -> English)
# ------------------------------------------------------------
test_data = [
    {
        "tunisian": "عسلامة دكتور. ولدي عندو كحّة خايبة برشة من ثلاثة أيّام، وسخانتو كل مرّة ترجع، خاصة بالليل",
        "english": "Hello, doctor. My son has had a very bad cough for three days, and his fever keeps coming back, especially at night."
    },
    {
        "tunisian": "تنجم تخلّي الخانة هذيك فارغة. واحنا باش نعمّرو غادي معلومات الوكالة متاعنا كسبونسورك الرسمي لسفرتك",
        "english": "You can leave that section blank. We will fill in our agency’s information there as your official sponsor for the trip."
    },
    {
        "tunisian": "نحب نتأكد برك. الدوسي متاعي توّا كامل مكمّل؟ وكلّ أوراقي كيما شهادات الخلاص وما يثبت التسبقة، الكلّهم موجودين وبالترتيب؟",
        "english": "I just want to make sure. Is my file now fully complete? Are all my documents, like salary statements and proof of my down payment, all included and properly organized?"
    },
]

# ------------------------------------------------------------
# 3. Translation functions
# ------------------------------------------------------------
def translate_causal(model, tokenizer, text):
    prompt = f"""
Translate the following Tunisian Arabic sentence into English.
Only give the translation.

Tunisian: {text}
English:
"""
    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
    outputs = model.generate(**inputs, max_new_tokens=200, do_sample=False)
    out = tokenizer.decode(outputs[0], skip_special_tokens=True)
    if "English:" in out:
        out = out.split("English:")[-1].strip()
    return out

def translate_seq2seq(model, tokenizer, text):
    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=256).to(model.device)
    outputs = model.generate(**inputs, max_new_tokens=200)
    out = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return out

# ------------------------------------------------------------
# 4. Load metrics
# ------------------------------------------------------------
bleu = load_metric("bleu")
rouge = load_metric("rouge")
chrf = load_metric("chrf")

# ------------------------------------------------------------
# 5. Evaluate models
# ------------------------------------------------------------
results = []

for m in models_to_compare:
    print(f"\n🔵 Evaluating model: {m['name']}")
    
    # Load tokenizer and model
    if m["type"] == "causal":
        tokenizer = AutoTokenizer.from_pretrained(m["path"])
        model = AutoModelForCausalLM.from_pretrained(m["path"], device_map="auto", torch_dtype=torch.float16)
    elif m["type"] == "seq2seq":
        tokenizer = AutoTokenizer.from_pretrained(m["path"])
        model = AutoModelForSeq2SeqLM.from_pretrained(m["path"]).to("cpu")  # safe for LoRA CPU
    else:
        raise ValueError("Unknown model type!")

    bleu_refs, bleu_preds = [], []
    rouge_refs, rouge_preds = [], []
    chrf_refs, chrf_preds = [], []

    for item in test_data:
        if m["type"] == "causal":
            pred = translate_causal(model, tokenizer, item["tunisian"])
        else:
            pred = translate_seq2seq(model, tokenizer, item["tunisian"])

        ref = item["english"]

        bleu_preds.append(pred.split())
        bleu_refs.append([ref.split()])

        rouge_preds.append(pred)
        rouge_refs.append(ref)

        chrf_preds.append(pred)
        chrf_refs.append(ref)

    bleu_score = bleu.compute(predictions=bleu_preds, references=bleu_refs)["bleu"]
    rouge_score = rouge.compute(predictions=rouge_preds, references=rouge_refs)["rougeL"].mid.fmeasure
    chrf_score = chrf.compute(predictions=chrf_preds, references=chrf_refs)["score"]

    results.append({
        "model": m["name"],
        "BLEU": bleu_score,
        "ROUGE-L": rouge_score,
        "chrF": chrf_score,
    })

# ------------------------------------------------------------
# 6. Show results
# ------------------------------------------------------------
df = pd.DataFrame(results)
print("\n\n===== 🟩 MODEL COMPARISON RESULTS 🟩 =====\n")
print(df)
