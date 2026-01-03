"""
Tool Service
Handles language detection, verification, and document status tools.
"""

import re
import logging
from typing import Optional, Dict, Any, Tuple

from client_data import find_client_by_cin, find_client_by_name

logger = logging.getLogger(__name__)


def detect_language(message: str) -> str:
    """
    Detect if message is in French or Arabic.
    
    Args:
        message: Input message text
        
    Returns:
        'french' or 'arabic'
    """
    lower_msg = message.lower()
    
    # French keywords
    french_keywords = [
        "bonjour", "merci", "document", "status", "est-ce",
        "quel", "comment", "client", "liste"
    ]
    
    has_french = any(keyword in lower_msg for keyword in french_keywords)
    
    return "french" if has_french else "arabic"


def extract_verification_data(message: str) -> Optional[Dict[str, str]]:
    """
    Extract verification data (CIN or name) from message.
    
    Args:
        message: Input message text
        
    Returns:
        Dict with 'cin' or 'name' key, or None
    """
    # Try to extract 8-digit CIN
    cin_match = re.search(r'\b\d{8}\b', message)
    if cin_match:
        return {"cin": cin_match.group(0)}
    
    # Try to extract name patterns
    name_patterns = [
        r'(?:name|nom|اسم|اسمي)\s*:?\s*([a-zA-Z\s]+)',
        r'(?:je suis|i am|أنا)\s+([a-zA-Z\s]+)',
        r'^([A-Z][a-z]+\s+[A-Z][a-z]+)$',
    ]
    
    for pattern in name_patterns:
        match = re.search(pattern, message, re.IGNORECASE)
        if match:
            return {"name": match.group(1).strip()}
    
    return None


def detect_tool_needed(message: str) -> Optional[Dict[str, str]]:
    """
    Detect if message requires a tool call.
    
    Args:
        message: Input message text
        
    Returns:
        Dict with 'tool' key if tool needed, else None
    """
    lower_msg = message.lower()
    
    # Document status query keywords (multilingual)
    document_keywords = [
        "document", "وثيقة", "وثائق", "status", "حالة", "état",
        "ready", "جاهز", "prêt", "وين وصلت", "où est"
    ]
    
    has_document_query = any(keyword in lower_msg for keyword in document_keywords)
    
    if has_document_query:
        return {"tool": "check_document"}
    
    return None


def execute_local_tool(
    tool_info: Dict[str, str],
    language: str,
    verification_data: Optional[Dict[str, str]],
    user_phone: Optional[str] = None
) -> Dict[str, Any]:
    """
    Execute a local tool with verification.
    
    Args:
        tool_info: Tool information dict with 'tool' key
        language: 'french' or 'arabic'
        verification_data: Optional verification data
        user_phone: User's phone number
        
    Returns:
        Tool result with message
    """
    if tool_info.get("tool") == "check_document":
        # Try to find client by verification data
        client = None
        
        if verification_data:
            if verification_data.get("cin"):
                client = find_client_by_cin(verification_data["cin"])
            elif verification_data.get("name"):
                client = find_client_by_name(verification_data["name"])
        
        if not client:
            # Ask for verification
            if language == "french":
                return {
                    "needsVerification": True,
                    "message": (
                        '🔐 Pour des raisons de sécurité, veuillez fournir votre nom complet '
                        'ou numéro CIN (8 chiffres) pour vérifier votre identité.\n\n'
                        'Exemple: "Mon CIN est 12345678" ou "Je suis John Doe"'
                    ),
                }
            else:
                return {
                    "needsVerification": True,
                    "message": (
                        '🔐 لأسباب أمنية، يرجى تقديم اسمك الكامل أو رقم بطاقة التعريف الوطنية '
                        '(8 أرقام) للتحقق من هويتك.\n\n'
                        'مثال: "رقم بطاقتي 12345678" أو "أنا John Doe"'
                    ),
                }
        
        # Client found, return their document status
        if language == "french":
            status_text = "TERMINÉ ✓" if client["status"] == "done" else "EN ATTENTE ⏳"
            return {
                "verified": True,
                "message": (
                    f"✅ Identité vérifiée\n\n"
                    f"Statut du document pour {client['name']}:\n"
                    f"📄 Document: {client['document']}\n"
                    f"✅ Statut: {status_text}\n"
                    f"📅 Date de soumission: {client['submission_date']}\n"
                    f"🆔 Référence: {client['client_id']}"
                ),
            }
        else:
            status_text = "جاهزة ✓" if client["status"] == "done" else "قيد المعالجة ⏳"
            return {
                "verified": True,
                "message": (
                    f"✅ تم التحقق من الهوية\n\n"
                    f"حالة الوثيقة للسيد/ة {client['name']}:\n"
                    f"📄 الوثيقة: {client['document']}\n"
                    f"✅ الحالة: {status_text}\n"
                    f"📅 تاريخ التقديم: {client['submission_date']}\n"
                    f"🆔 المرجع: {client['client_id']}"
                ),
            }
    
    return {"error": "Unknown tool"}
