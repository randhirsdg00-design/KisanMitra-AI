import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.exceptions import HTTPException, RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.config import APP_ENV, CORS_ORIGINS
from backend.app.database import init_db
from backend.app.core.exceptions import AppException
from backend.app.routes import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("kisanmitra.backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager for startup and shutdown procedures."""
    logger.info("Executing startup procedures: initializing database...")
    init_db()
    yield
    logger.info("Executing shutdown procedures...")


app = FastAPI(
    title="KisanMitra AI API",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Structured Error Handling Architecture
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    """Handle domain application exceptions with consistent structured response."""
    content = {
        "success": False,
        "error": exc.error,
        "message": exc.message,
    }
    if exc.details:
        content["details"] = exc.details
    return JSONResponse(
        status_code=exc.status_code,
        content=content,
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Map standard HTTP exceptions to the structured API error contract."""
    code_map = {
        400: "bad_request",
        401: "unauthorized",
        403: "forbidden",
        404: "not_found",
        405: "method_not_allowed",
        409: "conflict",
        429: "rate_limit_exceeded",
    }
    error_code = code_map.get(exc.status_code, "http_error")
    detail_msg = exc.detail if isinstance(exc.detail, str) else str(exc.detail)

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": error_code,
            "message": detail_msg,
        },
        headers=exc.headers,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle request validation errors cleanly with structured JSON."""
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": "validation_error",
            "message": "Request validation failed.",
            "details": exc.errors(),
        },
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch unhandled exceptions to prevent leaking stack traces to clients."""
    logger.error("Unhandled error processing request %s: %s", request.url.path, exc, exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "internal_error",
            "message": "An internal server error occurred. Please try again later.",
        },
    )


# Health Check Endpoint
@app.get("/health", tags=["Health"], summary="Service health status")
async def health_check():
    """Health check endpoint to verify backend service availability."""
    return {
        "status": "ok",
        "service": "KisanMitra AI Backend",
    }


# Include Domain API Routers
app.include_router(api_router)
