"""
Students API Routes
"""
from flask import Blueprint, request, jsonify
from backend.models.student import Student
from utils.db import db
from services.face_service import FaceRecognitionService
import cv2
import numpy as np
import base64

students_bp = Blueprint('students', __name__)
face_service = FaceRecognitionService()

@students_bp.route('/', methods=['GET'])
def get_all_students():
    """Get all students"""
    try:
        students = Student.query.filter_by(is_active=True).all()
        return jsonify({
            'success': True,
            'students': [s.to_dict() for s in students]
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@students_bp.route('/<student_id>', methods=['GET'])
def get_student(student_id):
    """Get single student by ID"""
    try:
        student = Student.query.get(student_id)
        if not student:
            return jsonify({'success': False, 'error': 'Student not found'}), 404
        
        return jsonify({
            'success': True,
            'student': student.to_dict()
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@students_bp.route('/', methods=['POST'])
def create_student():
    """
    Create new student with face encoding
    Expected JSON:
    {
        "student_id": "2021-00001",
        "first_name": "Juan",
        "last_name": "Dela Cruz",
        "middle_name": "Santos",
        "email": "juan@example.com",
        "block": "A",
        "year_level": 3,
        "college_code": "CCS",
        "face_image": "base64_encoded_image"
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['student_id', 'first_name', 'last_name', 'block', 'year_level']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Check if student already exists
        existing = Student.query.get(data['student_id'])
        if existing:
            return jsonify({
                'success': False,
                'error': 'Student ID already exists'
            }), 400
        
        # Process face image if provided
        face_encoding_path = None
        if 'face_image' in data and data['face_image']:
            # Decode base64 image
            image_data = base64.b64decode(data['face_image'].split(',')[1])
            nparr = np.frombuffer(image_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Save face encoding
            result = face_service.save_face_encoding(data['student_id'], image_rgb)
            
            if not result['success']:
                return jsonify({
                    'success': False,
                    'error': result['message']
                }), 400
            
            face_encoding_path = result['encoding_path']
        
        # Create student record
        student = Student(
            student_id=data['student_id'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            middle_name=data.get('middle_name'),
            email=data.get('email'),
            block=data['block'],
            year_level=data['year_level'],
            college_code=data.get('college_code'),
            face_encoding_path=face_encoding_path
        )
        
        db.session.add(student)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Student registered successfully',
            'student': student.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@students_bp.route('/<student_id>', methods=['PUT'])
def update_student(student_id):
    """Update student information"""
    try:
        student = Student.query.get(student_id)
        if not student:
            return jsonify({'success': False, 'error': 'Student not found'}), 404
        
        data = request.get_json()
        
        # Update fields
        if 'first_name' in data:
            student.first_name = data['first_name']
        if 'last_name' in data:
            student.last_name = data['last_name']
        if 'middle_name' in data:
            student.middle_name = data['middle_name']
        if 'email' in data:
            student.email = data['email']
        if 'block' in data:
            student.block = data['block']
        if 'year_level' in data:
            student.year_level = data['year_level']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Student updated successfully',
            'student': student.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@students_bp.route('/<student_id>', methods=['DELETE'])
def delete_student(student_id):
    """Soft delete student (set is_active to False)"""
    try:
        student = Student.query.get(student_id)
        if not student:
            return jsonify({'success': False, 'error': 'Student not found'}), 404
        
        student.is_active = False
        db.session.commit()
        
        # Delete face encoding
        face_service.delete_face_encoding(student_id)
        
        return jsonify({
            'success': True,
            'message': 'Student deleted successfully'
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500