from utils.db import db
from datetime import datetime

class Schedule(db.Model):
    __tablename__ = 'schedules'
    
    schedule_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    subject_code = db.Column(db.String(20), nullable=False)
    subject_name = db.Column(db.String(100), nullable=False)
    block = db.Column(db.String(10), nullable=False)
    year_level = db.Column(db.Integer, nullable=False)
    day_of_week = db.Column(db.String(10), nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    room_code = db.Column(db.String(20))
    instructor_name = db.Column(db.String(100))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    attendances = db.relationship('Attendance', backref='schedule', lazy=True)
    
    def to_dict(self):
        return {
            'schedule_id': self.schedule_id,
            'subject_code': self.subject_code,
            'subject_name': self.subject_name,
            'block': self.block,
            'year_level': self.year_level,
            'day_of_week': self.day_of_week,
            'start_time': self.start_time.strftime('%H:%M:%S') if self.start_time else None,
            'end_time': self.end_time.strftime('%H:%M:%S') if self.end_time else None,
            'room_code': self.room_code,
            'instructor_name': self.instructor_name,
            'is_active': self.is_active
        }