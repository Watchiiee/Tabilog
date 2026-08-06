import uuid

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from models import Place, Trip


async def get_owned_trip(trip_id: uuid.UUID, db: AsyncSession, user_id: uuid.UUID) -> Trip:
    trip = await db.get(Trip, trip_id)
    if trip is None or trip.user_id != user_id:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


async def get_owned_place(place_id: uuid.UUID, db: AsyncSession, user_id: uuid.UUID) -> Place:
    place = await db.get(Place, place_id)
    if place is None:
        raise HTTPException(status_code=404, detail="Place not found")
    await get_owned_trip(place.trip_id, db, user_id)
    return place
