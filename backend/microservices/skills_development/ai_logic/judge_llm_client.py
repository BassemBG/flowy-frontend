"""
Dedicated LLM Client for Evaluation (Judge Model)

Separate from the generation model to enable:
- Using a different, potentially more capable model for evaluation
- Different configuration optimized for judging quality
- Independent scaling and cost management

Supports two modes:
1. API-based models (OpenAI, Anthropic, vLLM, etc.)
2. Local models via Transformers (GPT-OSS-20B, etc.)
"""

import httpx
from openai import OpenAI
import os
from dotenv import load_dotenv
from .logger import log

load_dotenv()

# ============================================================
# Judge Model Configuration
# ============================================================

# Import generation model config to use as fallback
from .config import LLM_MODEL as GENERATION_MODEL, LLM_API_KEY, LLM_BASE_URL

# Determine if using local model or API-based model
USE_LOCAL_JUDGE = os.getenv("USE_LOCAL_JUDGE", "false").lower() == "true"

if USE_LOCAL_JUDGE:
    # Local model via Transformers
    log("[JudgeLLMClient] Mode: LOCAL (Transformers-based)")
    from .local_judge_client import (
        call_local_judge_llm,
        get_local_judge_model_info,
        TASK_PERFORMANCE_SYSTEM_PROMPT as LOCAL_TASK_PROMPT,
        ALIGNMENT_SYSTEM_PROMPT as LOCAL_ALIGNMENT_PROMPT
    )

    judge_info = get_local_judge_model_info()
    log(f"[JudgeLLMClient] Local judge model: {judge_info['model']}")
    log(f"[JudgeLLMClient] Device: {judge_info['device']}")
    log(f"[JudgeLLMClient] Temperature: {judge_info['temperature']}")

    JUDGE_TEMPERATURE = judge_info['temperature']
    JUDGE_MAX_TOKENS = judge_info['max_tokens']

    # Use local system prompts
    TASK_PERFORMANCE_SYSTEM_PROMPT = LOCAL_TASK_PROMPT
    ALIGNMENT_SYSTEM_PROMPT = LOCAL_ALIGNMENT_PROMPT

else:
    # API-based model (original implementation)
    log("[JudgeLLMClient] Mode: API (OpenAI-compatible endpoint)")

    # Judge model configuration (with generation model as fallback)
    JUDGE_API_KEY = os.getenv("JUDGE_LLM_API_KEY", LLM_API_KEY)
    JUDGE_BASE_URL = os.getenv("JUDGE_LLM_BASE_URL", LLM_BASE_URL)

    # Use a specific judge model (e.g., GPT-4, Claude, or a different Llama variant)
    # If not set, falls back to the same model as generation
    # Examples:
    # - GPT-4 for judging: "gpt-4-turbo-preview"
    # - Claude for judging: "claude-3-opus-20240229"
    # - Smaller Llama: "hosted_vllm/Llama-3.1-8B-Instruct"
    # - Same as generation: Will use GENERATION_MODEL automatically
    # - Local GPT-OSS: Set USE_LOCAL_JUDGE=true instead
    JUDGE_MODEL = os.getenv("JUDGE_LLM_MODEL", GENERATION_MODEL)

    # Evaluation-specific settings
    JUDGE_TEMPERATURE = 0.2  # Lower for consistent scoring
    JUDGE_MAX_TOKENS = 1500  # Enough for detailed evaluation

    # Log configuration
    if JUDGE_MODEL == GENERATION_MODEL:
        log(f"[JudgeLLMClient] Using generation model as judge (fallback): {JUDGE_MODEL}")
        log(f"[JudgeLLMClient] Tip: Set JUDGE_LLM_MODEL in .env to use a separate judge model")
        log(f"[JudgeLLMClient] Or: Set USE_LOCAL_JUDGE=true to use local Transformers model")
    else:
        log(f"[JudgeLLMClient] ✓ Using dedicated judge model: {JUDGE_MODEL}")
        log(f"[JudgeLLMClient] Generation model: {GENERATION_MODEL}")

    log(f"[JudgeLLMClient] Judge URL: {JUDGE_BASE_URL}")
    log(f"[JudgeLLMClient] Judge temperature: {JUDGE_TEMPERATURE}")

    # ============================================================
    # HTTP Client Configuration
    # ============================================================

    # Disable SSL verification if needed (for Esprit's endpoint)
    http_client = httpx.Client(verify=False)

    # Initialize OpenAI-compatible client for judge
    judge_client = OpenAI(
        api_key=JUDGE_API_KEY,
        base_url=JUDGE_BASE_URL,
        http_client=http_client
    )

    # ============================================================
    # Specialized Judge System Prompts
    # ============================================================

    TASK_PERFORMANCE_SYSTEM_PROMPT = """You are an expert educational content evaluator specializing in assessing the quality of educational articles.

Your expertise includes:
- Pedagogical effectiveness and educational value
- Factual accuracy and verification
- Content relevance and focus
- Learning outcomes assessment

You provide structured, objective evaluations based on clear criteria."""


    ALIGNMENT_SYSTEM_PROMPT = """You are an expert writing style and tone analyst specializing in professional and educational content.

Your expertise includes:
- Professional tone assessment
- Writing style analysis
- Audience appropriateness evaluation
- Linguistic quality assessment

You provide detailed, constructive feedback on tone and style alignment."""


# ============================================================
# Judge-Specific LLM Call (Unified Interface)
# ============================================================

def call_judge_llm(
    prompt: str,
    temperature: float = None,
    max_tokens: int = None,
    system_prompt: str = "You are an expert educational content evaluator with deep knowledge of pedagogical standards, factual accuracy, and writing quality."
) -> str:
    """
    Call the judge LLM for evaluation tasks

    Unified interface that works with both API-based and local models.

    Args:
        prompt: Evaluation prompt
        temperature: Temperature for sampling (default: 0.2 for consistent evaluation)
        max_tokens: Maximum tokens to generate
        system_prompt: System prompt tailored for evaluation

    Returns:
        LLM response text
    """

    # Use default values if not provided
    if temperature is None:
        temperature = JUDGE_TEMPERATURE
    if max_tokens is None:
        max_tokens = JUDGE_MAX_TOKENS

    if USE_LOCAL_JUDGE:
        # Call local model
        return call_local_judge_llm(
            prompt=prompt,
            temperature=temperature,
            max_tokens=max_tokens,
            system_prompt=system_prompt,
            use_pipeline=False  # Use tokenizer+model for better control
        )
    else:
        # Call API-based model
        try:
            response = judge_client.chat.completions.create(
                model=JUDGE_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                temperature=temperature,
                max_tokens=max_tokens,
                top_p=0.9
            )

            result = response.choices[0].message.content.strip()

            # Log token usage for monitoring
            if hasattr(response, 'usage'):
                log(f"[JudgeLLMClient] Tokens used - Prompt: {response.usage.prompt_tokens}, "
                    f"Completion: {response.usage.completion_tokens}, "
                    f"Total: {response.usage.total_tokens}")

            return result

        except Exception as e:
            log(f"[JudgeLLMClient] Error calling judge LLM: {e}", level="ERROR")
            raise


# ============================================================
# Model Information
# ============================================================

def get_judge_model_info() -> dict:
    """
    Get information about the configured judge model

    Returns:
        Dictionary with judge model configuration
    """
    if USE_LOCAL_JUDGE:
        return get_local_judge_model_info()
    else:
        return {
            "model": JUDGE_MODEL,
            "base_url": JUDGE_BASE_URL,
            "temperature": JUDGE_TEMPERATURE,
            "max_tokens": JUDGE_MAX_TOKENS,
            "api_key_configured": bool(JUDGE_API_KEY),
            "type": "api"
        }


def is_using_separate_judge_model() -> bool:
    """
    Check if a separate judge model is configured

    Returns:
        True if using a different model than the generation model
    """
    if USE_LOCAL_JUDGE:
        return True  # Local model is always separate
    else:
        from .config import LLM_MODEL as GENERATION_MODEL
        return JUDGE_MODEL != GENERATION_MODEL
