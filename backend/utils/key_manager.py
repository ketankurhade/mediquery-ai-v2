import os
from dotenv import load_dotenv

load_dotenv()

keys = [
    os.getenv("GEMINI_API_KEY"),
    os.getenv("GEMINI_API_KEY_2"),
    os.getenv("GEMINI_API_KEY_3"),
]

keys = [k for k in keys if k]
current_index = 0

def get_current_key() -> str:
    return keys[current_index % len(keys)]

def rotate_key():
    global current_index
    current_index += 1
    print(f"Rotated to key {current_index % len(keys) + 1}")

def get_next_key() -> str:
    rotate_key()
    return get_current_key()