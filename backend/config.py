import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
    # App / session secrets
    SECRET_KEY = os.environ.get("SECRET_KEY", "change-me")

    # Database (default: sqlite file inside project folder)
    DB_FILENAME = os.environ.get("DB_FILENAME", "Ado.db")
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        f"sqlite:///{os.path.join(BASE_DIR, DB_FILENAME)}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Uploads
    UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER", os.path.join(BASE_DIR, "uploads"))

    # JWT
    JWT_SECRET = os.environ.get("JWT_SECRET", "change-me")
    JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
    JWT_EXP_DAYS = int(os.environ.get("JWT_EXP_DAYS", "7"))

    # Super admin (dev defaults)
    SUPER_ADMIN_EMAIL = os.environ.get("SUPER_ADMIN_EMAIL", "admin@example.com")
    SUPER_ADMIN_PW = os.environ.get("SUPER_ADMIN_PW", "admin123")