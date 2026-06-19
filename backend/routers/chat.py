from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from bson import ObjectId
from datetime import datetime

from database import reports_collection, chats_collection
from utils.dependencies import get_current_user
from utils.vector_store import retrieve_relevant_chunks_for_report
from agents.advisor import get_advice

router = APIRouter(prefix="/chat", tags=["Chat"])


class ChatMessage(BaseModel):
    message: str


def get_report_and_verify_owner(report_id: str, user_id: str) -> dict:
    """Helper to fetch report and check ownership."""
    try:
        report = reports_collection.find_one({"_id": ObjectId(report_id)})
    except Exception:
        raise HTTPException(400, "Invalid report ID")
    
    if not report:
        raise HTTPException(404, "Report not found")
    
    if report["user_id"] != user_id:
        raise HTTPException(403, "You don't have permission to access this report")
    
    return report


@router.post("/{report_id}")
def send_message(
    report_id: str,
    chat_input: ChatMessage,
    current_user: dict = Depends(get_current_user)
):
    """Send a message about a specific report, get AI response."""
    
    user_id = str(current_user["_id"])
    report = get_report_and_verify_owner(report_id, user_id)
    
    # Get or create chat history document for this report
    chat_doc = chats_collection.find_one({"report_id": report_id})
    
    if not chat_doc:
        chat_doc = {
            "report_id": report_id,
            "user_id": user_id,
            "messages": [],
            "created_at": datetime.utcnow()
        }
        chats_collection.insert_one(chat_doc)
        conversation_history = []
    else:
        conversation_history = chat_doc.get("messages", [])
    
    # Retrieve relevant chunks from this report's vector store
    relevant_chunks = retrieve_relevant_chunks_for_report(report_id, chat_input.message)
    
    # Build analysis_data shape that advisor expects
    analysis_data = {
        "patient_info": report.get("patient_info", {}),
        "abnormal_results": report.get("abnormal_results", [])
    }
    
    # Agent 3 - Get AI response
    ai_response = get_advice(
        user_query=chat_input.message,
        analysis_data=analysis_data,
        relevant_chunks=relevant_chunks,
        conversation_history=conversation_history
    )
    
    # Save both messages to MongoDB
    new_messages = [
        {"role": "user", "content": chat_input.message, "timestamp": datetime.utcnow()},
        {"role": "assistant", "content": ai_response, "timestamp": datetime.utcnow()}
    ]
    
    chats_collection.update_one(
        {"report_id": report_id},
        {"$push": {"messages": {"$each": new_messages}}}
    )
    
    return {
        "response": ai_response,
        "report_id": report_id
    }


@router.get("/{report_id}")
def get_chat_history(
    report_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get full chat history for a specific report."""
    
    user_id = str(current_user["_id"])
    get_report_and_verify_owner(report_id, user_id)  # Just verify ownership
    
    chat_doc = chats_collection.find_one({"report_id": report_id})
    
    if not chat_doc:
        return {"messages": []}
    
    return {"messages": chat_doc.get("messages", [])}