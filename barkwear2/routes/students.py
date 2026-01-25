"""
Students API Routes - Pure MySQL
"""
from flask import Blueprint, request, jsonify
from barkwear2.utils.db import db
from barkwear2.services.face_service import FaceRecognitionService
import cv2
import numpy as np
import base64

students_bp = Blueprint('students', __name__)
face_service = FaceRecognitionService()

@students_bp.route('/', methods=['GET'])
def get_all_students():
    """Get all active students"""
    try:
        query = "SELECT * FROM students WHERE is_active = TRUE"
        students = db.execute_query(query)
        
        return jsonify({
            'success': True,
            'students': students
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@students_bp.route('/<student_id>', methods=['GET'])
def get_student(student_id):
    """Get single student by ID"""
    try:
        query = "SELECT * FROM students WHERE student_id = %s"
        student = db.execute_one(query, (student_id,))
        
        if not student:
            return jsonify({'success': False, 'error': 'Student not found'}), 404
        
        return jsonify({
            'success': True,
            'student': student
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
        check_query = "SELECT student_id FROM students WHERE student_id = %s"
        existing = db.execute_one(check_query, (data['student_id'],))
        
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
        
        # Insert student record
        insert_query = """
            INSERT INTO students 
            (student_id, first_name, last_name, middle_name, email, block, 
             year_level, college_code, face_encoding_path)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        db.execute_insert(insert_query, (
            data['student_id'],
            data['first_name'],
            data['last_name'],
            data.get('middle_name'),
            data.get('email'),
            data['block'],
            data['year_level'],
            data.get('college_code'),
            face_encoding_path
        ))
        
        # Get the created student
        student = db.execute_one(
            "SELECT * FROM students WHERE student_id = %s",
            (data['student_id'],)
        )
        
        return jsonify({
            'success': True,
            'message': 'Student registered successfully',
            'student': student
        }), 201
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@students_bp.route('/<student_id>', methods=['PUT'])
def update_student(student_id):
    """Update student information"""
    try:
        # Check if student exists
        check_query = "SELECT * FROM students WHERE student_id = %s"
        student = db.execute_one(check_query, (student_id,))
        
        if not student:
            return jsonify({'success': False, 'error': 'Student not found'}), 404
        
        data = request.get_json()
        
        # Build dynamic UPDATE query
        update_fields = []
        values = []
        
        if 'first_name' in data:
            update_fields.append("first_name = %s")
            values.append(data['first_name'])
        if 'last_name' in data:
            update_fields.append("last_name = %s")
            values.append(data['last_name'])
        if 'middle_name' in data:
            update_fields.append("middle_name = %s")
            values.append(data['middle_name'])
        if 'email' in data:
            update_fields.append("email = %s")
            values.append(data['email'])
        if 'block' in data:
            update_fields.append("block = %s")
            values.append(data['block'])
        if 'year_level' in data:
            update_fields.append("year_level = %s")
            values.append(data['year_level'])
        
        if not update_fields:
            return jsonify({'success': False, 'error': 'No fields to update'}), 400
        
        values.append(student_id)
        update_query = f"UPDATE students SET {', '.join(update_fields)} WHERE student_id = %s"
        
        db.execute_update(update_query, tuple(values))
        
        # Get updated student
        updated_student = db.execute_one(
            "SELECT * FROM students WHERE student_id = %s",
            (student_id,)
        )
        
        return jsonify({
            'success': True,
            'message': 'Student updated successfully',
            'student': updated_student
        }), 200
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@students_bp.route('/<student_id>', methods=['DELETE'])
def delete_student(student_id):
    """Soft delete student (set is_active to False)"""
    try:
        # Check if student exists
        check_query = "SELECT * FROM students WHERE student_id = %s"
        student = db.execute_one(check_query, (student_id,))
        
        if not student:
            return jsonify({'success': False, 'error': 'Student not found'}), 404
        
        # Soft delete
        update_query = "UPDATE students SET is_active = FALSE WHERE student_id = %s"
        db.execute_update(update_query, (student_id,))
        
        # Delete face encoding
        face_service.delete_face_encoding(student_id)
        
        return jsonify({
            'success': True,
            'message': 'Student deleted successfully'
        }), 200
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500