from flask import Blueprint, request, jsonify, g
from datetime import datetime
import bcrypt

from models import db, User
from utils.jwt_utils import admin_required

admin_bp = Blueprint("admin", __name__, url_prefix="/admin")


# ------------------------------------------
# LIST ALL USERS
# ------------------------------------------
@admin_bp.route("/users", methods=["GET"])
@admin_required
def admin_list_users():
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify({"users": [u.as_dict() for u in users]}), 200


# ------------------------------------------
# CREATE USER
# ------------------------------------------
@admin_bp.route("/create_user", methods=["POST"])
@admin_required
def admin_create_user():
    data = request.get_json(force=True)

    email = (data.get("email") or "").strip().lower()
    password = data.get("password")
    name = data.get("name")
    phone1 = data.get("phone1")
    phone2 = data.get("phone2")
    address = data.get("address")

    is_admin = bool(data.get("is_admin", False))
    is_active = True if data.get("is_active") is None else bool(data.get("is_active"))

    expiry_date_str = data.get("expiry_date")
    expiry_date = None

    if expiry_date_str:
        try:
            expiry_date = datetime.fromisoformat(expiry_date_str)
        except Exception:
            return jsonify({
                "error": "Invalid expiry_date format. Use ISO format (YYYY-MM-DDTHH:MM:SS)"
            }), 400

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 400

    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode("utf-8")

    user = User(
        email=email,
        password_hash=hashed,
        name=name,
        phone1=phone1,
        phone2=phone2,
        address=address,
        is_admin=is_admin,
        is_active=is_active,
        expiry_date=expiry_date,
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "User created", "user": user.as_dict()}), 201


# ------------------------------------------
# UPDATE USER (ALL FIELDS)
# ------------------------------------------
@admin_bp.route("/update_user", methods=["POST"])
@admin_required
def admin_update_user():
    data = request.get_json()

    user_id = data.get("id")
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    # Basic fields
    user.name = data.get("name", user.name)
    user.email = data.get("email", user.email)
    user.phone1 = data.get("phone1", user.phone1)
    user.phone2 = data.get("phone2", user.phone2)
    user.address = data.get("address", user.address)

    # Active status
    if "is_active" in data:
        user.is_active = bool(data.get("is_active"))

    # Admin role
    if "is_admin" in data:
        user.is_admin = bool(data.get("is_admin"))

    # Expiry date
    expiry_date_str = data.get("expiry_date")
    if expiry_date_str:
        try:
            user.expiry_date = datetime.fromisoformat(expiry_date_str)
        except Exception:
            return jsonify({"error": "Invalid expiry_date format"}), 400

    # Admin password reset
    new_pw = data.get("new_password")
    if new_pw and new_pw.strip() != "":
        hashed = bcrypt.hashpw(new_pw.encode(), bcrypt.gensalt()).decode("utf-8")
        user.password_hash = hashed

    db.session.commit()

    return jsonify({"message": "User updated", "user": user.as_dict()}), 200


# ------------------------------------------
# UPDATE ACTIVE / INACTIVE STATUS
# ------------------------------------------
@admin_bp.route("/set_status", methods=["POST"])
@admin_required
def admin_set_status():
    data = request.get_json(force=True)
    user_id = data.get("user_id")
    status = data.get("status")

    try:
        user_id = int(user_id)
    except:
        return jsonify({"error": "Invalid user_id"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # prevent admin disabling themselves
    if g.current_user.id == user.id:
        return jsonify({"error": "You cannot disable yourself"}), 400

    user.is_active = bool(status)
    db.session.commit()

    return jsonify({"message": "Status updated", "user": user.as_dict()}), 200


# ------------------------------------------
# SET EXPIRY DATE (VALIDITY)
# ------------------------------------------
@admin_bp.route("/set_expiry", methods=["POST"])
@admin_required
def admin_set_expiry():
    data = request.get_json(force=True)

    user_id = data.get("user_id")
    expiry_str = data.get("expiry_date")

    try:
        user_id = int(user_id)
    except:
        return jsonify({"error": "Invalid user_id"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    if g.current_user.id == user.id:
        return jsonify({"error": "Cannot change your own expiry"}), 400

    if not expiry_str:
        user.expiry_date = None
    else:
        try:
            expiry_date = datetime.fromisoformat(expiry_str)
        except Exception:
            return jsonify({"error": "Invalid expiry_date format"}), 400

        user.expiry_date = expiry_date

        # If expiry already passed → deactivate immediately
        if datetime.utcnow() > expiry_date:
            user.is_active = False
        else:
            user.is_active = True

    db.session.commit()

    return jsonify({"message": "Expiry updated", "user": user.as_dict()}), 200


# ------------------------------------------
# DELETE USER
# ------------------------------------------
@admin_bp.route("/delete_user", methods=["POST"])
@admin_required
def admin_delete_user():
    data = request.get_json()
    user_id = data.get("user_id")

    admin_id = g.current_user.id

    # prevent deleting self
    if int(user_id) == admin_id:
        return jsonify({"error": "You cannot delete your own admin account"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    db.session.delete(user)
    db.session.commit()

    return jsonify({"message": "User deleted successfully"}), 200
