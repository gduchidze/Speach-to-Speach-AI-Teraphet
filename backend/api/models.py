from pydantic import BaseModel


class TherapistResponse(BaseModel):
    text_response: str
    audio_response: str | None
    detected_emotion: str | None