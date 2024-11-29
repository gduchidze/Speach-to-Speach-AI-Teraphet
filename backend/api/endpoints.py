from fastapi import APIRouter


router = APIRouter()


@router.get("/")
async def example():
    return {"message": "Hello Tornike"}