from .llm_client import call_llm
import re

def generate_daily_topics(n: int = 5) -> list[str]:
    """
    Generate N domain-diverse and current topics for educational articles.
    Each topic should belong to a different field of knowledge.
    """
    prompt = f"""
    Generate exactly {n} current, diverse, and professional topics for short English articles.
    Each topic should represent a different field (e.g., technology, medicine, law, environment, culture, economics, news, etc..).
    Format your response as a simple numbered list with no introduction or commentary.
    Example:
    1. The Impact of Artificial Intelligence on Legal Systems
    2. Advances in Medical Imaging Technology
    3. Global Economic Recovery After the Pandemic
    """
    response = call_llm(prompt, temperature=0.7, max_tokens=250)
    print("the llm query generation output : \n",response)

    # Extract only numbered topics
    import re
    topics = re.findall(r'\d+\.\s*(.+)', response)
    return [t.strip(" -*_") for t in topics if len(t.split()) > 1]
