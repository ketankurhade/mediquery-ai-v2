from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from bson import ObjectId
from datetime import datetime
import tempfile
import os

from database import reports_collection, users_collection
from utils.dependencies import get_current_user
from utils.pdf_reader import extract_text_from_pdf, chunk_text
from utils.image_reader import extract_text_from_image_bytes
from utils.vector_store import store_chunks_for_report
from agents.extractor import extract_medical_values
from agents.analyst import analyze_results

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.post("/upload", status_code=201)
async def upload_report(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload a PDF or image medical report, process it, and save to MongoDB."""
    
    allowed_types = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
    if file.content_type not in allowed_types:
        raise HTTPException(400, "Only PDF, JPEG, and PNG files are allowed")
    
    file_bytes = await file.read()
    
    # Extract text based on file type
    if file.content_type == "application/pdf":
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name
        try:
            report_text = extract_text_from_pdf(tmp_path)
        finally:
            os.unlink(tmp_path)
    else:
        report_text = extract_text_from_image_bytes(file_bytes, file.content_type)
    
    if not report_text or len(report_text.strip()) < 10:
        raise HTTPException(400, "Could not extract readable text from the file")
    
    # Chunk text for vector storage
    chunks = chunk_text(report_text, chunk_size=200, overlap=30)
    
    # Agent 1 - Extract structured values
    extracted = extract_medical_values(report_text)
    
    # Agent 2 - Analyze for abnormalities
    analysis = analyze_results(extracted)
    
    # Save to MongoDB
    report_doc = {
        "user_id": str(current_user["_id"]),
        "filename": file.filename,
        "raw_text": report_text,
        "patient_info": analysis["patient_info"],
        "all_results": analysis["all_results"],
        "abnormal_results": analysis["abnormal_results"],
        "summary": analysis["summary"],
        "created_at": datetime.utcnow()
    }
    
    result = reports_collection.insert_one(report_doc)
    report_id = str(result.inserted_id)
    
    # Store chunks in ChromaDB using the report_id
    store_chunks_for_report(report_id, chunks)
    
    return {
        "report_id": report_id,
        "summary": analysis["summary"],
        "patient_info": analysis["patient_info"],
        "abnormal_results": analysis["abnormal_results"]
    }


@router.get("")
def get_my_reports(current_user: dict = Depends(get_current_user)):
    """Get all reports belonging to the logged-in user."""
    
    reports = reports_collection.find(
        {"user_id": str(current_user["_id"])}
    ).sort("created_at", -1)
    
    result = []
    for r in reports:
        result.append({
            "id": str(r["_id"]),
            "filename": r["filename"],
            "patient_name": r.get("patient_info", {}).get("name", "Unknown"),
            "abnormal_count": len(r.get("abnormal_results", [])),
            "total_count": len(r.get("all_results", [])),
            "created_at": r["created_at"]
        })
    
    return result


@router.get("/{report_id}")
def get_report(report_id: str, current_user: dict = Depends(get_current_user)):
    """Get full details of a single report."""
    
    try:
        report = reports_collection.find_one({"_id": ObjectId(report_id)})
    except Exception:
        raise HTTPException(400, "Invalid report ID")
    
    if not report:
        raise HTTPException(404, "Report not found")
    
    if report["user_id"] != str(current_user["_id"]):
        raise HTTPException(403, "You don't have permission to view this report")
    
    return {
        "id": str(report["_id"]),
        "filename": report["filename"],
        "patient_info": report["patient_info"],
        "all_results": report["all_results"],
        "abnormal_results": report["abnormal_results"],
        "summary": report["summary"],
        "created_at": report["created_at"]
    }


@router.delete("/{report_id}", status_code=204)
def delete_report(report_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a report belonging to the logged-in user."""
    
    try:
        report = reports_collection.find_one({"_id": ObjectId(report_id)})
    except Exception:
        raise HTTPException(400, "Invalid report ID")
    
    if not report:
        raise HTTPException(404, "Report not found")
    
    if report["user_id"] != str(current_user["_id"]):
        raise HTTPException(403, "You don't have permission to delete this report")
    
    reports_collection.delete_one({"_id": ObjectId(report_id)})
    return None