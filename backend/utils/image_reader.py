from google import genai
from google.genai import types
import os
import base64
import time
from dotenv import load_dotenv

load_dotenv()

def encode_image(image_path: str) -> tuple:
    """Encode image to base64 and detect mime type."""
    ext = os.path.splitext(image_path)[1].lower()
    
    mime_map = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".bmp": "image/bmp"
    }
    
    mime_type = mime_map.get(ext, "image/jpeg")
    
    with open(image_path, "rb") as f:
        image_data = base64.b64encode(f.read()).decode("utf-8")
    
    return image_data, mime_type

def extract_text_from_image(image_path: str) -> str:
    """Use Gemini Vision to extract text from medical report image."""
    
    print(f"Reading image: {image_path}")
    image_data, mime_type = encode_image(image_path)
    
    prompt = """You are a medical report reader.
Extract ALL text from this medical report image exactly as it appears.
Include:
- Patient name, age, gender
- All test names and their values
- Units of measurement
- Normal ranges if shown
- Doctor name and date if visible

Return the extracted text in a clean, structured format.
Do not add any interpretation — just extract what you see."""

    from utils.key_manager import get_current_key, rotate_key

    for attempt in range(3):
        try:
            client = genai.Client(api_key=get_current_key())
            response = client.models.generate_content(
                model="gemini-2.5-flash-lite",
                contents=[
                    types.Part.from_bytes(
                        data=base64.b64decode(image_data),
                        mime_type=mime_type
                    ),
                    types.Part.from_text(text=prompt)
                ]
            )
            return response.text
        except Exception as e:
            if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                rotate_key()
                print(f"Quota hit, switching to next key... ({attempt+1}/3)")
                time.sleep(3)
            elif "503" in str(e) or "UNAVAILABLE" in str(e):
                print(f"Gemini busy, retrying in 20s... ({attempt+1}/3)")
                time.sleep(20)
            else:
                raise e
    
    return "Could not extract text from image. Please try again."

def extract_text_from_image_bytes(image_bytes: bytes, mime_type: str = "image/jpeg") -> str:
    """Extract text from image bytes directly (for Streamlit uploads)."""
    
    prompt = """You are a medical report reader.
Extract ALL text from this medical report image exactly as it appears.
Include:
- Patient name, age, gender
- All test names and their values
- Units of measurement
- Normal ranges if shown
- Doctor name and date if visible

Return the extracted text in a clean, structured format.
Do not add any interpretation — just extract what you see."""

    from utils.key_manager import get_current_key, rotate_key

    for attempt in range(3):
        try:
            client = genai.Client(api_key=get_current_key())
            response = client.models.generate_content(
                model="gemini-2.5-flash-lite",
                contents=[
                    types.Part.from_bytes(
                        data=image_bytes,
                        mime_type=mime_type
                    ),
                    types.Part.from_text(text=prompt)
                ]
            )
            return response.text
        except Exception as e:
            if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                rotate_key()
                print(f"Quota hit, switching to next key... ({attempt+1}/3)")
                time.sleep(3)
            elif "503" in str(e) or "UNAVAILABLE" in str(e):
                print(f"Gemini busy, retrying in 20s... ({attempt+1}/3)")
                time.sleep(20)
            else:
                raise e
    
    return "Could not extract text from image. Please try again."