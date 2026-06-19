from google import genai
import os
import time
from dotenv import load_dotenv
from langdetect import detect

load_dotenv()

def get_advice(
    user_query: str,
    analysis_data: dict,
    relevant_chunks: list,
    conversation_history: list = []
) -> str:
    """Generate plain language advice based on analysis and user query."""
    
    try:
        lang = detect(user_query)
    except:
        lang = "en"
    
    if lang == "hi":
        lang_instruction = "Respond in Hindi (Devanagari script)."
    elif lang == "mr":
        lang_instruction = "Respond in Marathi (Devanagari script)."
    else:
        lang_instruction = "Respond in English."
    
    abnormal = analysis_data.get("abnormal_results", [])
    abnormal_text = ""
    if abnormal:
        abnormal_text = "ABNORMAL VALUES FOUND:\n"
        for t in abnormal:
            abnormal_text += f"- {t['test_name']}: {t['value']} {t['unit']} → {t['status']} ({t['severity']})\n"
    
    report_context = "\n".join(relevant_chunks) if relevant_chunks else "No report uploaded."
    
    history_text = ""
    if conversation_history:
        history_text = "PREVIOUS CONVERSATION:\n"
        for msg in conversation_history[-6:]:
            history_text += f"{msg['role'].upper()}: {msg['content']}\n"
    
    prompt = f"""
You are MediQuery AI, a helpful medical report assistant.
{lang_instruction}

IMPORTANT RULES:
- Always recommend consulting a real doctor for medical decisions
- Be clear, simple, and compassionate
- Cite which values you are referring to
- For general questions (no report), answer from medical knowledge

{history_text}

REPORT CONTEXT:
{report_context}

{abnormal_text}

PATIENT INFO:
{analysis_data.get('patient_info', {})}

USER QUESTION: {user_query}

Provide a helpful, clear answer. If values are abnormal, explain what it means in simple terms and suggest next steps.
"""

    from utils.key_manager import get_current_key, rotate_key

    for attempt in range(3):
        try:
            client = genai.Client(api_key=get_current_key())
            response = client.models.generate_content(
                model="gemini-2.5-flash-lite",
                contents=prompt
            )
            return response.text
        except Exception as e:
            if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                rotate_key()
                time.sleep(3)
            elif "503" in str(e) or "UNAVAILABLE" in str(e):
                time.sleep(20)
            else:
                raise e
    
    return "All API keys exhausted for today. Please try again tomorrow."