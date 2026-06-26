import re

NORMAL_RANGES = {
    # CBC
    "hemoglobin": {"male": (13.5, 17.5), "female": (12.0, 15.5), "unit": "g/dL"},
    "wbc": {"male": (4500, 11000), "female": (4500, 11000), "unit": "cells/mcL"},
    "total leukocyte count": {"male": (4500, 11000), "female": (4500, 11000), "unit": "cells/mcL"},
    "platelet": {"male": (150000, 400000), "female": (150000, 400000), "unit": "/mcL"},
    "rbc": {"male": (4.5, 5.5), "female": (4.0, 5.0), "unit": "million/mcL"},
    "red blood cell": {"male": (4.5, 5.9), "female": (4.0, 5.2), "unit": "million/mcL"},
    "hematocrit": {"male": (40.0, 52.0), "female": (36.0, 46.0), "unit": "%"},
    "pcv": {"male": (40.0, 52.0), "female": (36.0, 46.0), "unit": "%"},
    "mcv": {"male": (80, 100), "female": (80, 100), "unit": "fL"},
    "mch": {"male": (27, 33), "female": (27, 33), "unit": "pg"},
    "mchc": {"male": (32, 36), "female": (32, 36), "unit": "g/dL"},

    # Blood Sugar
    "fasting blood sugar": {"male": (70, 100), "female": (70, 100), "unit": "mg/dL"},
    "fasting plasma glucose": {"male": (70, 99), "female": (70, 99), "unit": "mg/dL"},
    "random blood sugar": {"male": (70, 140), "female": (70, 140), "unit": "mg/dL"},
    "postprandial": {"male": (70, 140), "female": (70, 140), "unit": "mg/dL"},
    "hba1c": {"male": (0, 5.7), "female": (0, 5.7), "unit": "%"},

    # Kidney
    "creatinine": {"male": (0.74, 1.35), "female": (0.59, 1.04), "unit": "mg/dL"},
    "urea": {"male": (7, 20), "female": (7, 20), "unit": "mg/dL"},
    "blood urea nitrogen": {"male": (7, 20), "female": (7, 20), "unit": "mg/dL"},
    "bun": {"male": (7, 20), "female": (7, 20), "unit": "mg/dL"},
    "uric acid": {"male": (3.4, 7.0), "female": (2.4, 6.0), "unit": "mg/dL"},

    # Liver
    "sgpt": {"male": (7, 56), "female": (7, 56), "unit": "U/L"},
    "alt": {"male": (7, 56), "female": (7, 56), "unit": "U/L"},
    "sgot": {"male": (10, 40), "female": (10, 40), "unit": "U/L"},
    "ast": {"male": (10, 40), "female": (10, 40), "unit": "U/L"},
    "bilirubin": {"male": (0.1, 1.2), "female": (0.1, 1.2), "unit": "mg/dL"},
    "alkaline phosphatase": {"male": (44, 147), "female": (44, 147), "unit": "U/L"},
    "albumin": {"male": (3.5, 5.0), "female": (3.5, 5.0), "unit": "g/dL"},
    "total protein": {"male": (6.0, 8.3), "female": (6.0, 8.3), "unit": "g/dL"},

    # Lipid Profile
    "total cholesterol": {"male": (0, 200), "female": (0, 200), "unit": "mg/dL"},
    "triglycerides": {"male": (0, 150), "female": (0, 150), "unit": "mg/dL"},
    "hdl": {"male": (40, 999), "female": (50, 999), "unit": "mg/dL"},
    "ldl": {"male": (0, 100), "female": (0, 100), "unit": "mg/dL"},
    "vldl": {"male": (5, 40), "female": (5, 40), "unit": "mg/dL"},

    # Thyroid
    "tsh": {"male": (0.4, 4.0), "female": (0.4, 4.0), "unit": "mIU/L"},
    "t3": {"male": (80, 200), "female": (80, 200), "unit": "ng/dL"},
    "t4": {"male": (5.0, 12.0), "female": (5.0, 12.0), "unit": "µg/dL"},

    # Vitamins/Minerals
    "vitamin d": {"male": (30, 100), "female": (30, 100), "unit": "ng/mL"},
    "vitamin b12": {"male": (200, 900), "female": (200, 900), "unit": "pg/mL"},
    "calcium": {"male": (8.5, 10.5), "female": (8.5, 10.5), "unit": "mg/dL"},
    "sodium": {"male": (135, 145), "female": (135, 145), "unit": "mEq/L"},
    "potassium": {"male": (3.5, 5.1), "female": (3.5, 5.1), "unit": "mEq/L"},
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
            if re.search(r'\b' + re.escape(key) + r'\b', test_name_lower):
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