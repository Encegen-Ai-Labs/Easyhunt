from flask import Blueprint, request, jsonify, g
from datetime import datetime, timedelta
import bcrypt
import jwt

from models import db, User
from config import Config
from utils.jwt_utils import create_token, decode_token
from utils.jwt_utils import jwt_required, admin_required

auth_bp = Blueprint("auth", __name__)


# -----------------------------
# LOGIN
# -----------------------------
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(force=True)
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    # Auto-expiry check
    if user.expiry_date and datetime.utcnow() > user.expiry_date:
        user.is_active = False
        db.session.commit()
        return jsonify({"error": "User account expired. Contact admin."}), 403

    if not user.is_active:
        return jsonify({"error": "User inactive. Contact admin."}), 403

    try:
        ok = bcrypt.checkpw(password.encode("utf-8"), user.password_hash.encode("utf-8"))
    except Exception:
        ok = False

    if not ok:
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_token(user)

    return jsonify({"message": "ok", "token": token, "user": user.as_dict()})


# -----------------------------
# FORGOT PASSWORD (generates reset token)
# -----------------------------
@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json(force=True)
    email = (data.get("email") or "").strip().lower()

    if not email:
        return jsonify({"error": "Email required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"message": "If account exists, instructions sent."}), 200

    payload = {
        "sub": str(user.id),
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(hours=1),
    }

    token = jwt.encode(payload, Config.JWT_SECRET, algorithm=Config.JWT_ALGORITHM)
    if not isinstance(token, str):
        token = token.decode()

    return jsonify({"message": "Reset token (dev mode)", "reset_token": token})


# -----------------------------
# RESET PASSWORD
# -----------------------------
@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json(force=True)
    token = data.get("token")
    new_password = data.get("new_password")

    if not token or not new_password:
        return jsonify({"error": "Token & new password required"}), 400

    payload = decode_token(token)
    if not payload:
        return jsonify({"error": "Invalid or expired token"}), 400

    user = User.query.get(int(payload["sub"]))
    if not user:
        return jsonify({"error": "User not found"}), 404

    hashed = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode("utf-8")
    user.password_hash = hashed
    db.session.commit()

    return jsonify({"message": "Password reset successful"})


# -----------------------------
# PROFILE (Logged-in user)
# -----------------------------
@auth_bp.route("/profile", methods=["GET"])
@jwt_required
def profile():
    user = g.current_user
    return jsonify(user.as_dict())


# -----------------------------
# UPDATE PROFILE
# -----------------------------
@auth_bp.route("/profile/update", methods=["PUT"])
@jwt_required
def update_profile():
    user = g.current_user
    data = request.get_json()

    updated = False

    new_name = data.get("name")
    new_email = data.get("email")
    old_pw = data.get("old_password")
    new_pw = data.get("new_password")

    if new_name and new_name != user.name:
        user.name = new_name
        updated = True

    if new_email and new_email != user.email:
        exists = User.query.filter_by(email=new_email).first()
        if exists:
            return jsonify({"error": "Email already exists"}), 400
        user.email = new_email
        updated = True

    if new_pw:
        if not old_pw:
            return jsonify({"error": "Old password required"}), 400

        ok = bcrypt.checkpw(old_pw.encode(), user.password_hash.encode("utf-8"))
        if not ok:
            return jsonify({"error": "Old password incorrect"}), 400

        user.password_hash = bcrypt.hashpw(new_pw.encode(), bcrypt.gensalt()).decode(
            "utf-8"
        )
        updated = True

    if not updated:
        return jsonify({"message": "No changes made"}), 200

    db.session.commit()
    return jsonify({"message": "Profile updated successfully"})
