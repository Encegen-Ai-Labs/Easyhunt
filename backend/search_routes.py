from flask import Blueprint, request, jsonify, g
from sqlalchemy import text

from models import db, Document, SelectedEntry
from utils.jwt_utils import jwt_required
from utils.helper_utils import build_in_params

search_bp = Blueprint("search", __name__)


# ==========================================================
# SEARCH API
# ==========================================================
@search_bp.route("/search", methods=["GET"])
@jwt_required
def search():
    q = request.args.get("q", "").strip()
    purchaser = request.args.get("purchaser", "").strip()
    seller = request.args.get("seller", "").strip()
    docname = request.args.get("docname", "").strip()
    docno = request.args.get("docno", "").strip()
    propdesc = request.args.get("propertydescription", "").strip()
    reg_date = request.args.get("registrationdate", "").strip()
    table_name = request.args.get("table_name", "").strip()

    # 🔑 NEW: group filter
    docname_filter = request.args.get("docname_filter", "").strip()

    exact = request.args.get("exact", "0") == "1"

    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 100))
    offset = (page - 1) * per_page

    user_id = g.current_user.id

    base_query = """
        SELECT d.id, d.docno, d.docname, d.registrationdate, d.sroname,
               d.sellername, d.purchasername, d.propertydescription,
               d.areaname, d.consideration_amt
        FROM documents d
    """

    where = ["d.user_id = :user_id"]
    params = {"user_id": user_id}

    if table_name:
        where.append("d.table_name = :table_name")
        params["table_name"] = table_name

    if q:
        like_q = f"%{q}%"
        where.append("""
            (
              d.purchasername LIKE :like_q OR
              d.sellername LIKE :like_q OR
              d.propertydescription LIKE :like_q OR
              d.docname LIKE :like_q OR
              d.docno LIKE :like_q OR
              d.sroname LIKE :like_q OR
              d.areaname LIKE :like_q
            )
        """)
        params["like_q"] = like_q

    def add_filter(field, value, param):
        if not value:
            return
        if exact:
            where.append(f"d.{field} = :{param}")
            params[param] = value
        else:
            where.append(f"d.{field} LIKE :{param}")
            params[param] = f"%{value}%"

    add_filter("purchasername", purchaser, "purchaser")
    add_filter("sellername", seller, "seller")
    add_filter("docname", docname, "docname_param")
    add_filter("docno", docno, "docno_param")
    add_filter("propertydescription", propdesc, "prop_param")

    # 🔑 APPLY GROUP FILTER BEFORE PAGINATION
    if docname_filter:
        where.append("d.docname = :docname_filter")
        params["docname_filter"] = docname_filter

    # Year-only filtering
    if reg_date:
        where.append("strftime('%Y', d.registrationdate) = :reg_year")
        params["reg_year"] = reg_date

    where_sql = " WHERE " + " AND ".join(where)

    # COUNT (correct after filtering)
    total_sql = text(f"SELECT COUNT(*) FROM documents d {where_sql}")
    total = db.session.execute(total_sql, params).scalar()

    # DATA (correct pagination)
    data_sql = text(
        base_query +
        where_sql +
        " ORDER BY d.id DESC LIMIT :limit OFFSET :offset"
    )

    params.update({"limit": per_page, "offset": offset})
    rows = db.session.execute(data_sql, params).fetchall()

    results = [{
        "id": r[0],
        "docno": r[1],
        "docname": r[2],
        "registrationdate": r[3],
        "sroname": r[4],
        "sellerparty": r[5],
        "purchaserparty": r[6],
        "propertydescription": r[7],
        "areaname": r[8],
        "consideration_amt": r[9]
    } for r in rows]

    # GROUP SUMMARY (still respects other filters)
    group_sql = text("""
        SELECT d.docname, COUNT(*)
        FROM documents d
    """ + where_sql + """
        GROUP BY d.docname
        ORDER BY COUNT(*) DESC
    """)

    group_rows = db.session.execute(group_sql, params).fetchall()

    grouped = [
        {"docname": r[0], "count": r[1]}
        for r in group_rows
    ]

    return jsonify({
        "results": results,
        "total": total,
        "groups": grouped,
        "page": page,
        "per_page": per_page
    })

# ==========================================================
# LIST TABLES PER USER
# ==========================================================
@search_bp.route("/tables", methods=["GET"])
@jwt_required
def list_tables():
    sql = text("""
        SELECT DISTINCT table_name
        FROM uploaded_files
        WHERE user_id = :uid
        ORDER BY table_name
    """)
    rows = db.session.execute(sql, {"uid": g.current_user.id}).fetchall()

    return jsonify({"tables": [r[0] for r in rows]})


# ==========================================================
# GET SELECTED ROWS
# ==========================================================
@search_bp.route("/api/selected_rows", methods=["POST"])
@jwt_required
def api_selected_rows():
    data = request.get_json(force=True)
    ids = data.get("ids", []) or []

    uid = g.current_user.id

    if not ids:
        sel = SelectedEntry.query.filter_by(user_id=uid).order_by(
            SelectedEntry.created_at.desc()).all()
    else:
        try:
            ids = [int(i) for i in ids]
        except:
            return jsonify({"error": "Invalid ids"}), 400

        sel = SelectedEntry.query.filter(
            SelectedEntry.user_id == uid,
            SelectedEntry.document_id.in_(ids)
        ).all()

    if not sel:
        return jsonify({"groups": []}), 200

    doc_ids = [s.document_id for s in sel]
    sel_map = {s.document_id: s for s in sel}

    placeholders, params = build_in_params(doc_ids, "id")
    params["uid"] = uid

    sql = text(f"""
        SELECT id, table_name, docno, docname, registrationdate, sroname,
               sellername, purchasername, propertydescription, areaname,
               consideration_amt, dateofexecution
        FROM documents
        WHERE id IN ({placeholders}) AND user_id = :uid
        ORDER BY id DESC
    """)

    rows = db.session.execute(sql, params).fetchall()

    groups = {}

    for r in rows:
        table_name = r[1]
        doc_id = r[0]

        if table_name not in groups:
            groups[table_name] = {
                "table_name": table_name,
                "chip_label": table_name,
                "rows": []
            }

        groups[table_name]["rows"].append({
            "sel_id": sel_map.get(doc_id).id,
            "document_id": doc_id,
            "docno": r[2],
            "docname": r[3],
            "registrationdate": r[4],
            "sroname": r[5],
            "sellerparty": r[6],
            "purchaserparty": r[7],
            "propertydescription": r[8],
            "areaname": r[9],
            "consideration_amt": r[10],
            "dateofexecution": r[11]
        })

    return jsonify({"groups": list(groups.values())})


# ==========================================================
# SAVE SELECTED ROWS
# ==========================================================
@search_bp.route("/api/save_selected", methods=["POST"])
@jwt_required
def api_save_selected():
    data = request.get_json(force=True)
    entries = data.get("entries", [])

    uid = g.current_user.id
    doc_ids = []

    for e in entries:
        try:
            doc_ids.append(int(e.get("id")))
        except:
            pass

    if not doc_ids:
        return jsonify({"error": "No valid document ids"}), 400

    added = 0
    for doc_id in doc_ids:
        doc = Document.query.filter_by(id=doc_id, user_id=uid).first()
        if not doc:
            continue

        exists = SelectedEntry.query.filter_by(
            document_id=doc_id, user_id=uid).first()
        if exists:
            continue

        sel = SelectedEntry(
            user_id=uid,
            document_id=doc_id,
            table_name=doc.table_name,
            label=doc.table_name
        )

        db.session.add(sel)
        added += 1

    db.session.commit()

    return jsonify({"added": added, "saved_total": len(doc_ids)})


# ==========================================================
# REMOVE SELECTED ONE
# ==========================================================
@search_bp.route("/api/remove_selected", methods=["POST", "DELETE"])
@jwt_required
def api_remove_selected():
    if request.method == "DELETE":
        sid = request.args.get("id")
    else:
        sid = request.get_json(force=True).get("id")

    try:
        sid = int(sid)
    except:
        return jsonify({"error": "Invalid id"}), 400

    sel = SelectedEntry.query.get(sid)
    if not sel or sel.user_id != g.current_user.id:
        return jsonify({"error": "Not found"}), 404

    db.session.delete(sel)
    db.session.commit()

    return jsonify({"deleted": sid})


# ==========================================================
# REMOVE SELECTED ENTIRE GROUP
# ==========================================================
@search_bp.route("/api/remove_selected_group", methods=["POST"])
@jwt_required
def api_remove_selected_group():
    data = request.get_json(force=True)
    table_name = data.get("table_name")
    uid = g.current_user.id

    if not table_name:
        return jsonify({"error": "Missing table_name"}), 400

    docs = Document.query.filter_by(table_name=table_name, user_id=uid).all()
    doc_ids = [d.id for d in docs]

    if not doc_ids:
        return jsonify({"deleted": 0})

    deleted = SelectedEntry.query.filter(
        SelectedEntry.user_id == uid,
        SelectedEntry.document_id.in_(doc_ids)
    ).delete(synchronize_session=False)

    db.session.commit()

    return jsonify({"deleted": deleted})
