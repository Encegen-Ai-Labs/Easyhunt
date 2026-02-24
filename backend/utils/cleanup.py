import os
from datetime import datetime, timedelta
from threading import Thread
from time import sleep

from models import db, UploadedFile

CLEANUP_DAYS = 30

def cleanup_old_files(app):
    """
    Deletes uploaded files older than CLEANUP_DAYS for all users.
    Should be called within app.app_context().
    """
    with app.app_context():
        try:
            cutoff = datetime.utcnow() - timedelta(days=CLEANUP_DAYS)
            old_files = UploadedFile.query.filter(UploadedFile.upload_date < cutoff).all()
            if not old_files:
                return

            removed = 0
            for f in old_files:
                try:
                    if f.filepath and os.path.exists(f.filepath):
                        os.remove(f.filepath)
                except Exception as e:
                    app.logger.warning(f"Could not remove file {f.filepath}: {e}")

                try:
                    db.session.delete(f)
                    removed += 1
                except Exception as e:
                    app.logger.warning(f"Could not delete DB record for {f.id}: {e}")

            db.session.commit()
            app.logger.info(f"Cleanup: removed {removed} uploaded file records.")
        except Exception as e:
            app.logger.error(f"Cleanup error: {e}")


def start_cleanup_thread(app, interval_seconds=24*60*60):
    """
    Start background daemon thread that runs cleanup once every interval_seconds.
    Pass the Flask `app` instance.
    """
    def worker():
        while True:
            try:
                cleanup_old_files(app)
            except Exception as e:
                app.logger.error(f"Cleanup worker error: {e}")
            sleep(interval_seconds)

    t = Thread(target=worker, daemon=True)
    t.start()
    return t
