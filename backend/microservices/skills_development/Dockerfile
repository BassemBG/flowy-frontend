FROM python:3.11
WORKDIR /app

# Copy ONLY requirements first (layer caching)
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy application code AFTER dependencies are installed
COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
