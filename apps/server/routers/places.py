import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user_id
from db import get_db
from deps import get_owned_place, get_owned_trip
from models import Place
from schemas import PlaceCreate, PlaceOut, PlaceUpdate

router = APIRouter(tags=["places"])


@router.post("/trips/{trip_id}/places", response_model=PlaceOut, status_code=201)
async def create_place(
    trip_id: uuid.UUID,
    body: PlaceCreate,
    db: AsyncSession = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    await get_owned_trip(trip_id, db, user_id)
    place = Place(trip_id=trip_id, **body.model_dump())
    db.add(place)
    await db.commit()
    await db.refresh(place)
    return place


@router.get("/trips/{trip_id}/places", response_model=list[PlaceOut])
async def list_places(
    trip_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    await get_owned_trip(trip_id, db, user_id)
    result = await db.execute(
        select(Place).where(Place.trip_id == trip_id).order_by(Place.visit_order)
    )
    return result.scalars().all()


@router.get("/places/{place_id}", response_model=PlaceOut)
async def get_place(
    place_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    return await get_owned_place(place_id, db, user_id)


@router.patch("/places/{place_id}", response_model=PlaceOut)
async def update_place(
    place_id: uuid.UUID,
    body: PlaceUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    place = await get_owned_place(place_id, db, user_id)
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(place, key, value)
    await db.commit()
    await db.refresh(place)
    return place


@router.delete("/places/{place_id}", status_code=204)
async def delete_place(
    place_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    place = await get_owned_place(place_id, db, user_id)
    await db.delete(place)
    await db.commit()
