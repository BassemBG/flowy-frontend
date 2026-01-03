from .llm_client import call_llm
from .storage_node import is_topic_in_db, save_article_to_db
from .logger import log


def generate_article_text(topic: str, context: str) -> str:
    """
    Generate a 300–400-word English article explaining the topic
    in a clear, informative, and professional tone.
    The goal is to help translators learn vocabulary and domain concepts.
    """
    prompt = f"""
    Write a professional English article (300–400 words) about "{topic}".
    Use the following context as background material:
    {context}

    Requirements:
    - Tone: formal, factual, and educational (not promotional or opinion-based).
    - Structure: 3–4 paragraphs with a clear introduction, body, and conclusion.
    - Style: clear, fluent, and vocabulary-rich (C1 level English).
    - Include domain-specific terminology naturally in the text.
    - Avoid repetition or generic filler phrases.
    """
    return call_llm(prompt, temperature=0.7, max_tokens=1200)


def generate_vocab_summary(article: str) -> str:
    """
    Generate a short vocabulary summary (key terms with definitions) from the article.
    """
    prompt = f"""
    Extract 8–12 key vocabulary terms from the following article and provide a clear, concise definition for each term based on how it's used in the article context.
    Focus on domain-specific and useful translation-related terminology.

    Format EXACTLY as follows (term: definition):
    - Term 1: Definition of term 1 in the context of this article
    - Term 2: Definition of term 2 in the context of this article
    - Term 3: Definition of term 3 in the context of this article

    Requirements:
    - Each term MUST have a definition after the colon
    - Definitions should be 1-2 sentences, contextually relevant to the article
    - Use bullet points with dashes (-)
    - Focus on technical, domain-specific vocabulary

    Article:
    {article}
    """
    return call_llm(prompt, temperature=0.3, max_tokens=600)



#from src.llm_client import call_llm

# def generate_article(topic: str, context: str) -> str:
#     """
#     Generate a 300–400-word English article explaining the topic
#     in a clear, informative, and professional tone.
#     The goal is to help translators learn vocabulary and domain concepts.
#     """
#     prompt = f"""
#     Write professional English article (300–400 words) about "{topic}".
#     Use the following context as background material:
#     {context}

#     Requirements:
#     - Tone: formal, factual, and educational (not promotional or opinion-based).
#     - Structure: 3–4 paragraphs with a clear introduction, body, and conclusion.
#     - Style: clear, fluent, and vocabulary-rich (C1 level English).
#     - Include domain-specific terminology naturally in the text.
#     """
#     return call_llm(prompt, temperature=0.7, max_tokens=1200)



# def generate_and_store_article(topic: str, context: str):
#     """
#     Main pipeline step:
#     - Check if topic already exists in ChromaDB.
#     - Generate article with LLM.
#     - Generate vocabulary summary.
#     - Save to ChromaDB.
#     """
#     log(f"[GenerationNode] 🔍 Checking if '{topic}' exists in ChromaDB...")

#     # Step 1 — Avoid duplicate topics
#     if is_topic_in_db(topic):
#         log(f"[GenerationNode] Topic '{topic}' already exists. Skipping generation.")
#         return None

#     # Step 2 — Generate main article
#     log(f"[GenerationNode] 🧠 Generating article for: {topic}")
#     article = generate_article_text(topic, context)

#     # Step 3 — Generate vocabulary summary
#     log(f"[GenerationNode] 📝 Generating vocabulary summary for: {topic}")
#     vocab_summary = generate_vocab_summary(article)

#     # Step 4 — Save everything in ChromaDB
#     save_article_to_db(topic, article, vocab_summary, author="LLM")

#     log(f"[GenerationNode] ✅ Article '{topic}' successfully generated and stored.")
#     return article
