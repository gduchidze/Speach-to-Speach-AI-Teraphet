from fastapi import APIRouter
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel

from chatbot.text.main import TextTherapyService


text_service_router = APIRouter()
text_service = TextTherapyService()


class UserInput(BaseModel):
    text: str


@text_service_router.post("/user/input")
def generate_response(user_input: UserInput):
    result = text_service.process_message(user_input.text)

    response = {"result": result["response"]}

    return jsonable_encoder(response)
