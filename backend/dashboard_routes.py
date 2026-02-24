from flask import Blueprint, jsonify, g
from utils.jwt_utils import jwt_required
from models import db, Document, SelectedEntry, UploadedFile

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/dashboard")


@dashboard_bp.route("/stats", methods=["GET"])
@jwt_required
def dashboard_stats():

    uid = g.current_user.id

    # total records extracted from excel
    total_documents = Document.query.filter_by(user_id=uid).count()

    # selected entries
    total_selected = SelectedEntry.query.filter_by(user_id=uid).count()

    # number of uploaded files
    total_uploads = UploadedFile.query.filter_by(user_id=uid).count()

    return jsonify({
        "total_data_fetched": total_uploads,
        "total_entries": total_documents,
        "total_export": total_selected
    })