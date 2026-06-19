NORMAL_RANGES = {
    "hemoglobin": {"male": (13.5, 17.5), "female": (12.0, 15.5), "unit": "g/dL"},
    "wbc": {"male": (4500, 11000), "female": (4500, 11000), "unit": "cells/mcL"},
    "platelet": {"male": (150000, 400000), "female": (150000, 400000), "unit": "/mcL"},
    "rbc": {"male": (4.5, 5.5), "female": (4.0, 5.0), "unit": "million/mcL"},
    "fasting blood sugar": {"male": (70, 100), "female": (70, 100), "unit": "mg/dL"},
    "hba1c": {"male": (0, 5.7), "female": (0, 5.7), "unit": "%"},
    "creatinine": {"male": (0.7, 1.3), "female": (0.5, 1.1), "unit": "mg/dL"},
    "urea": {"male": (7, 20), "female": (7, 20), "unit": "mg/dL"},
    "sgpt": {"male": (7, 56), "female": (7, 56), "unit": "U/L"},
    "sgot": {"male": (10, 40), "female": (10, 40), "unit": "U/L"},
}

def analyze_results(extracted_data: dict) -> dict:
    gender = extracted_data.get("patient_info", {}).get("gender", "male").lower()
    if "female" not in gender:
        gender = "male"
    
    test_results = extracted_data.get("test_results", [])
    analyzed = []
    
    for test in test_results:
        test_name_lower = test["test_name"].lower()
        status = "unknown"
        severity = "normal"
        
        for key, ranges in NORMAL_RANGES.items():
            if key in test_name_lower:
                try:
                    value = float(test["value"])
                    low, high = ranges[gender]
                    
                    if value < low:
                        status = "LOW"
                        deviation = ((low - value) / low) * 100
                        severity = "critical" if deviation > 30 else "mild"
                    elif value > high:
                        status = "HIGH"
                        deviation = ((value - high) / high) * 100
                        severity = "critical" if deviation > 30 else "mild"
                    else:
                        status = "NORMAL"
                        severity = "normal"
                except:
                    status = "unknown"
                break
        
        analyzed.append({
            **test,
            "status": status,
            "severity": severity
        })
    
    abnormal = [t for t in analyzed if t["status"] in ["HIGH", "LOW"]]
    
    return {
        "patient_info": extracted_data.get("patient_info", {}),
        "all_results": analyzed,
        "abnormal_results": abnormal,
        "summary": f"Found {len(abnormal)} abnormal values out of {len(analyzed)} tests"
    }