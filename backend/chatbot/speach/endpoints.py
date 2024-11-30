import uuid

from fastapi import FastAPI, File, UploadFile
from fastapi.responses import StreamingResponse
import os

# Assuming your AI code is in a module called ai_bot
from app.speach.chatbot_client import EmotionAwareBot

# Initialize the router and the AI bot
router = FastAPI()
bot = EmotionAwareBot()

TEMP_FILE_PATHS = []


@router.post("/generate_impression")
async def user_first_impression(image: UploadFile):
    try:
        save_dir = "./data/user/first_impression"
        os.makedirs(save_dir, exist_ok=True)

        filename = f"image_{len(os.listdir(save_dir)) + 1}.jpg"
        file_path = os.path.join(save_dir, filename)

        with open(file_path, "wb") as f:
            f.write(await image.read())

        analysis = bot.analyze_image(file_path)

        return {"result": str(analysis)}

        # return {"message": "File saved successfully", "file_path": file_path}

    except Exception as e:
        return {"message": str(e)}

@router.post("/process-audio/")
async def process_audio(file: UploadFile = File(...)):
    """
    API endpoint to process an audio file.
    Accepts a .wav file, transcribes it, processes the transcription, and returns a .wav response.
    """
    # Step 1: Save the uploaded file to a temporary location
    temp_file_path = f"temp_{uuid.uuid4().hex}.wav"
    TEMP_FILE_PATHS.append(temp_file_path)

    with open(temp_file_path, "wb") as temp_file:
        temp_file.write(await file.read())

    # Step 2: Process the audio file using the AI bot
    result = bot.process_audio_file(audio_path=temp_file_path)

    # Step 3: Check for errors in the bot's response
    if "error" in result:
        return {"error": result["error"]}

    # Step 4: Load the generated audio file
    audio_response_path = result.get("audio_response")
    if not audio_response_path or not os.path.exists(audio_response_path):
        return {"error": "Failed to generate audio response"}

    # Step 5: Stream the `.wav` file back to the client
    def iterfile():
        with open(audio_response_path, mode="rb") as audio_file:
            yield from audio_file

    # Step 6: Clean up temporary files
    os.remove(temp_file_path)

    return StreamingResponse(
        iterfile(),
        media_type="audio/wav",
        headers={"Content-Disposition": f"attachment; filename={os.path.basename(audio_response_path)}"}
    )
