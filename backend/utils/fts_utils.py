from sqlalchemy import text

def ensure_fts_table(db):
    """
    Attempt to create the FTS5 virtual table if SQLite compiled with FTS5.
    Safe to call every startup.
    """
    try:
        db.session.execute(text("""
            CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts 
            USING fts5(
                docid UNINDEXED, 
                purchasername, 
                sellername, 
                propertydescription, 
                docname, 
                docno, 
                content=''
            );
        """))
        db.session.commit()
    except Exception as e:
        # FTS may not be available in the SQLite build; ignore but log if you have logger access
        try:
            db.session.rollback()
        except:
            pass
        print("FTS5 not available or create failed:", e)
