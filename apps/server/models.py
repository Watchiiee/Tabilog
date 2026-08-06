import uuid
from datetime import date, datetime

from sqlalchemy import ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True)
    email: Mapped[str | None]
    nickname: Mapped[str | None]
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


class Trip(Base):
    __tablename__ = "trips"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    title: Mapped[str]
    start_date: Mapped[date | None]
    end_date: Mapped[date | None]
    solar_summary: Mapped[str | None]
    sentiment_badge: Mapped[str | None]
    total_distance: Mapped[float | None]
    is_public: Mapped[bool]
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    places: Mapped[list["Place"]] = relationship(back_populates="trip", cascade="all, delete-orphan")


class Place(Base):
    __tablename__ = "places"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    trip_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("trips.id"))
    name: Mapped[str | None]
    latitude: Mapped[float | None]
    longitude: Mapped[float | None]
    visit_order: Mapped[int | None]
    memo: Mapped[str | None]
    rating: Mapped[int | None]
    visited_at: Mapped[datetime | None]

    trip: Mapped[Trip] = relationship(back_populates="places")
    photos: Mapped[list["Photo"]] = relationship(back_populates="place", cascade="all, delete-orphan")


class Photo(Base):
    __tablename__ = "photos"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    place_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("places.id"))
    photo_url: Mapped[str]
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    place: Mapped[Place] = relationship(back_populates="photos")
