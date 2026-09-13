import datetime
from typing import Optional, List
from sqlalchemy import (
    Integer,
    String,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.database.session import Base


def utcnow() -> datetime.datetime:
    """Return current UTC datetime with timezone awareness."""
    return datetime.datetime.now(datetime.timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    external_auth_id: Mapped[Optional[str]] = mapped_column(String(128), nullable=True, unique=True, index=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    preferred_language: Mapped[str] = mapped_column(String(10), default="en", nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )

    # Relationships
    farms: Mapped[List["Farm"]] = relationship("Farm", back_populates="user", cascade="all, delete-orphan")
    scan_history: Mapped[List["ScanHistory"]] = relationship("ScanHistory", back_populates="user")
    saved_advice: Mapped[List["SavedAdvice"]] = relationship("SavedAdvice", back_populates="user", cascade="all, delete-orphan")
    reminders: Mapped[List["Reminder"]] = relationship("Reminder", back_populates="user", cascade="all, delete-orphan")
    notification_preference: Mapped[Optional["NotificationPreference"]] = relationship(
        "NotificationPreference", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )


class Farm(Base):
    __tablename__ = "farms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    farm_name: Mapped[str] = mapped_column(String(128), nullable=False)
    crop: Mapped[str] = mapped_column(String(64), nullable=False)
    land_area: Mapped[float] = mapped_column(Float, nullable=False)
    land_unit: Mapped[str] = mapped_column(String(32), default="acres", nullable=False)
    soil_type: Mapped[str] = mapped_column(String(64), nullable=False)
    irrigation_type: Mapped[str] = mapped_column(String(64), nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    sowing_date: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="farms")


class ScanHistory(Base):
    __tablename__ = "scan_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    crop: Mapped[str] = mapped_column(String(64), nullable=False)
    disease: Mapped[str] = mapped_column(String(128), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    model_mode: Mapped[str] = mapped_column(String(64), default="standard", nullable=False)
    image_reference: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    # Relationships
    user: Mapped[Optional["User"]] = relationship("User", back_populates="scan_history")


class SavedAdvice(Base):
    __tablename__ = "saved_advice"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    question: Mapped[str] = mapped_column(String(1000), nullable=False)
    answer: Mapped[str] = mapped_column(String(4000), nullable=False)
    language: Mapped[str] = mapped_column(String(10), default="en", nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="saved_advice")


class Reminder(Base):
    __tablename__ = "reminders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    due_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="reminders")


class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    weather_alerts: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    mandi_alerts: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    scheme_alerts: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    disease_alerts: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="notification_preference")
