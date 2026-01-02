FROM python:3.10-slim
WORKDIR /app

# Copy project pronunciation files into container
# Note: Docker build context must include the repo root if you intend to build this image.
COPY ../../../../pronunciation_project ./pronunciation_project
COPY main.py ./main.py

RUN pip install --no-cache-dir -r pronunciation_project/requirements.txt

EXPOSE 5000
CMD ["python", "main.py"]
