"""
Mock database for client documents.
Ported from FINAL-PROJECT/whatsapp-webhook/clientData.js
"""

from typing import Optional, Dict, Any, List

# Mock database for client documents
client_documents: List[Dict[str, Any]] = [
    {
        "client_id": "1234",
        "cin": "12345678",
        "name": "John Doe",
        "document": "passport",
        "status": "done",
        "submission_date": "2025-12-01",
    },
    {
        "client_id": "5678",
        "cin": "87654321",
        "name": "Jane Smith",
        "document": "ID card",
        "status": "pending",
        "submission_date": "2025-12-05",
    },
    {
        "client_id": "9012",
        "cin": "11223344",
        "name": "Bob Johnson",
        "document": "driver license",
        "status": "done",
        "submission_date": "2025-11-28",
    },
]


def find_client_by_cin(cin: str) -> Optional[Dict[str, Any]]:
    """Find a client by their CIN number."""
    for client in client_documents:
        if client["cin"] == cin:
            return client
    return None


def find_client_by_name(name: str) -> Optional[Dict[str, Any]]:
    """Find a client by their name (case-insensitive partial match)."""
    lower_name = name.lower()
    for client in client_documents:
        if lower_name in client["name"].lower():
            return client
    return None


def check_document_status(client_id: str, verification_data: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    """
    Check document status with optional verification.
    
    Args:
        client_id: The client's ID
        verification_data: Optional dict with 'name' or 'cin' for verification
        
    Returns:
        Dict with status information
    """
    client = None
    for c in client_documents:
        if c["client_id"] == client_id:
            client = c
            break
    
    if not client:
        return {"found": False, "message": "Client not found"}
    
    # If no verification data provided, ask for it
    if not verification_data or (not verification_data.get("name") and not verification_data.get("cin")):
        return {
            "found": True,
            "needsVerification": True,
            "message": "Please provide your name or CIN for verification",
        }
    
    # Verify identity
    name_match = (
        verification_data.get("name") and 
        verification_data["name"].lower() in client["name"].lower()
    )
    cin_match = verification_data.get("cin") and client["cin"] == verification_data["cin"]
    
    if name_match or cin_match:
        return {
            "found": True,
            "verified": True,
            "client_id": client["client_id"],
            "name": client["name"],
            "document": client["document"],
            "status": client["status"],
            "submission_date": client["submission_date"],
        }
    
    return {
        "found": True,
        "verified": False,
        "message": "Verification failed. Name or CIN does not match our records.",
    }
