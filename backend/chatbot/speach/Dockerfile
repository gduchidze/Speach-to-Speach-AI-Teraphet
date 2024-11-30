FROM python:3.12-slim

RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN pip install python-dotenv langchain-openai deepface deepgram-sdk playsound langchain-core uuid pydub fastapi uvicorn typing-extensions opencv-python-headless uvicorn fastapi


COPY . .

RUN mkdir -p data/user/first_impression

EXPOSE 8000

CMD ["uvicorn", "main:router", "--host", "0.0.0.0", "--port", "8000"]