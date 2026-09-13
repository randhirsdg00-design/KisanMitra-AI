"""API Routes package aggregating all domain routers under /api."""

from fastapi import APIRouter
from backend.app.routes.farms import router as farms_router
from backend.app.routes.history import router as history_router
from backend.app.routes.advice import router as advice_router
from backend.app.routes.reminders import router as reminders_router
from backend.app.routes.notifications import router as notifications_router
from backend.app.routes.assistant import router as assistant_router
from backend.app.routes.auth import router as auth_router
from backend.app.routes.weather import router as weather_router
from backend.app.routes.mandi import router as mandi_router

api_router = APIRouter(prefix="/api")

api_router.include_router(farms_router)
api_router.include_router(history_router)
api_router.include_router(advice_router)
api_router.include_router(reminders_router)
api_router.include_router(notifications_router)
api_router.include_router(assistant_router)
api_router.include_router(auth_router)
api_router.include_router(weather_router)
api_router.include_router(mandi_router)

__all__ = ["api_router"]
