import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user_id
from db import get_db
from deps import get_owned_trip
from models import Place, Trip
from schemas import TripCreate, TripOut, TripUpdate
from upstage import UpstageError, generate_trip_summary

router = APIRouter(prefix="/trips", tags=["trips"])


@router.post("", response_model=TripOut, status_code=201)
async def create_trip(
    body: TripCreate,
    db: AsyncSession = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    trip = Trip(user_id=user_id, **body.model_dump())
    db.add(trip)
    await db.commit()
    await db.refresh(trip)
    return trip


@router.get("", response_model=list[TripOut])
async def list_trips(
    db: AsyncSession = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    result = await db.execute(
        select(Trip).where(Trip.user_id == user_id).order_by(Trip.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{trip_id}", response_model=TripOut)
async def get_trip(
    trip_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    return await get_owned_trip(trip_id, db, user_id)


@router.patch("/{trip_id}", response_model=TripOut)
async def update_trip(
    trip_id: uuid.UUID,
    body: TripUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    trip = await get_owned_trip(trip_id, db, user_id)
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(trip, key, value)
    await db.commit()
    await db.refresh(trip)
    return trip


@router.delete("/{trip_id}", status_code=204)
async def delete_trip(
    trip_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    trip = await get_owned_trip(trip_id, db, user_id)
    await db.delete(trip)
    await db.commit()


@router.post("/{trip_id}/summary", response_model=TripOut)
async def generate_summary(
    trip_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    trip = await get_owned_trip(trip_id, db, user_id)
    result = await db.execute(
        select(Place).where(Place.trip_id == trip_id).order_by(Place.visit_order)
    )
    places = result.scalars().all()

    try:
        badge, essay = await generate_trip_summary(trip, places)
    except UpstageError as e:
        raise HTTPException(status_code=502, detail=str(e))

    trip.sentiment_badge = badge
    trip.solar_summary = essay
    await db.commit()
    await db.refresh(trip)
    return trip
