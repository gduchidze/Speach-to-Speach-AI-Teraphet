import os

from fastapi import APIRouter, UploadFile
from fastapi.encoders import jsonable_encoder

from api.models import TherapistResponse


router = APIRouter()


@router.get("/therapist/response")
async def therapist_response(response: TherapistResponse):
    return jsonable_encoder(response)


@router.post("/user/impression")
async def user_first_impression(image: UploadFile):
    try:
        save_dir = "./data/user/first_impression"
        os.makedirs(save_dir, exist_ok=True)

        filename = f"image_{len(os.listdir(save_dir))}.jpg"
        file_path = os.path.join(save_dir, filename)

        with open(file_path, "wb") as f:
            f.write(await image.read())

        return {"message": "File saved successfully", "file_path": file_path}

    except Exception as e:
        return {"message": str(e)}
