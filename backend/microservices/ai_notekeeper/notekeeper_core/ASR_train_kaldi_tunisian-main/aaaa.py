# -*- coding: utf-8 -*-

# Test sentences
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

# For demo, prediction = reference
predictions = TEST_EN  # Replace with your model predictions

# Print each sentence in the requested format
for tn, ref, pred in zip(TEST_TN, TEST_EN, predictions):
    print(f"Tunisian : {tn}")
    print(f"Reference : {ref}")
    print(f"Prediction : {pred}")
    print("\n" + "-"*120 + "\n")  # separator for readability
