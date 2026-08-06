from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI

from routers import photos, places, trips

app = FastAPI()

app.include_router(trips.router)
app.include_router(places.router)
app.include_router(photos.router)


@app.get("/health")
def health():
    return {"status": "ok"}
