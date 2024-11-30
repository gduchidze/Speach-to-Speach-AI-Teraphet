from fastapi import APIRouter
from fastapi.encoders import jsonable_encoder

from chatbot.text.main import TextTherapyService


text_service_router = APIRouter()
text_service = TextTherapyService()


@text_service_router.post("/user/input")
def generate_response(user_input: str):
    result = text_service.process_message(user_input)

    response = {"result": result["response"]}

    return jsonable_encoder(response)
