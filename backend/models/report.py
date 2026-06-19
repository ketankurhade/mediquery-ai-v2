from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class TestResult(BaseModel):
    test_name: str
    value: str
    unit: Optional[str] = ""
    normal_range: Optional[str] = ""
    category: Optional[str] = ""
    status: Optional[str] = "unknown"
    severity: Optional[str] = "normal"

class ReportResponse(BaseModel):
    id: str
    filename: str
    patient_info: Dict[str, Any]
    all_results: List[Dict[str, Any]]
    abnormal_results: List[Dict[str, Any]]
    summary: str
    created_at: datetime

class ReportListItem(BaseModel):
    id: str
    filename: str
    patient_name: str
    abnormal_count: int
    total_count: int
    created_at: datetime