"""
Enhanced Graph Builder with LLM-as-a-Judge Evaluation

Extends the standard pipeline with quality evaluation step.
Articles are evaluated before storage, and can be regenerated if quality is poor.
"""

from langgraph.graph import StateGraph
from typing import TypedDict, Optional
import time

from .logger import log
from .topic_node import generate_daily_topics
from .search_node import search_topic
from .generation_node import generate_article_text, generate_vocab_summary
from .storage_node import is_topic_in_db, save_article_to_db
from .article_evaluator import article_evaluator


# ============================================================
# Enhanced Graph State with Evaluation
# ============================================================

class TranslatorArticleStateWithEval(TypedDict):
    topic: str
    search_results: str
    article: str
    vocab_summary: str
    article_id: Optional[str]
    evaluation: Optional[dict]
    regeneration_count: int
    quality_passed: bool


# ============================================================
# Enhanced Node Implementations
# ============================================================

def build_graph_with_evaluation(
    min_quality_score: float = 70.0,
    max_regenerations: int = 2
):
    """
    Build LangGraph workflow with quality evaluation

    Args:
        min_quality_score: Minimum overall score to accept article (default: 70)
        max_regenerations: Maximum regeneration attempts for low-quality articles (default: 2)

    Returns:
        Compiled graph with evaluation loop
    """

    graph = StateGraph(TranslatorArticleStateWithEval)

    # -------------------------------
    # SEARCH NODE
    # -------------------------------
    def node_search(state: TranslatorArticleStateWithEval):
        topic = state["topic"]
        log(f"🔍 Searching for: {topic}")

        try:
            search_results = search_topic(topic)
            state["search_results"] = search_results
            log(f"✓ Retrieved {len(search_results.split())} words of context")
        except Exception as e:
            log(f"✗ Search failed: {e}", level="ERROR")
            state["search_results"] = ""

        return state

    # -------------------------------
    # ARTICLE GENERATION NODE
    # -------------------------------
    def node_generate(state: TranslatorArticleStateWithEval):
        topic = state["topic"]
        log("✍️ Generating article...")

        try:
            article = generate_article_text(
                topic=topic,
                context=state["search_results"]
            )

            state["article"] = article
            word_count = len(article.split())
            log(f"✓ Generated article ({word_count} words)")

        except Exception as e:
            log(f"✗ Generation failed: {e}", level="ERROR")
            state["article"] = ""

        return state

    # -------------------------------
    # VOCAB SUMMARY NODE
    # -------------------------------
    def node_vocab(state: TranslatorArticleStateWithEval):
        log("📚 Extracting vocabulary...")

        try:
            vocab = generate_vocab_summary(state["article"])
            state["vocab_summary"] = vocab
            log(f"✓ Extracted vocabulary")
        except Exception as e:
            log(f"✗ Vocab extraction failed: {e}", level="ERROR")
            state["vocab_summary"] = ""

        return state

    # -------------------------------
    # EVALUATION NODE (NEW!)
    # -------------------------------
    def node_evaluate(state: TranslatorArticleStateWithEval):
        log("⚖️  Evaluating article quality with LLM-as-a-Judge...")

        try:
            evaluation = article_evaluator.evaluate_article(
                article=state["article"],
                topic=state["topic"],
                search_context=state["search_results"]
            )

            state["evaluation"] = evaluation
            overall_score = evaluation["overall_score"]

            log(f"📊 Evaluation Score: {overall_score}/100")
            log(f"   Recommendation: {evaluation['recommendation']}")

            # Check if quality meets threshold
            if overall_score >= min_quality_score:
                state["quality_passed"] = True
                log(f"✅ Quality passed (>= {min_quality_score})")
            else:
                state["quality_passed"] = False
                regen_count = state.get("regeneration_count", 0)
                log(f"⚠️  Quality below threshold (< {min_quality_score})")
                log(f"   Regeneration attempt: {regen_count + 1}/{max_regenerations}")

        except Exception as e:
            log(f"✗ Evaluation failed: {e}", level="ERROR")
            # Default to passing if evaluation fails
            state["quality_passed"] = True
            state["evaluation"] = None

        return state

    # -------------------------------
    # CONDITIONAL ROUTING: REGENERATE OR STORE
    # -------------------------------
    def should_regenerate(state: TranslatorArticleStateWithEval) -> str:
        """
        Decide whether to regenerate or proceed to storage

        Returns:
            "regenerate" or "store"
        """

        if state.get("quality_passed", False):
            return "store"

        regen_count = state.get("regeneration_count", 0)

        if regen_count < max_regenerations:
            return "regenerate"
        else:
            log(f"⚠️  Max regenerations ({max_regenerations}) reached. Proceeding to storage.")
            return "store"

    # -------------------------------
    # REGENERATE NODE
    # -------------------------------
    def node_regenerate(state: TranslatorArticleStateWithEval):
        log("🔄 Regenerating article with improved prompt...")

        # Increment regeneration counter
        state["regeneration_count"] = state.get("regeneration_count", 0) + 1

        # Get feedback from evaluation
        evaluation = state.get("evaluation", {})

        # Build improved prompt with feedback
        feedback_text = ""
        if evaluation:
            perf = evaluation.get("task_performance", {})
            align = evaluation.get("alignment", {})

            issues = []

            # Extract issues from evaluation
            if perf.get("usefulness", {}).get("score", 100) < 70:
                issues.append(f"Improve usefulness: {perf['usefulness'].get('explanation', '')}")

            if perf.get("factuality", {}).get("score", 100) < 70:
                errors = perf.get("factuality", {}).get("errors", [])
                if errors:
                    issues.append(f"Fix factual errors: {', '.join(errors)}")

            if perf.get("relevance", {}).get("score", 100) < 70:
                issues.append(f"Improve relevance: {perf['relevance'].get('explanation', '')}")

            if align.get("tone", {}).get("score", 100) < 70:
                issues.append(f"Adjust tone: {', '.join(align['tone'].get('tone_issues', []))}")

            if align.get("style", {}).get("score", 100) < 70:
                issues.append(f"Improve style: {', '.join(align['style'].get('style_issues', []))}")

            if issues:
                feedback_text = "\n\nIMPROVEMENT NEEDED:\n" + "\n".join(f"- {issue}" for issue in issues)

        # Enhanced prompt for regeneration
        enhanced_prompt = f"""
        Write a professional English article (300–400 words) about "{state['topic']}".
        Use the following context as background material:
        {state['search_results']}

        Requirements:
        - Tone: professional, factual, and educational (not promotional or opinion-based).
        - Structure: 3–4 paragraphs with a clear introduction, body, and conclusion.
        - Style: clear, fluent, and vocabulary-rich (C1 level English).
        - Include domain-specific terminology naturally in the text.
        - Avoid repetition or generic filler phrases.
        - Ensure ALL facts are accurate and verifiable.
        - Stay strictly focused on the topic.
        {feedback_text}
        """

        try:
            from src.llm_client import call_llm
            article = call_llm(enhanced_prompt, temperature=0.7, max_tokens=1200)

            state["article"] = article
            log(f"✓ Regenerated article (attempt {state['regeneration_count']})")

            # Regenerate vocab too
            vocab = generate_vocab_summary(article)
            state["vocab_summary"] = vocab

        except Exception as e:
            log(f"✗ Regeneration failed: {e}", level="ERROR")

        return state

    # -------------------------------
    # STORAGE NODE
    # -------------------------------
    def node_store(state: TranslatorArticleStateWithEval):
        log("💾 Storing article...")

        try:
            article_id = save_article_to_db(
                topic=state["topic"],
                article=state["article"],
                vocab_summary=state["vocab_summary"],
                author="LLM"
            )

            if article_id:
                state["article_id"] = article_id
                log(f"✓ Stored successfully (ID: {article_id[:12]}...)")

                # Log final evaluation score
                if state.get("evaluation"):
                    log(f"   Final Quality Score: {state['evaluation']['overall_score']}/100")
            else:
                log("⚠️ Storage returned no ID", level="WARNING")

        except Exception as e:
            log(f"✗ Storage failed: {e}", level="ERROR")
            state["article_id"] = None

        return state

    # -------------------------------
    # BUILD GRAPH
    # -------------------------------

    # Add nodes
    graph.add_node("search", node_search)
    graph.add_node("generate", node_generate)
    graph.add_node("vocab", node_vocab)
    graph.add_node("evaluate", node_evaluate)
    graph.add_node("regenerate", node_regenerate)
    graph.add_node("store", node_store)

    # Define flow
    graph.set_entry_point("search")

    graph.add_edge("search", "generate")
    graph.add_edge("generate", "vocab")
    graph.add_edge("vocab", "evaluate")

    # Conditional routing after evaluation
    graph.add_conditional_edges(
        "evaluate",
        should_regenerate,
        {
            "regenerate": "regenerate",  # Go to regenerate node
            "store": "store"              # Quality passed → store
        }
    )

    # After regeneration, go back to evaluate
    graph.add_edge("regenerate", "evaluate")

    return graph.compile()


# ============================================================
# Run Daily Articles with Evaluation
# ============================================================

def run_daily_articles_with_evaluation(
    topics: list = None,
    quality_threshold: float = 70.0,
    max_regeneration_attempts: int = 2
) -> list:
    """
    Generate articles with quality evaluation and regeneration loop

    Args:
        topics: List of topics to generate articles for (required)
        quality_threshold: Minimum quality threshold (0-100)
        max_regeneration_attempts: Max regeneration attempts per article

    Returns:
        List of generated article results with evaluation details
    """

    if not topics:
        raise ValueError("Topics list is required")

    log(f"🚀 Starting article generation with LLM-as-a-Judge evaluation")
    log(f"   Quality threshold: {quality_threshold}/100")
    log(f"   Max regenerations: {max_regeneration_attempts}")

    pipeline_start = time.time()

    # Use provided topics instead of generating
    log(f"📋 Received {len(topics)} topics: {topics}")

    # Build graph with evaluation
    compiled_graph = build_graph_with_evaluation(quality_threshold, max_regeneration_attempts)

    results = []
    generated = 0
    skipped = 0
    total_regenerations = 0
    quality_scores = []

    for idx, topic in enumerate(topics, 1):
        log(f"\n{'='*80}")
        log(f"Processing topic {idx}/{len(topics)}: {topic}")
        log(f"{'='*80}")

        # Check for duplicates
        if is_topic_in_db(topic):
            log(f"⊘ Topic already exists — skipping")
            skipped += 1
            continue

        # Initialize state
        initial_state: TranslatorArticleStateWithEval = {
            "topic": topic,
            "search_results": "",
            "article": "",
            "vocab_summary": "",
            "article_id": None,
            "evaluation": None,
            "regeneration_count": 0,
            "quality_passed": False
        }

        # Execute graph
        try:
            final_state = compiled_graph.invoke(initial_state)

            if final_state.get("article_id"):
                results.append({
                    "topic": topic,
                    "article": final_state["article"],
                    "vocab_summary": final_state["vocab_summary"],
                    "article_id": final_state["article_id"],
                    "evaluation": final_state.get("evaluation"),
                    "regeneration_count": final_state.get("regeneration_count", 0)
                })
                generated += 1
                total_regenerations += final_state.get("regeneration_count", 0)

                # Track quality scores
                if final_state.get("evaluation"):
                    quality_scores.append(final_state["evaluation"]["overall_score"])

                log(f"✅ Article completed (regenerations: {final_state.get('regeneration_count', 0)})")
            else:
                log("✗ Article generation failed", level="ERROR")
                skipped += 1

        except Exception as e:
            log(f"✗ Error processing topic: {e}", level="ERROR")
            skipped += 1

    # Calculate statistics
    total_duration = time.time() - pipeline_start
    avg_quality = sum(quality_scores) / len(quality_scores) if quality_scores else 0

    log(f"\n{'='*80}")
    log("PIPELINE COMPLETE")
    log(f"{'='*80}")
    log(f"✓ Generated: {generated}")
    log(f"⊘ Skipped: {skipped}")
    log(f"🔄 Total regenerations: {total_regenerations}")
    log(f"📊 Average quality: {avg_quality:.1f}/100")
    log(f"⏱️  Duration: {total_duration:.1f}s")

    return results
