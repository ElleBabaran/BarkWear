"""
Detection API Routes - Real-time face + uniform detection
"""
from flask import Blueprint, request, jsonify
from services.face_service import FaceRecognitionService
from services.uniform_service import UniformDetectionService
from backend.models.student import Student
from backend.models.schedule import Schedule
from backend.models.attendance import Attendance

from utils.db import db
import cv2
import numpy as np
import base64
from datetime import datetime, date, time, timedelta

detection_bp = Blueprint('detection', __name__)
face_service = FaceRecognitionService()
uniform_service = UniformDetectionService()

@detection_bp.route('/process', methods=['POST'])
def process_detection():
    """
    Process real-time detection (face + uniform)
    
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
        schedule = Schedule.query.get(data['schedule_id'])
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
        student = Student.query.get(student_id)
        if not student:
            return jsonify({
                'success': False,
                'error': 'Student not found in database'
            }), 404
        
        # Step 2: Uniform Detection
        uniform_result = uniform_service.detect_uniform(image_bgr)
        
        # Step 3: Determine attendance status
        current_time = datetime.now().time()
        schedule_start = schedule.start_time
        
        # Calculate if late (15 minutes threshold)
        late_threshold = (datetime.combine(date.today(), schedule_start) + 
                         timedelta(minutes=15)).time()
        
        if current_time <= schedule_start:
            status = 'present'
        elif current_time <= late_threshold:
            status = 'late'
        else:
            status = 'late'  # Still mark as late even if very late
        
        # Step 4: Check for existing attendance today
        today = date.today()
        existing_attendance = Attendance.query.filter_by(
            student_id=student_id,
            schedule_id=schedule.schedule_id,
            date=today
        ).first()
        
        if existing_attendance:
            return jsonify({
                'success': False,
                'error': 'Attendance already recorded for this student today',
                'existing_record': existing_attendance.to_dict()
            }), 400
        
        # Step 5: Create attendance record
        attendance = Attendance(
            student_id=student_id,
            schedule_id=schedule.schedule_id,
            date=today,
            time_in=current_time,
            status=status,
            has_violation=not uniform_result['is_complete']
        )
        
        db.session.add(attendance)
        db.session.flush()  # Get attendance_id
        
        # Step 6: Create violation records if uniform incomplete
        violation_records = []
        if not uniform_result['is_complete']:
            for violation_text in uniform_result['violations']:
                violation_type = violation_text.lower().replace('missing ', '').replace(' ', '_')
                
                violation = Violation(
                    attendance_id=attendance.attendance_id,
                    student_id=student_id,
                    violation_type=violation_type,
                    description=violation_text,
                    severity='minor'
                )
                db.session.add(violation)
                violation_records.append(violation.to_dict())
        
        db.session.commit()
        
        # Step 7: Return complete result
        return jsonify({
            'success': True,
            'message': 'Detection and attendance recorded successfully',
            'student': {
                'student_id': student.student_id,
                'name': student.full_name,
                'block': student.block,
                'year_level': student.year_level
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
                'attendance_id': attendance.attendance_id,
                'status': status,
                'time_in': current_time.strftime('%H:%M:%S'),
                'has_violation': attendance.has_violation
            },
            'violations': violation_records
        }), 200
    
    except Exception as e:
        db.session.rollback()
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
            student = Student.query.get(result['student_id'])
            result['student'] = student.to_dict() if student else None
        
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