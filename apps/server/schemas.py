import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class TripCreate(BaseModel):
    title: str
    start_date: date | None = None
    end_date: date | None = None
    is_public: bool = False


class TripUpdate(BaseModel):
    title: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    solar_summary: str | None = None
    sentiment_badge: str | None = None
    total_distance: float | None = None
    is_public: bool | None = None


class TripOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    start_date: date | None
    end_date: date | None
    solar_summary: str | None
    sentiment_badge: str | None
    total_distance: float | None
    is_public: bool
    created_at: datetime


class PlaceCreate(BaseModel):
    name: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    visit_order: int | None = None
    memo: str | None = None
    rating: int | None = None
    visited_at: datetime | None = None


class PlaceUpdate(PlaceCreate):
    pass


class PlaceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    trip_id: uuid.UUID
    name: str | None
    latitude: float | None
    longitude: float | None
    visit_order: int | None
    memo: str | None
    rating: int | None
    visited_at: datetime | None


class PhotoCreate(BaseModel):
    photo_url: str


class PhotoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    place_id: uuid.UUID
    photo_url: str
    created_at: datetime
