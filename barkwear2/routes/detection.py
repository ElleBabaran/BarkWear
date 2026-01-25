from flask import Blueprint, request, jsonify
from barkwear2.services.face_service import FaceRecognitionService
from barkwear2.services.uniform_service import UniformDetectionService
from barkwear2.utils.db import db   # <-- fixed

import cv2
import numpy as np
import base64
from datetime import datetime, date, timedelta


detection_bp = Blueprint('detection', __name__)
face_service = FaceRecognitionService()
uniform_service = UniformDetectionService()

@detection_bp.route('/process', methods=['POST'])
def process_detection():
    """
    Process real-time detection (face + uniform + attendance)
    
    Expected JSON:
    {
        "image": "base64_encoded_image",
        "schedule_id": 123
    }
    """
    try:
        data = request.get_json()
        
        if 'image' not in data or 'schedule_id' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing image or schedule_id'
            }), 400
        
        # Decode image
        image_data = base64.b64decode(data['image'].split(',')[1])
        nparr = np.frombuffer(image_data, np.uint8)
        image_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        
        # Get schedule
        schedule_query = "SELECT * FROM schedules WHERE schedule_id = %s"
        schedule = db.execute_one(schedule_query, (data['schedule_id'],))
        
        if not schedule:
            return jsonify({
                'success': False,
                'error': 'Schedule not found'
            }), 404
        
        # Step 1: Face Recognition
        face_result = face_service.recognize_face(image_rgb)
        
        if not face_result['success']:
            return jsonify({
                'success': False,
                'step': 'face_recognition',
                'error': face_result['message']
            }), 400
        
        student_id = face_result['student_id']
        
        # Get student details
        student_query = "SELECT * FROM students WHERE student_id = %s"
        student = db.execute_one(student_query, (student_id,))
        
        if not student:
            return jsonify({
                'success': False,
                'error': 'Student not found in database'
            }), 404
        
        # Step 2: Uniform Detection
        uniform_result = uniform_service.detect_uniform(image_bgr)
        
        # Step 3: Determine attendance status
        current_time = datetime.now().time()
        schedule_start = schedule['start_time']
        
        # Convert time to datetime for calculation
        if isinstance(schedule_start, str):
            schedule_start = datetime.strptime(schedule_start, '%H:%M:%S').time()
        
        # Calculate if late (15 minutes threshold)
        start_datetime = datetime.combine(date.today(), schedule_start)
        late_threshold = (start_datetime + timedelta(minutes=15)).time()
        
        if current_time <= schedule_start:
            status = 'present'
        elif current_time <= late_threshold:
            status = 'late'
        else:
            status = 'late'
        
        # Step 4: Check for existing attendance today
        today = date.today()
        check_query = """
            SELECT * FROM attendance 
            WHERE student_id = %s AND schedule_id = %s AND date = %s
        """
        existing = db.execute_one(check_query, (student_id, schedule['schedule_id'], today))
        
        if existing:
            return jsonify({
                'success': False,
                'error': 'Attendance already recorded for this student today',
                'existing_record': existing
            }), 400
        
        # Step 5: Create attendance record
        attendance_query = """
            INSERT INTO attendance 
            (student_id, schedule_id, date, time_in, status, has_violation)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        
        attendance_id = db.execute_insert(
            attendance_query,
            (
                student_id,
                schedule['schedule_id'],
                today,
                current_time,
                status,
                not uniform_result['is_complete']
            )
        )
        
        # Step 6: Create violation records if uniform incomplete
        violation_records = []
        if not uniform_result['is_complete']:
            violation_query = """
                INSERT INTO violations 
                (attendance_id, student_id, violation_type, description, severity)
                VALUES (%s, %s, %s, %s, %s)
            """
            
            for violation_text in uniform_result['violations']:
                violation_type = violation_text.lower().replace('missing ', '').replace(' ', '_')
                
                violation_id = db.execute_insert(
                    violation_query,
                    (attendance_id, student_id, violation_type, violation_text, 'minor')
                )
                
                violation_records.append({
                    'violation_id': violation_id,
                    'violation_type': violation_type,
                    'description': violation_text,
                    'severity': 'minor'
                })
        
        # Step 7: Build student name
        middle_initial = f" {student['middle_name'][0]}." if student.get('middle_name') else ""
        full_name = f"{student['first_name']}{middle_initial} {student['last_name']}"
        
        # Step 8: Return complete result
        return jsonify({
            'success': True,
            'message': 'Detection and attendance recorded successfully',
            'student': {
                'student_id': student['student_id'],
                'name': full_name,
                'block': student['block'],
                'year_level': student['year_level']
            },
            'face_recognition': {
                'recognized': True,
                'confidence': face_result.get('confidence', 0)
            },
            'uniform_check': {
                'is_complete': uniform_result['is_complete'],
                'has_blue_polo': uniform_result['has_blue_polo'],
                'has_black_pants': uniform_result['has_black_pants'],
                'has_id_card': uniform_result['has_id_card'],
                'violations': uniform_result['violations']
            },
            'attendance': {
                'attendance_id': attendance_id,
                'status': status,
                'time_in': current_time.strftime('%H:%M:%S'),
                'has_violation': not uniform_result['is_complete']
            },
            'violations': violation_records
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500

@detection_bp.route('/test-face', methods=['POST'])
def test_face_recognition():
    """Test face recognition only (without recording attendance)"""
    try:
        data = request.get_json()
        
        if 'image' not in data:
            return jsonify({'success': False, 'error': 'Missing image'}), 400
        
        # Decode image
        image_data = base64.b64decode(data['image'].split(',')[1])
        nparr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Recognize face
        result = face_service.recognize_face(image_rgb)
        
        if result['success']:
            student_query = "SELECT * FROM students WHERE student_id = %s"
            student = db.execute_one(student_query, (result['student_id'],))
            result['student'] = student
        
        return jsonify(result), 200
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@detection_bp.route('/test-uniform', methods=['POST'])
def test_uniform_detection():
    """Test uniform detection only"""
    try:
        data = request.get_json()
        
        if 'image' not in data:
            return jsonify({'success': False, 'error': 'Missing image'}), 400
        
        # Decode image
        image_data = base64.b64decode(data['image'].split(',')[1])
        nparr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Detect uniform
        result = uniform_service.detect_uniform(image)
        
        return jsonify(result), 200
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500