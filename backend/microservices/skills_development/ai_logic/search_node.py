from tavily import TavilyClient
from .config import TAVILY_API_KEY

client = TavilyClient(api_key=TAVILY_API_KEY)

def search_topic(topic: str) -> str:
    """Retrieve relevant articles or blog summaries for a given topic."""
    try:
        results = client.search(topic)
        print(results)
        summaries = [r['content'] for r in results.get('results', [])[:3]]
        return "\n\n".join(summaries)
    except Exception as e:
        return f"Search failed for topic '{topic}': {e}"
