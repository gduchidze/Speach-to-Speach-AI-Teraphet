FROM python:latest

WORKDIR /code

COPY ./requirements.txt /code/requirements.txt

RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && apt-get clean

RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

COPY .env /code/.env

COPY ./main.py /code

COPY ./api /code/api

COPY ./chatbot /code/chatbot

CMD ["fastapi", "run", "main.py", "--port", "80"]