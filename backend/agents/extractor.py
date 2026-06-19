from google import genai
import os
import time
import json
from dotenv import load_dotenv

load_dotenv()

def extract_medical_values(report_text: str) -> dict:
    """Extract all medical values from report text into structured format."""
    
    prompt = f"""
You are a medical data extraction specialist.
Extract ALL medical test values from the following report text.
Return ONLY a valid JSON object with this exact structure:
{{
    "patient_info": {{
        "name": "extracted name or Unknown",
        "age": "extracted age or Unknown", 
        "gender": "extracted gender or Unknown"
    }},
    "test_results": [
        {{
            "test_name": "name of test",
            "value": "numeric value only",
            "unit": "unit of measurement",
            "normal_range": "normal range if mentioned",
            "category": "category like CBC, Blood Sugar, Kidney, Liver etc"
        }}
    ]
}}

Report Text:
{report_text}

Return ONLY the JSON, no explanation, no markdown, no extra text.
"""

    from utils.key_manager import get_current_key, rotate_key

    response = None
    for attempt in range(3):
        try:
            client = genai.Client(api_key=get_current_key())
            response = client.models.generate_content(
                model="gemini-2.5-flash-lite",
                contents=prompt
            )
            break
        except Exception as e:
            if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                rotate_key()
                time.sleep(3)
            elif "503" in str(e) or "UNAVAILABLE" in str(e):
                time.sleep(20)
            else:
                raise e

    if response is None:
        return {"patient_info": {}, "test_results": [], "raw_response": "All keys exhausted."}

    try:
        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        result = json.loads(raw.strip())
        return result
    except:
        return {"patient_info": {}, "test_results": [], "raw_response": response.text}