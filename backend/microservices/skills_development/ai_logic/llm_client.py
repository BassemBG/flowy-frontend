
"""
LLM Client for Translation Quality Assessment
"""
import httpx
from openai import OpenAI
from .config import LLM_API_KEY, LLM_BASE_URL, LLM_MODEL
# from config import LLM_API_KEY, LLM_BASE_URL, LLM_MODEL
from typing import Dict, Any
import json

# Disable SSL verification (as required by Esprit's endpoint)
http_client = httpx.Client(verify=False)

client = OpenAI(
    api_key=LLM_API_KEY,
    base_url=LLM_BASE_URL,
    http_client=http_client
)


def call_llm(prompt: str, temperature: float = 0.7, max_tokens: int = 500) -> str:
    """Call the hosted LLaMA model and return the completion text."""
    response = client.chat.completions.create(
        model=LLM_MODEL,
        messages=[
            {"role": "system", "content": "You are a professional writing assistant."},
            {"role": "user", "content": prompt}
        ],
        temperature=temperature,
        max_tokens=max_tokens,
        top_p=0.9
    )
    return response.choices[0].message.content.strip()


class TranslationLLMEvaluator:
    """LLM-based evaluator for translation quality"""
    
    def __init__(self):
        self.client = client
        self.model = LLM_MODEL
    
    def evaluate_semantic_similarity(self, original: str, translation: str) -> Dict[str, Any]:
        """
        Evaluate semantic similarity between original and translated text
        Returns score (0-100) and explanation
        """
        prompt = f"""You are an expert translation evaluator. Compare the original text with the spoken translation and evaluate how well the meaning is preserved.

        Original Text:
        {original}

        Spoken Translation:
        {translation}

        Evaluate the translation on these criteria:
        1. Meaning preservation (does it convey the same ideas?)
        2. Completeness (are all key points covered?)
        3. Accuracy (are there any mistranslations or distortions?)

        Provide your evaluation in JSON format:
        {{
            "score": <number 0-100>,
            "meaning_preservation": <number 0-100>,
            "completeness": <number 0-100>,
            "accuracy": <number 0-100>,
            "strengths": ["list", "of", "strengths"],
            "weaknesses": ["list", "of", "weaknesses"],
            "explanation": "brief explanation"
        }}

        Respond ONLY with valid JSON, no additional text."""

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are an expert translation quality evaluator. Always respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=800
        )
        
        try:
            result = json.loads(response.choices[0].message.content.strip())
            return result
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            return {
                "score": 50,
                "meaning_preservation": 50,
                "completeness": 50,
                "accuracy": 50,
                "strengths": [],
                "weaknesses": ["Could not parse evaluation"],
                "explanation": "Error in evaluation"
            }
    
    def evaluate_grammar(self, text: str, language: str = "en") -> Dict[str, Any]:
        """
        Evaluate grammar quality of the translation
        """
        prompt = f"""You are an expert language teacher. Evaluate the grammatical quality of this {language} text.

        Text to evaluate:
        {text}

        Check for:
        1. Grammar errors (verb tenses, agreement, sentence structure)
        2. Syntax issues
        3. Natural language flow
        4. Professional language usage

        Provide your evaluation in JSON format:
        {{
            "score": <number 0-100>,
            "error_count": <number>,
            "error_types": ["list", "of", "error", "types"],
            "errors": [
                {{"type": "error type", "example": "specific example", "correction": "suggested fix"}}
            ],
            "overall_quality": "excellent/good/fair/poor",
            "explanation": "brief explanation"
        }}

        Respond ONLY with valid JSON, no additional text."""

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are an expert language teacher and grammar checker. Always respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=800
        )
        
        try:
            result = json.loads(response.choices[0].message.content.strip())
            return result
        except json.JSONDecodeError:
            return {
                "score": 50,
                "error_count": 0,
                "error_types": [],
                "errors": [],
                "overall_quality": "unknown",
                "explanation": "Error in evaluation"
            }
    
    def evaluate_terminology(self, original: str, translation: str, key_terms: list) -> Dict[str, Any]:
        """
        Evaluate whether key terminology is correctly used/translated
        """
        terms_list = ", ".join(key_terms)
        
        prompt = f"""You are an expert in technical translation. Evaluate whether the key terms from the original text are correctly used or appropriately translated.

        Original Text:
        {original}

        Spoken Translation:
        {translation}

        Key Terms to Check: {terms_list}

        For each key term, check:
        1. Is it present or appropriately translated?
        2. Is it used correctly in context?
        3. Is the technical meaning preserved?

        Provide your evaluation in JSON format:
        {{
            "score": <number 0-100>,
            "terms_found": <number>,
            "terms_total": <number>,
            "term_analysis": [
                {{"term": "term name", "found": true/false, "usage": "correct/incorrect/missing", "note": "explanation"}}
            ],
            "explanation": "brief explanation"
        }}

        Respond ONLY with valid JSON, no additional text."""

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are an expert in technical and domain-specific terminology. Always respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=1000
        )
        
        try:
            result = json.loads(response.choices[0].message.content.strip())
            return result
        except json.JSONDecodeError:
            return {
                "score": 50,
                "terms_found": 0,
                "terms_total": len(key_terms),
                "term_analysis": [],
                "explanation": "Error in evaluation"
            }
    
    def evaluate_fluency(self, text: str, language: str = "en") -> Dict[str, Any]:
        """
        Evaluate the fluency and naturalness of the translation
        """
        prompt = f"""You are an expert in language fluency assessment. Evaluate how natural and fluent this {language} text sounds.

        Text to evaluate:
        {text}

        Assess:
        1. Natural flow and rhythm
        2. Appropriate word choice
        3. Coherence and cohesion
        4. Professional tone
        5. Whether it sounds like a native speaker

        Provide your evaluation in JSON format:
        {{
            "score": <number 0-100>,
            "naturalness": "native-like/fluent/understandable/awkward",
            "coherence": <number 0-100>,
            "tone": "appropriate/inappropriate",
            "issues": ["list", "of", "fluency", "issues"],
            "explanation": "brief explanation"
        }}

        Respond ONLY with valid JSON, no additional text."""

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are an expert in language fluency and naturalness assessment. Always respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=600
        )
        
        try:
            result = json.loads(response.choices[0].message.content.strip())
            return result
        except json.JSONDecodeError:
            return {
                "score": 50,
                "naturalness": "unknown",
                "coherence": 50,
                "tone": "unknown",
                "issues": [],
                "explanation": "Error in evaluation"
            }

