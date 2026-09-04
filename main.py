"""
Root entrypoint delegating to backend.main
Allows running:
    uvicorn main:app --reload
or:
    python main.py
directly from the workspace root.
"""

from backend.main import app, MOCK_DISTRICTS, MOCK_CLAIMS

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
