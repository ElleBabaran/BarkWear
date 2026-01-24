"""
Schedules and Attendance API Routes
"""
from flask import Blueprint, request, jsonify
from backend.models.student import Student
from backend.models.schedule import Schedule
from backend.models.schedule import Attendance
from utils.db import db
from datetime import datetime, date

schedules_bp = Blueprint('schedules', __name__)
attendance_bp = Blueprint('attendance', __name__)

# ============= SCHEDULES ROUTES =============

@schedules_bp.route('/', methods=['GET'])
def get_schedules():
    """Get all schedules with optional filters"""
    try:
        block = request.args.get('block')
        year_level = request.args.get('year_level')
        day = request.args.get('day')
        
        query = Schedule.query.filter_by(is_active=True)
        
        if block:
            query = query.filter_by(block=block)
        if year_level:
            query = query.filter_by(year_level=int(year_level))
        if day:
            query = query.filter_by(day_of_week=day)
        
        schedules = query.all()
        
        return jsonify({
            'success': True,
            'schedules': [s.to_dict() for s in schedules]
        }), 200
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@schedules_bp.route('/<int:schedule_id>', methods=['GET'])
def get_schedule(schedule_id):
    """Get single schedule"""
    try:
        schedule = Schedule.query.get(schedule_id)
        if not schedule:
            return jsonify({'success': False, 'error': 'Schedule not found'}), 404
        
        return jsonify({
            'success': True,
            'schedule': schedule.to_dict()
        }), 200
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@schedules_bp.route('/', methods=['POST'])
def create_schedule():
    """
    Create new schedule
    Expected JSON:
    {
        "subject_code": "CS101",
        "subject_name": "Intro to Programming",
        "block": "A",
        "year_level": 1,
        "day_of_week": "Monday",
        "start_time": "08:00:00",
        "end_time": "10:00:00",
        "room_code": "CL301",
        "instructor_name": "Prof. Smith"
    }
    """
    try:
        data = request.get_json()
        
        required = ['subject_code', 'subject_name', 'block', 'year_level', 
                   'day_of_week', 'start_time', 'end_time']
        
        for field in required:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Parse time strings
        start_time = datetime.strptime(data['start_time'], '%H:%M:%S').time()
        end_time = datetime.strptime(data['end_time'], '%H:%M:%S').time()
        
        schedule = Schedule(
            subject_code=data['subject_code'],
            subject_name=data['subject_name'],
            block=data['block'],
            year_level=data['year_level'],
            day_of_week=data['day_of_week'],
            start_time=start_time,
            end_time=end_time,
            room_code=data.get('room_code'),
            instructor_name=data.get('instructor_name')
        )
        
        db.session.add(schedule)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Schedule created successfully',
            'schedule': schedule.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@schedules_bp.route('/<int:schedule_id>', methods=['DELETE'])
def delete_schedule(schedule_id):
    """Soft delete schedule"""
    try:
        schedule = Schedule.query.get(schedule_id)
        if not schedule:
            return jsonify({'success': False, 'error': 'Schedule not found'}), 404
        
        schedule.is_active = False
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Schedule deleted successfully'
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

# ============= ATTENDANCE ROUTES =============

@attendance_bp.route('/', methods=['GET'])
def get_attendance():
    """Get attendance records with filters"""
    try:
        schedule_id = request.args.get('schedule_id')
        student_id = request.args.get('student_id')
        date_str = request.args.get('date')
        status = request.args.get('status')
        
        query = Attendance.query
        
        if schedule_id:
            query = query.filter_by(schedule_id=int(schedule_id))
        if student_id:
            query = query.filter_by(student_id=student_id)
        if date_str:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            query = query.filter_by(date=target_date)
        if status:
            query = query.filter_by(status=status)
        
        records = query.all()
        
        return jsonify({
            'success': True,
            'attendance': [r.to_dict() for r in records]
        }), 200
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@attendance_bp.route('/violations', methods=['GET'])
def get_violations():
    """Get violation records"""
    try:
        student_id = request.args.get('student_id')
        date_str = request.args.get('date')
        
        query = Violation.query
        
        if student_id:
            query = query.filter_by(student_id=student_id)
        
        violations = query.all()
        
        # Join with attendance for date filtering
        if date_str:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            violations = [v for v in violations 
                         if v.attendance and v.attendance.date == target_date]
        
        return jsonify({
            'success': True,
            'violations': [v.to_dict() for v in violations]
        }), 200
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@attendance_bp.route('/summary', methods=['GET'])
def get_attendance_summary():
    """Get attendance summary for a schedule/date"""
    try:
        schedule_id = request.args.get('schedule_id')
        date_str = request.args.get('date', date.today().isoformat())
        
        if not schedule_id:
            return jsonify({
                'success': False,
                'error': 'schedule_id is required'
            }), 400
        
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        
        records = Attendance.query.filter_by(
            schedule_id=int(schedule_id),
            date=target_date
        ).all()
        
        summary = {
            'total': len(records),
            'present': len([r for r in records if r.status == 'present']),
            'late': len([r for r in records if r.status == 'late']),
            'absent': 0,  # Would need enrolled students count
            'with_violations': len([r for r in records if r.has_violation])
        }
        
        return jsonify({
            'success': True,
            'summary': summary,
            'records': [r.to_dict() for r in records]
        }), 200
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500