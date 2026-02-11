"""
Students API Routes - Pure MySQL
"""
from flask import Blueprint, request, jsonify, send_file
from barkwear2.utils.db import db
from barkwear2.services.face_service import FaceRecognitionService
from barkwear2.config import Config
import cv2
import numpy as np
import base64
import os
from pathlib import Path
from werkzeug.utils import secure_filename

students_bp = Blueprint('students', __name__, url_prefix='/students')
face_service = FaceRecognitionService()

def save_student_photos(student_id, photos_base64):
    """
    Save the three enrollment photos to disk.
    
    Args:
        student_id: The student's ID (used as folder name)
        photos_base64: List of 3 base64-encoded images
    
    Returns:
        relative_folder_path (str): e.g. "Student_Pics/2021-00001"
    """
    # Sanitize student ID for folder name
    folder_name = secure_filename(student_id)
    relative_folder = f"Student_Pics/{folder_name}"
    full_folder_path = os.path.join(Config.STUDENT_PHOTO_FOLDER, folder_name)
    
    # Create folder (if not exists)
    os.makedirs(full_folder_path, exist_ok=True)
    
    # Save each photo
    for idx, photo_b64 in enumerate(photos_base64, start=1):
        # Remove data URL prefix if present
        if ',' in photo_b64:
            photo_b64 = photo_b64.split(',')[1]
        
        # Decode and save
        img_bytes = base64.b64decode(photo_b64)
        img_path = os.path.join(full_folder_path, f"{idx}.jpg")
        with open(img_path, 'wb') as f:
            f.write(img_bytes)
    
    return relative_folder

@students_bp.route('/', methods=['GET'])
def get_all_students():
    """Get all active students"""
    try:
        query = "SELECT * FROM students WHERE is_active = TRUE"
        students = db.execute_query(query)
        return jsonify({'success': True, 'students': students}), 200
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
        return jsonify({'success': True, 'student': student}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@students_bp.route('/', methods=['POST'])
def create_student():
    """
    Create new student with face encoding and 3 enrollment photos.
    
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
        "face_image": "base64_encoded_image",   // optional, for face recognition
        "photos": ["base64_1", "base64_2", "base64_3"]   // required, 3 enrollment photos
    }
    """
    try:
        data = request.get_json()
        
        # ---------- Validate required fields ----------
        required_fields = ['student_id', 'first_name', 'last_name', 'block', 'year_level', 'photos']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Check that photos array has exactly 3 items
        if not isinstance(data['photos'], list) or len(data['photos']) != 3:
            return jsonify({
                'success': False,
                'error': 'Photos must be an array of exactly 3 base64 images'
            }), 400
        
        # ---------- Check if student already exists ----------
        check_query = "SELECT student_id FROM students WHERE student_id = %s"
        existing = db.execute_one(check_query, (data['student_id'],))
        if existing:
            return jsonify({'success': False, 'error': 'Student ID already exists'}), 400
        
        # ---------- Process face encoding image (if provided) ----------
        face_encoding_path = None
        if 'face_image' in data and data['face_image']:
            try:
                # Decode base64 image
                image_data = base64.b64decode(data['face_image'].split(',')[1])
                nparr = np.frombuffer(image_data, np.uint8)
                image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                
                # Save face encoding
                result = face_service.save_face_encoding(data['student_id'], image_rgb)
                if not result['success']:
                    return jsonify({'success': False, 'error': result['message']}), 400
                face_encoding_path = result['encoding_path']
            except Exception as e:
                return jsonify({'success': False, 'error': f'Face encoding failed: {str(e)}'}), 400
        
        # ---------- Process three enrollment photos ----------
        try:
            photo_folder = save_student_photos(data['student_id'], data['photos'])
        except Exception as e:
            return jsonify({'success': False, 'error': f'Failed to save photos: {str(e)}'}), 500
        
        # ---------- Insert student record ----------
        insert_query = """
            INSERT INTO students 
            (student_id, first_name, last_name, middle_name, email, block, 
             year_level, college_code, face_encoding_path, photo_folder)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
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
            face_encoding_path,
            photo_folder
        ))
        
        # ---------- Return created student ----------
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

@students_bp.route('/<student_id>/photos/<int:photo_num>', methods=['GET'])
def get_student_photo(student_id, photo_num):
    """
    Serve one of the three enrollment photos.
    photo_num should be 1, 2, or 3.
    """
    try:
        if photo_num not in [1, 2, 3]:
            return jsonify({'success': False, 'error': 'Photo number must be 1, 2, or 3'}), 400
        
        # Get student record
        student = db.execute_one(
            "SELECT photo_folder FROM students WHERE student_id = %s AND is_active = TRUE",
            (student_id,)
        )
        if not student or not student['photo_folder']:
            return jsonify({'success': False, 'error': 'Student or photos not found'}), 404
        
        # Build full path to the photo
        folder_name = os.path.basename(student['photo_folder'])  # extract student_id from folder path
        full_folder = os.path.join(Config.STUDENT_PHOTO_FOLDER, folder_name)
        photo_path = os.path.join(full_folder, f"{photo_num}.jpg")
        
        if not os.path.exists(photo_path):
            return jsonify({'success': False, 'error': 'Photo file not found'}), 404
        
        return send_file(photo_path, mimetype='image/jpeg')
    
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
        if 'college_code' in data:
            update_fields.append("college_code = %s")
            values.append(data['college_code'])
        
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
        
        # Delete face encoding (if any)
        face_service.delete_face_encoding(student_id)
        
        # Note: We do NOT delete the photo folder – keep for record keeping.
        
        return jsonify({
            'success': True,
            'message': 'Student deleted successfully'
        }), 200
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500