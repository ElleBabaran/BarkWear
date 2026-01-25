"""
Attendance and Violation Models
"""
from utils.db import db
from datetime import datetime

class Attendance(db.Model):
    __tablename__ = 'attendance'
    
    attendance_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id = db.Column(db.String(20), db.ForeignKey('students.student_id'), nullable=False)
    schedule_id = db.Column(db.Integer, db.ForeignKey('schedules.schedule_id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    time_in = db.Column(db.Time)
    status = db.Column(db.String(10), nullable=False)  # present, late, absent
    has_violation = db.Column(db.Boolean, default=False)
    remarks = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'attendance_id': self.attendance_id,
            'student_id': self.student_id,
            'schedule_id': self.schedule_id,
            'date': self.date.isoformat() if self.date else None,
            'time_in': self.time_in.strftime('%H:%M:%S') if self.time_in else None,
            'status': self.status,
            'has_violation': self.has_violation,
            'remarks': self.remarks,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f"<Attendance {self.student_id} - {self.date} ({self.status})>"


class Violation(db.Model):
    __tablename__ = 'violations'
    
    violation_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    attendance_id = db.Column(db.Integer, db.ForeignKey('attendance.attendance_id'), nullable=False)
    student_id = db.Column(db.String(20), db.ForeignKey('students.student_id'), nullable=False)
    violation_type = db.Column(db.String(50), nullable=False)  # no_polo, no_pants, no_id, etc.
    description = db.Column(db.Text)
    severity = db.Column(db.String(20), default='minor')  # minor, major, critical
    image_path = db.Column(db.String(255))  # Screenshot of violation
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    attendance = db.relationship('Attendance', backref='violations_detail', lazy=True)
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'violation_id': self.violation_id,
            'attendance_id': self.attendance_id,
            'student_id': self.student_id,
            'violation_type': self.violation_type,
            'description': self.description,
            'severity': self.severity,
            'image_path': self.image_path,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f"<Violation {self.student_id} - {self.violation_type}>"