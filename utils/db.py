from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def init_db(app):
    db.init_app(app)
    with app.app_context():
        from models.student import Student
        from models.schedule import Schedule
        from models.attendance import Attendance, Violation
        db.create_all()
        print("✅ Database initialized")

def get_db():
    return db.session