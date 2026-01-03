from transformers import AutoTokenizer
import nltk
nltk.download("punkt")

from nltk.translate.bleu_score import corpus_bleu
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

from nltk.translate.bleu_score import corpus_bleu
from nltk.translate.chrf_score import corpus_chrf
from rouge_score import rouge_scorer

from translating import translate_tunisian_to_english   # import your translation function


# -------------------------------------------
# Embedded Test Dataset (Tunisian → English)
# -------------------------------------------
TEST_TN = [
    "عسلامة، نحب نترجم الوثيقة هذي قبل نهار الجمعة.",
    "قداه يكلف ترجمة الشهادة هذي؟",
    "نحب نعرّف وقتاش تكون الترجمة جاهزة؟",
    "يلزم الترجمة تكون رسمية بختم المترجم.",
    
]

TEST_EN = [
    "Hello, I want this document translated before Friday.",
    "How much does the translation of this certificate cost?",
    "I want to know when the translation will be ready.",
    "The translation must be official and stamped by the translator.",
]


# -------------------------------------------
# Evaluation function
# -------------------------------------------
def evaluate_model():

    tn_data = TEST_TN
    en_refs = TEST_EN

    predictions = []
    references = []

    print("Evaluating on", len(tn_data), "examples...")

    for tn, ref in zip(tn_data, en_refs):
        pred = translate_tunisian_to_english(tn)
        predictions.append(pred)
        references.append([ref])  # BLEU expects list of lists

        print("\nTunisian:", tn)
        print("Reference:", ref)
        print("Prediction:", pred)
        print("-" * 60)

    # -------------------
    # BLEU score
    # -------------------
    bleu_score = corpus_bleu(
        references,
        [p.split() for p in predictions]
    )

    # -------------------
    # chrF score
    # -------------------
    chrf_score = corpus_chrf(references, predictions)

    # -------------------
    # ROUGE-L score
    # -------------------
    scorer = rouge_scorer.RougeScorer(["rougeL"], use_stemmer=True)
    rouge_scores = []

    for ref, pred in zip(references, predictions):
        score = scorer.score(ref[0], pred)["rougeL"].fmeasure
        rouge_scores.append(score)

    rougeL = sum(rouge_scores) / len(rouge_scores)

    print("\n=========== METRICS ===========")
    print("BLEU Score: ", bleu_score)
    print("chrF Score:", chrf_score)
    print("ROUGE-L:   ", rougeL)


# -------------------------------------------
# Main
# -------------------------------------------
if __name__ == "__main__":
    evaluate_model()
