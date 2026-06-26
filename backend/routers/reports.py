from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from bson import ObjectId
from datetime import datetime
import tempfile
import os
from fastapi.responses import StreamingResponse
from utils.pdf_generator import generate_report_pdf

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

    chunks = chunk_text(report_text, chunk_size=200, overlap=30)

    extracted = extract_medical_values(report_text)
    analysis = analyze_results(extracted)

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
        abnormal = r.get("abnormal_results", [])

        worst_severity = "normal"
        top_abnormal = None
        if abnormal:
            critical = [a for a in abnormal if a.get("severity") == "critical"]
            top_abnormal = critical[0] if critical else abnormal[0]
            worst_severity = "critical" if critical else "mild"

        result.append({
            "id": str(r["_id"]),
            "filename": r["filename"],
            "patient_name": r.get("patient_info", {}).get("name", "Unknown"),
            "abnormal_count": len(abnormal),
            "total_count": len(r.get("all_results", [])),
            "worst_severity": worst_severity,
            "top_abnormal": {
                "test_name": top_abnormal["test_name"],
                "status": top_abnormal["status"]
            } if top_abnormal else None,
            "created_at": r["created_at"]
        })

    return result


@router.get("/trends/available-tests/list")
def get_available_tests(current_user: dict = Depends(get_current_user)):
    """Get a list of unique test names this user has across all reports, with counts."""

    reports = reports_collection.find({"user_id": str(current_user["_id"])})

    test_counts = {}
    for r in reports:
        for test in r.get("all_results", []):
            name = test["test_name"]
            test_counts[name] = test_counts.get(name, 0) + 1

    trendable = [{"test_name": name, "count": count} for name, count in test_counts.items() if count >= 2]
    trendable.sort(key=lambda x: -x["count"])

    return trendable


@router.get("/trends/{test_name}")
def get_test_trend(test_name: str, current_user: dict = Depends(get_current_user)):
    """Get historical values for a specific test across all user's reports."""

    reports = reports_collection.find(
        {"user_id": str(current_user["_id"])}
    ).sort("created_at", 1)

    trend_data = []
    for r in reports:
        for test in r.get("all_results", []):
            if test["test_name"].lower() == test_name.lower():
                try:
                    value = float(test["value"])
                except (ValueError, TypeError):
                    continue
                trend_data.append({
                    "date": r["created_at"],
                    "value": value,
                    "unit": test.get("unit", ""),
                    "status": test.get("status", "unknown"),
                    "report_id": str(r["_id"]),
                })
                break

    if not trend_data:
        raise HTTPException(404, f"No historical data found for '{test_name}'")

    return {
        "test_name": test_name,
        "data_points": trend_data
    }


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

@router.get("/{report_id}/export-pdf")
def export_report_pdf(report_id: str, current_user: dict = Depends(get_current_user)):
    """Generate and download a PDF summary of the report."""

    try:
        report = reports_collection.find_one({"_id": ObjectId(report_id)})
    except Exception:
        raise HTTPException(400, "Invalid report ID")

    if not report:
        raise HTTPException(404, "Report not found")

    if report["user_id"] != str(current_user["_id"]):
        raise HTTPException(403, "You don't have permission to access this report")

    pdf_buffer = generate_report_pdf(report)

    patient_name = report.get("patient_info", {}).get("name", "report").replace(" ", "_")
    filename = f"MediQuery_{patient_name}_Summary.pdf"

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/compare/{report_id_1}/{report_id_2}")
def compare_reports(
    report_id_1: str,
    report_id_2: str,
    current_user: dict = Depends(get_current_user)
):
    """Compare two reports test-by-test, showing what changed."""

    try:
        r1 = reports_collection.find_one({"_id": ObjectId(report_id_1)})
        r2 = reports_collection.find_one({"_id": ObjectId(report_id_2)})
    except Exception:
        raise HTTPException(400, "Invalid report ID")

    if not r1 or not r2:
        raise HTTPException(404, "One or both reports not found")

    user_id = str(current_user["_id"])
    if r1["user_id"] != user_id or r2["user_id"] != user_id:
        raise HTTPException(403, "You don't have permission to access these reports")

    # Ensure r1 is the older report chronologically
    if r1["created_at"] > r2["created_at"]:
        r1, r2 = r2, r1

    tests_1 = {t["test_name"]: t for t in r1.get("all_results", [])}
    tests_2 = {t["test_name"]: t for t in r2.get("all_results", [])}

    common_tests = set(tests_1.keys()) & set(tests_2.keys())

    comparison = []
    for name in common_tests:
        t1 = tests_1[name]
        t2 = tests_2[name]
        try:
            v1 = float(t1["value"])
            v2 = float(t2["value"])
            change = v2 - v1
            change_pct = (change / v1 * 100) if v1 != 0 else 0
            direction = "up" if change > 0 else "down" if change < 0 else "same"
        except (ValueError, TypeError):
            change = None
            change_pct = None
            direction = "unknown"

        comparison.append({
            "test_name": name,
            "old_value": t1["value"],
            "new_value": t2["value"],
            "unit": t2.get("unit", ""),
            "old_status": t1.get("status", "unknown"),
            "new_status": t2.get("status", "unknown"),
            "change": change,
            "change_pct": round(change_pct, 1) if change_pct is not None else None,
            "direction": direction,
        })

    return {
        "report_1": {
            "id": str(r1["_id"]),
            "filename": r1["filename"],
            "date": r1["created_at"],
        },
        "report_2": {
            "id": str(r2["_id"]),
            "filename": r2["filename"],
            "date": r2["created_at"],
        },
        "comparison": comparison,
    }

@router.post("/{report_id}/reanalyze")
def reanalyze_report(report_id: str, current_user: dict = Depends(get_current_user)):
    """Re-run Agent 1 and Agent 2 on the stored raw text of a report."""

    try:
        report = reports_collection.find_one({"_id": ObjectId(report_id)})
    except Exception:
        raise HTTPException(400, "Invalid report ID")

    if not report:
        raise HTTPException(404, "Report not found")

    if report["user_id"] != str(current_user["_id"]):
        raise HTTPException(403, "You don't have permission to modify this report")

    raw_text = report.get("raw_text")
    if not raw_text:
        raise HTTPException(400, "No raw text stored for this report")

    extracted = extract_medical_values(raw_text)
    analysis = analyze_results(extracted)

    reports_collection.update_one(
        {"_id": ObjectId(report_id)},
        {"$set": {
            "patient_info": analysis["patient_info"],
            "all_results": analysis["all_results"],
            "abnormal_results": analysis["abnormal_results"],
            "summary": analysis["summary"],
        }}
    )

    return {
        "message": "Report re-analyzed successfully",
        "summary": analysis["summary"],
        "patient_info": analysis["patient_info"],
        "abnormal_results": analysis["abnormal_results"]
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