import logging
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.app.config import DATABASE_URL

logger = logging.getLogger("kisanmitra.database")

# Configure engine with SQLite thread check accommodation if SQLite is used
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db() -> Generator:
    """Dependency generator that yields a database session and ensures closure."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Initialize database tables and create initial development seeds if absent."""
    # Import all models to ensure they register on Base.metadata
    from backend.app.database import models  # noqa: F401

    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables verified.")

    # Ensure a development user exists for local API development
    db = SessionLocal()
    try:
        from backend.app.database.models import User, NotificationPreference

        dev_user = db.query(User).filter(User.id == 1).first()
        if not dev_user:
            logger.info("Creating default development user (id=1)...")
            dev_user = User(
                id=1,
                name="Kisan Farmer",
                email="farmer@kisanmitra.ai",
                preferred_language="hi",
            )
            db.add(dev_user)
            db.flush()

            # Ensure notification preference exists for dev user
            prefs = NotificationPreference(
                user_id=dev_user.id,
                weather_alerts=True,
                mandi_alerts=True,
                scheme_alerts=True,
                disease_alerts=True,
            )
            db.add(prefs)
            db.commit()
            logger.info("Default development user created successfully.")
    except Exception as exc:
        db.rollback()
        logger.error("Failed during initial development seed: %s", exc)
        raise exc
    finally:
        db.close()
