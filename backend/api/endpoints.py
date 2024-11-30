import os

from fastapi import APIRouter, UploadFile, WebSocket, WebSocketDisconnect
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

        filename = f"image_{len(os.listdir(save_dir)) + 1}.jpg"
        file_path = os.path.join(save_dir, filename)

        with open(file_path, "wb") as f:
            f.write(await image.read())

        return {"message": "File saved successfully", "file_path": file_path}

    except Exception as e:
        return {"message": str(e)}


@router.websocket("/user/wavs")
async def user_wavs(websocket: WebSocket):
    await websocket.accept()

    save_dir = "./data/user/wavs"
    os.makedirs(save_dir, exist_ok=True)

    filename = f"audio_{len(os.listdir(save_dir)) + 1}.wav"
    file_path = os.path.join(save_dir, filename)

    try:
        with open(file_path, "wb") as wav_file:
            while True:
                data = await websocket.receive_bytes()
                wav_file.write(data)
        await websocket.close()
    except WebSocketDisconnect:
        print("Websocket connection closed")