from utils.db import db
from datetime import datetime

class Student(db.Model):
    __tablename__ = 'students'
    
    student_id = db.Column(db.String(20), primary_key=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    middle_name = db.Column(db.String(50))
    email = db.Column(db.String(100), unique=True)
    block = db.Column(db.String(10), nullable=False)
    year_level = db.Column(db.Integer, nullable=False)
    college_code = db.Column(db.String(10))
    face_encoding_path = db.Column(db.String(255))
    photo_path = db.Column(db.String(255))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    attendances = db.relationship('Attendance', backref='student', lazy=True)
    violations = db.relationship('Violation', backref='student', lazy=True)
    
    def to_dict(self):
        return {
            'student_id': self.student_id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'middle_name': self.middle_name,
            'email': self.email,
            'block': self.block,
            'year_level': self.year_level,
            'college_code': self.college_code,
            'is_active': self.is_active
        }
    
    @property
    def full_name(self):
        middle = f" {self.middle_name[0]}." if self.middle_name else ""
        return f"{self.first_name}{middle} {self.last_name}"