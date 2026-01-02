import os
import sys
from pathlib import Path

# Make repo root importable so we can reuse the existing pronunciation_project code
HERE = Path(__file__).resolve().parent
REPO_ROOT = (HERE / ".." / ".." / "..").resolve()
sys.path.insert(0, str(REPO_ROOT))

try:
    # Import the Flask `app` object from the pronunciation_project
    from pronunciation_project import app as pronunciation_module
    flask_app = getattr(pronunciation_module, "app")
except Exception as e:
    raise RuntimeError(f"Failed to import pronunciation_project: {e}")


if __name__ == "__main__":
    # Run the existing Flask app on port 5000 for gateway proxying
    flask_app.run(host="0.0.0.0", port=5000, debug=False)
