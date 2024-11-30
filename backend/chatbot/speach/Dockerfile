FROM python:3.10-slim

WORKDIR /app

COPY . .

RUN pip install python-dotenv langchain-openai deepface deepgram-sdk playsound langchain-core

CMD ["fastapi", "run", "main.py", "--port", "8000"]