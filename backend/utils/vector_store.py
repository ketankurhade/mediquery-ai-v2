import chromadb
from google import genai
import os
from dotenv import load_dotenv

load_dotenv()

client_genai = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
client = chromadb.PersistentClient(path="./data/chroma_db")

def get_embedding(text: str) -> list:
    result = client_genai.models.embed_content(
        model="gemini-embedding-001",
        contents=text
    )
    return result.embeddings[0].values

def store_chunks_for_report(report_id: str, chunks: list):
    """Each report gets its own ChromaDB collection, named by report_id."""
    collection_name = f"report_{report_id}"
    try:
        client.delete_collection(collection_name)
    except:
        pass
    
    collection = client.create_collection(collection_name)
    
    for i, chunk in enumerate(chunks):
        embedding = get_embedding(chunk)
        collection.add(
            documents=[chunk],
            embeddings=[embedding],
            ids=[f"chunk_{i}"]
        )
    return collection

def retrieve_relevant_chunks_for_report(report_id: str, query: str, n_results: int = 5) -> list:
    collection_name = f"report_{report_id}"
    try:
        collection = client.get_collection(collection_name)
    except:
        return []
    
    query_embedding = get_embedding(query)
    
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results
    )
    return results['documents'][0]