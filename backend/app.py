from flask import Flask
from flask_cors import CORS

from config import Config
from extensions import db

# Blueprints
from auth_routes import auth_bp
from admin_routes import admin_bp
from search_routes import search_bp
from file_routes import file_bp
from export_routes import export_bp
from dashboard_routes import dashboard_bp
# Utils
from utils.cleanup import start_cleanup_thread
from utils.fts_utils import ensure_fts_table
from dotenv import load_dotenv
load_dotenv()   # will read .env in project root


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)

    # CORS  ← MUST BE INSIDE FUNCTION
    CORS(
        app,
        supports_credentials=True,
        resources={
            r"/*": {
                "origins": [
                    "http://localhost:5173",
                    "http://127.0.0.1:5173"
                ],
                "allow_headers": ["Authorization", "Content-Type"],
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                "expose_headers": ["Content-Disposition"]
            }
        }
    )

    # Register Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(search_bp)
    app.register_blueprint(file_bp)
    app.register_blueprint(export_bp)
    app.register_blueprint(dashboard_bp)

    # ---- DATABASE SETUP ----
    with app.app_context():
        db.create_all()
        ensure_fts_table(db)

        # -----------------------------------------------------------
        # ✅ ADD SUPER ADMIN CREATION CODE HERE (INSIDE app_context)
        # -----------------------------------------------------------
        from models import User
        import bcrypt

        try:
            existing_admin = User.query.filter_by(is_admin=True).first()
            if not existing_admin:
                pw = Config.SUPER_ADMIN_PW
                hashed = bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

                admin = User(
                    email=Config.SUPER_ADMIN_EMAIL.lower(),
                    password_hash=hashed,
                    name="Super Admin",
                    is_admin=True,
                    is_active=True
                )

                db.session.add(admin)
                db.session.commit()

                print("✔ Super admin created:")
                print(f"  Email: {Config.SUPER_ADMIN_EMAIL}")
                print(f"  Password: {Config.SUPER_ADMIN_PW}")

        except Exception as e:
            db.session.rollback()
            print(" Failed to create super admin:", e)
        # -----------------------------------------------------------

    # Start cleanup thread
    start_cleanup_thread(app)

    return app



if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)