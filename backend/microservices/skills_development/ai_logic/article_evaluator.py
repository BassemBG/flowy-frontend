"""
LLM-as-a-Judge Article Evaluation Module

Evaluates generated articles based on:
1. Task Performance: Usefulness, Factuality, Relevance
2. Alignment: Tone, Style

Uses a dedicated judge LLM model (separate from generation model) for evaluation.
"""

import json
import time
from typing import Dict, Any, Optional, List
from .judge_llm_client import (
    call_judge_llm,
    TASK_PERFORMANCE_SYSTEM_PROMPT,
    ALIGNMENT_SYSTEM_PROMPT,
    get_judge_model_info,
    is_using_separate_judge_model
)
from .logger import log


class ArticleEvaluator:
    """LLM-based evaluator for generated articles using dedicated judge model"""

    def __init__(self, temperature: float = 0.2):
        """
        Initialize evaluator

        Args:
            temperature: Lower temperature for more consistent evaluations (default: 0.2)
        """
        self.temperature = temperature

        # Log judge model configuration
        judge_info = get_judge_model_info()
        is_separate = is_using_separate_judge_model()

        log(f"[ArticleEvaluator] Initialized with judge model: {judge_info['model']}")
        if is_separate:
            log("[ArticleEvaluator] ✓ Using separate model for evaluation (recommended)")
        else:
            log("[ArticleEvaluator] Using same model as generation")

    def evaluate_article(
        self,
        article: str,
        topic: str,
        search_context: Optional[str] = None,
        target_audience: str = "translator students",
        expected_tone: str = "professional, educational",
        expected_style: str = "formal, factual, informative"
    ) -> Dict[str, Any]:
        """
        Comprehensive article evaluation

        Args:
            article: The generated article text
            topic: The article topic
            search_context: Original search results used for generation (for factuality check)
            target_audience: Expected audience
            expected_tone: Expected tone
            expected_style: Expected writing style

        Returns:
            Dictionary with evaluation scores and detailed feedback
        """

        log("[ArticleEvaluator] Starting comprehensive evaluation...")

        # Add delay before first call to avoid triggering rate limits
        log("[ArticleEvaluator] Waiting 5 seconds before first evaluation call...")
        time.sleep(5)

        # Evaluate task performance
        performance_eval = self.evaluate_task_performance(
            article=article,
            topic=topic,
            search_context=search_context
        )

        # Add delay between API calls to avoid firewall rate limiting
        log("[ArticleEvaluator] Waiting 7 seconds before next evaluation call...")
        time.sleep(7)

        # Evaluate alignment
        alignment_eval = self.evaluate_alignment(
            article=article,
            target_audience=target_audience,
            expected_tone=expected_tone,
            expected_style=expected_style
        )

        # Combine results
        overall_score = self._calculate_overall_score(performance_eval, alignment_eval)

        result = {
            "overall_score": overall_score,
            "task_performance": performance_eval,
            "alignment": alignment_eval,
            "recommendation": self._generate_recommendation(overall_score),
            "should_regenerate": overall_score < 70
        }

        log(f"[ArticleEvaluator] Overall Score: {overall_score}/100")

        return result

    def evaluate_task_performance(
        self,
        article: str,
        topic: str,
        search_context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Evaluate task performance: usefulness, factuality, relevance

        Args:
            article: The article text
            topic: The topic
            search_context: Search results for factuality verification

        Returns:
            Dictionary with performance metrics
        """

        context_info = ""
        if search_context:
            context_info = f"""

        **Reference Context** (from web search):
        {search_context[:1000]}...

        Use this context to verify factual accuracy.
        """

        prompt = f"""You are an expert educational content evaluator. Evaluate the following article on **Task Performance** criteria.

        **Topic**: {topic}

        **Article**:
        {article}
        {context_info}

        Evaluate the article on these THREE criteria:

        1. **Usefulness (0-100)**
           - Does it provide valuable information for translator students?
           - Are the explanations clear and educational?
           - Does it include practical examples or domain-specific vocabulary?
           - Would a reader learn something meaningful?

        2. **Factuality (0-100)**
           - Are the facts presented accurate and verifiable?
           - Are there any misleading or incorrect statements?
           - Does it align with the reference context (if provided)?
           - Are claims properly supported?

        3. **Relevance (0-100)**
           - Does the article stay focused on the topic?
           - Are all sections relevant to the main subject?
           - Does it avoid unnecessary tangents or off-topic content?
           - Is the depth of coverage appropriate for the topic?

        **Output Format** (JSON only, no additional text):
        {{
            "usefulness": {{
                "score": <number 0-100>,
                "explanation": "detailed explanation of usefulness assessment",
                "strengths": ["strength 1", "strength 2"],
                "weaknesses": ["weakness 1", "weakness 2"]
            }},
            "factuality": {{
                "score": <number 0-100>,
                "explanation": "detailed explanation of factuality assessment",
                "verified_facts": ["fact 1", "fact 2"],
                "questionable_claims": ["claim 1 if any"],
                "errors": ["error 1 if any"]
            }},
            "relevance": {{
                "score": <number 0-100>,
                "explanation": "detailed explanation of relevance assessment",
                "on_topic_sections": ["section 1", "section 2"],
                "off_topic_sections": ["section if any"]
            }},
            "average_score": <average of three scores>
        }}

        Respond ONLY with valid JSON, no markdown formatting or additional text.
        """

        try:
            response = call_judge_llm(
                prompt,
                temperature=self.temperature,
                max_tokens=1200,
                system_prompt=TASK_PERFORMANCE_SYSTEM_PROMPT
            )

            # Clean response (remove markdown formatting if present)
            response = response.strip()
            if response.startswith("```json"):
                response = response[7:]
            if response.startswith("```"):
                response = response[3:]
            if response.endswith("```"):
                response = response[:-3]
            response = response.strip()

            result = json.loads(response)
            log("[ArticleEvaluator] Task performance evaluation completed")
            return result

        except json.JSONDecodeError as e:
            log(f"[ArticleEvaluator] JSON parsing error: {e}", level="ERROR")
            log(f"[ArticleEvaluator] Raw response: {response}", level="ERROR")

            # Return default scores if parsing fails
            return {
                "usefulness": {"score": 50, "explanation": "Evaluation failed", "strengths": [], "weaknesses": []},
                "factuality": {"score": 50, "explanation": "Evaluation failed", "verified_facts": [], "questionable_claims": [], "errors": []},
                "relevance": {"score": 50, "explanation": "Evaluation failed", "on_topic_sections": [], "off_topic_sections": []},
                "average_score": 50
            }

    def evaluate_alignment(
        self,
        article: str,
        target_audience: str = "translator students",
        expected_tone: str = "professional, educational",
        expected_style: str = "formal, factual, informative"
    ) -> Dict[str, Any]:
        """
        Evaluate alignment: tone and style

        Args:
            article: The article text
            target_audience: Expected target audience
            expected_tone: Expected tone
            expected_style: Expected writing style

        Returns:
            Dictionary with alignment metrics
        """

        prompt = f"""You are an expert writing style and tone evaluator. Evaluate the following article on **Alignment** criteria.

        **Article**:
        {article}

        **Expected Characteristics**:
        - Target Audience: {target_audience}
        - Expected Tone: {expected_tone}
        - Expected Style: {expected_style}

        Evaluate the article on these TWO criteria:

        1. **Tone (0-100)**
           - Does the tone match the expected "{expected_tone}"?
           - Is it appropriate for {target_audience}?
           - Is the tone consistent throughout?
           - Does it maintain the right level of formality?
           - Is it engaging without being overly casual or too dry?

        2. **Style (0-100)**
           - Does the writing style match "{expected_style}"?
           - Is the language clear and accessible for the target audience?
           - Are sentences well-structured and easy to follow?
           - Is vocabulary appropriate (C1 level English for translators)?
           - Does it use domain-specific terminology correctly?
           - Is the paragraph structure logical and coherent?

        **Output Format** (JSON only, no additional text):
        {{
            "tone": {{
                "score": <number 0-100>,
                "explanation": "detailed explanation of tone assessment",
                "matches_expected": true/false,
                "tone_characteristics": ["characteristic 1", "characteristic 2"],
                "tone_issues": ["issue 1 if any"]
            }},
            "style": {{
                "score": <number 0-100>,
                "explanation": "detailed explanation of style assessment",
                "matches_expected": true/false,
                "style_strengths": ["strength 1", "strength 2"],
                "style_issues": ["issue 1 if any"],
                "vocabulary_level": "appropriate/too simple/too complex"
            }},
            "average_score": <average of two scores>
        }}

        Respond ONLY with valid JSON, no markdown formatting or additional text.
        """

        try:
            response = call_judge_llm(
                prompt,
                temperature=self.temperature,
                max_tokens=1000,
                system_prompt=ALIGNMENT_SYSTEM_PROMPT
            )

            # Clean response
            response = response.strip()
            if response.startswith("```json"):
                response = response[7:]
            if response.startswith("```"):
                response = response[3:]
            if response.endswith("```"):
                response = response[:-3]
            response = response.strip()

            result = json.loads(response)
            log("[ArticleEvaluator] Alignment evaluation completed")
            return result

        except json.JSONDecodeError as e:
            log(f"[ArticleEvaluator] JSON parsing error: {e}", level="ERROR")
            log(f"[ArticleEvaluator] Raw response: {response}", level="ERROR")

            # Return default scores if parsing fails
            return {
                "tone": {"score": 50, "explanation": "Evaluation failed", "matches_expected": False, "tone_characteristics": [], "tone_issues": []},
                "style": {"score": 50, "explanation": "Evaluation failed", "matches_expected": False, "style_strengths": [], "style_issues": [], "vocabulary_level": "unknown"},
                "average_score": 50
            }

    def _calculate_overall_score(
        self,
        performance_eval: Dict[str, Any],
        alignment_eval: Dict[str, Any],
        performance_weight: float = 0.6,
        alignment_weight: float = 0.4
    ) -> float:
        """
        Calculate weighted overall score

        Args:
            performance_eval: Task performance evaluation results
            alignment_eval: Alignment evaluation results
            performance_weight: Weight for performance (default: 60%)
            alignment_weight: Weight for alignment (default: 40%)

        Returns:
            Overall score (0-100)
        """

        performance_score = performance_eval.get("average_score", 50)
        alignment_score = alignment_eval.get("average_score", 50)

        overall = (performance_score * performance_weight) + (alignment_score * alignment_weight)

        return round(overall, 2)

    def _generate_recommendation(self, overall_score: float) -> str:
        """
        Generate recommendation based on overall score

        Args:
            overall_score: Overall quality score

        Returns:
            Recommendation string
        """

        if overall_score >= 90:
            return "Excellent quality - Ready to publish"
        elif overall_score >= 80:
            return "Good quality - Minor improvements recommended"
        elif overall_score >= 70:
            return "Acceptable quality - Some improvements needed"
        elif overall_score >= 60:
            return "Below standard - Significant improvements required"
        else:
            return "Poor quality - Regeneration strongly recommended"

    def generate_evaluation_report(self, evaluation: Dict[str, Any]) -> str:
        """
        Generate human-readable evaluation report

        Args:
            evaluation: Evaluation results dictionary

        Returns:
            Formatted report string
        """

        report = []
        report.append("=" * 80)
        report.append("ARTICLE QUALITY EVALUATION REPORT")
        report.append("=" * 80)
        report.append("")

        # Overall score
        report.append(f"Overall Score: {evaluation['overall_score']}/100")
        report.append(f"Recommendation: {evaluation['recommendation']}")
        report.append("")

        # Task Performance
        report.append("-" * 80)
        report.append("TASK PERFORMANCE")
        report.append("-" * 80)

        perf = evaluation['task_performance']

        report.append(f"\n1. Usefulness: {perf['usefulness']['score']}/100")
        report.append(f"   {perf['usefulness']['explanation']}")
        if perf['usefulness'].get('strengths'):
            report.append(f"   Strengths: {', '.join(perf['usefulness']['strengths'])}")

        report.append(f"\n2. Factuality: {perf['factuality']['score']}/100")
        report.append(f"   {perf['factuality']['explanation']}")
        if perf['factuality'].get('errors'):
            report.append(f"   ⚠️ Errors: {', '.join(perf['factuality']['errors'])}")

        report.append(f"\n3. Relevance: {perf['relevance']['score']}/100")
        report.append(f"   {perf['relevance']['explanation']}")

        # Alignment
        report.append("\n" + "-" * 80)
        report.append("ALIGNMENT")
        report.append("-" * 80)

        align = evaluation['alignment']

        report.append(f"\n1. Tone: {align['tone']['score']}/100")
        report.append(f"   {align['tone']['explanation']}")
        report.append(f"   Matches Expected: {align['tone']['matches_expected']}")

        report.append(f"\n2. Style: {align['style']['score']}/100")
        report.append(f"   {align['style']['explanation']}")
        report.append(f"   Vocabulary Level: {align['style'].get('vocabulary_level', 'N/A')}")

        report.append("\n" + "=" * 80)

        return "\n".join(report)


# Singleton instance
article_evaluator = ArticleEvaluator()
