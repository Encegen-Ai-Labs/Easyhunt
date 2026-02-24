import os

ALLOWED_EXT = {"xls", "xlsx", "csv"}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXT


def safe_float(v):
    try:
        if v is None or v == "" or str(v).strip() == "":
            return None
        return float(str(v).replace(",", "").strip())
    except Exception:
        return None


def build_in_params(int_ids, prefix="id"):
    """
    Given a list of ints, returns a tuple:
      (" :id0, :id1, :id2 ", { "id0": val0, "id1": val1, ... })
    Used to create parameterized IN (...) SQL fragments.
    """
    placeholders = ", ".join([f":{prefix}{i}" for i in range(len(int_ids))])
    params = {f"{prefix}{i}": int_ids[i] for i in range(len(int_ids))}
    return placeholders, params
