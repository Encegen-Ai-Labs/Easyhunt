from functools import wraps
from flask import request, jsonify, g
import jwt
from datetime import datetime, timedelta

from config import Config
from models import User
from extensions import db

# ---------------------------
# Token helpers
# ---------------------------
def create_token(user, expires_days=None):
    if expires_days is None:
        expires_days = Config.JWT_EXP_DAYS
    exp = datetime.utcnow() + timedelta(days=expires_days)
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "name": user.name,
        "role": "admin" if user.is_admin else "user",
        "exp": exp,
        "iat": datetime.utcnow(),
    }
    token = jwt.encode(payload, Config.JWT_SECRET, algorithm=getattr(Config, "JWT_ALGORITHM", "HS256"))
    # pyjwt >=2 returns str, if bytes decode
    return token if isinstance(token, str) else token.decode()


def decode_token(token):
    try:
        payload = jwt.decode(token, Config.JWT_SECRET, algorithms=[getattr(Config, "JWT_ALGORITHM", "HS256")])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except Exception:
        return None


def get_token_from_header():
    auth = request.headers.get("Authorization", "") or ""
    if auth.startswith("Bearer "):
        return auth.split(" ", 1)[1].strip()
    # fallback to JSON body token or query param
    if request.is_json:
        try:
            return request.get_json().get("token")
        except Exception:
            pass
    return request.args.get("token")


# ---------------------------
# Decorators
# ---------------------------
def jwt_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        token = get_token_from_header()
        if not token:
            return jsonify({"error": "Authorization token required"}), 401

        payload = decode_token(token)
        if not payload:
            return jsonify({"error": "Invalid or expired token"}), 401

        user_id = payload.get("sub")
        try:
            user = User.query.get(int(user_id))
        except Exception:
            user = None

        if not user:
            return jsonify({"error": "User not found"}), 401

        # expiry_date handling: if expiry_date exists and passed, deactivate
        try:
            expiry = getattr(user, "expiry_date", None)
            if expiry and isinstance(expiry, datetime) and datetime.utcnow() > expiry:
                if user.is_active:
                    user.is_active = False
                    db.session.commit()
                return jsonify({"error": "Account expired. Contact admin."}), 403
        except Exception:
            # don't block on expiry check error
            pass

        if not user.is_active:
            return jsonify({"error": "User inactive. Contact admin."}), 403

        g.current_user = user
        return f(*args, **kwargs)
    return wrapper


def admin_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        token = get_token_from_header()
        if not token:
            return jsonify({"error": "Authorization token required"}), 401

        payload = decode_token(token)
        if not payload:
            return jsonify({"error": "Invalid or expired token"}), 401

        # quick role check (token may be tampered so still verify DB user)
        if payload.get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403

        user_id = payload.get("sub")
        try:
            user = User.query.get(int(user_id))
        except Exception:
            user = None

        if not user or not user.is_admin:
            return jsonify({"error": "Admin not found"}), 403

        # expiry_date handling for admin too (optional)
        try:
            expiry = getattr(user, "expiry_date", None)
            if expiry and isinstance(expiry, datetime) and datetime.utcnow() > expiry:
                if user.is_active:
                    user.is_active = False
                    db.session.commit()
                return jsonify({"error": "Admin account expired"}), 403
        except Exception:
            pass

        g.current_user = user
        return f(*args, **kwargs)
    return wrapper
