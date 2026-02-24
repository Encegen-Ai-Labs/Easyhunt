import os
from threading import Thread

from flask import Blueprint, request, jsonify, g, current_app
from werkzeug.utils import secure_filename
from sqlalchemy import text

from models import db, UploadedFile, Document, UploadJob
from extractor import extract_rows_from_excel
from utils.jwt_utils import jwt_required
from utils.helper_utils import allowed_file, safe_float

file_bp = Blueprint("file", __name__, url_prefix="/upload")


# ======================================================
# BACKGROUND FILE PROCESSOR
# ======================================================
def process_files_background(app, saved_paths, table_name, uid, job_id):

    with app.app_context():

        job = UploadJob.query.get(job_id)

        for fpath in saved_paths:

            try:

                fname = os.path.basename(fpath)

                # save metadata
                uf = UploadedFile(
                    user_id=uid,
                    filename=fname,
                    filepath=fpath,
                    filesize=os.path.getsize(fpath),
                    table_name=table_name
                )
                db.session.add(uf)
                db.session.flush()

                # 🔥 NOW PARSER WILL WORK
                rows = extract_rows_from_excel(fpath)

                docs = []
                for r in rows:
                    docs.append({
                        "user_id": uid,
                        "file_id": uf.id,
                        "table_name": table_name,
                        "docno": r.get("docno"),
                        "docname": r.get("docname"),
                        "registrationdate": r.get("registrationdate"),
                        "dateofexecution": r.get("dateofexecution"),
                        "purchasername": r.get("purchasername"),
                        "sellername": r.get("sellername"),
                        "propertydescription": r.get("propertydescription"),
                        "areaname": r.get("areaname"),
                        "sroname": r.get("sroname"),
                        "consideration_amt": safe_float(r.get("consideration_amt")),
                        "marketvalue": safe_float(r.get("marketvalue")),
                        "raw_json": r.get("raw_json")
                    })

                if docs:
                    db.session.bulk_insert_mappings(Document, docs)

                db.session.commit()

            except Exception as e:
                print("UPLOAD ERROR:", e)  # <-- ADD THIS (IMPORTANT)
                db.session.rollback()

            job.processed_files += 1
            db.session.commit()

        job.status = "done"
        db.session.commit()


# ======================================================
# START UPLOAD (FAST RESPONSE)
# ======================================================
@file_bp.route("", methods=["POST"])
@jwt_required
def upload_files():

    files = request.files.getlist("files")
    table_name = request.form.get("table_name", "").strip()

    if not table_name:
        return jsonify({"error": "Table name is required"}), 400
    if not files:
        return jsonify({"error": "No files uploaded"}), 400

    uid = g.current_user.id

    user_folder = os.path.join(current_app.config["UPLOAD_FOLDER"], str(uid))
    table_folder = os.path.join(user_folder, table_name)
    os.makedirs(table_folder, exist_ok=True)

    saved_paths = []

    # 🔴 SAVE FILES HERE (NOT IN THREAD)
    for file in files:
        fname = secure_filename(file.filename)
        fpath = os.path.join(table_folder, fname)
        file.save(fpath)
        saved_paths.append(fpath)

    # create job
    job = UploadJob(
        user_id=uid,
        table_name=table_name,
        total_files=len(saved_paths),
        processed_files=0,
        status="processing"
    )
    db.session.add(job)
    db.session.commit()

    app = current_app._get_current_object()

    Thread(
        target=process_files_background,
        args=(app, saved_paths, table_name, uid, job.id),
        daemon=True
    ).start()

    return jsonify({"job_id": job.id}), 200
# ======================================================
# CHECK PROGRESS
# ======================================================
@file_bp.route("/status/<int:job_id>", methods=["GET"])
@jwt_required
def upload_status(job_id):

    job = UploadJob.query.get(job_id)

    if not job:
        return jsonify({"error": "Job not found"}), 404

    return jsonify({
        "total": job.total_files,
        "processed": job.processed_files,
        "status": job.status
    })
