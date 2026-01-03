""" from translator_nllb import translate_tn_to_en

# ---------------------------
# TEST TEXT (Tunisian dialect)
# ---------------------------
tn_text = """
يا خويا البارح مشيت للمارشي، لقيت الدنيا غالية برشا.
حتى الخضرة ولّات بالسّوم، ما عادش تتشرى.
"""

print("=== Tunisian Input ===")
print(tn_text)

# ---------------------------
# TRANSLATION
# ---------------------------
print("\n=== Translation ===")
translation = translate_tn_to_en(tn_text)
print(translation)
 """