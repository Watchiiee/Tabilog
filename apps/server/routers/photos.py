import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user_id
from db import get_db
from deps import get_owned_place
from models import Photo
from schemas import PhotoCreate, PhotoOut

router = APIRouter(tags=["photos"])


async def _get_owned_photo(photo_id: uuid.UUID, db: AsyncSession, user_id: uuid.UUID) -> Photo:
    photo = await db.get(Photo, photo_id)
    if photo is None:
        raise HTTPException(status_code=404, detail="Photo not found")
    await get_owned_place(photo.place_id, db, user_id)
    return photo


@router.post("/places/{place_id}/photos", response_model=PhotoOut, status_code=201)
async def create_photo(
    place_id: uuid.UUID,
    body: PhotoCreate,
    db: AsyncSession = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    await get_owned_place(place_id, db, user_id)
    photo = Photo(place_id=place_id, photo_url=body.photo_url)
    db.add(photo)
    await db.commit()
    await db.refresh(photo)
    return photo


@router.get("/places/{place_id}/photos", response_model=list[PhotoOut])
async def list_photos(
    place_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    await get_owned_place(place_id, db, user_id)
    result = await db.execute(
        select(Photo).where(Photo.place_id == place_id).order_by(Photo.created_at)
    )
    return result.scalars().all()


@router.delete("/photos/{photo_id}", status_code=204)
async def delete_photo(
    photo_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    photo = await _get_owned_photo(photo_id, db, user_id)
    await db.delete(photo)
    await db.commit()
