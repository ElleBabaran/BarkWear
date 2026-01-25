from flask import Blueprint, request, jsonify
from barkwear2.utils.db import db
from datetime import datetime, date

schedules_bp = Blueprint('schedules', __name__)

# ============= SCHEDULES ROUTES =============

@schedules_bp.route('/', methods=['GET'])
def get_schedules():
    """Get all schedules with optional filters"""
    try:
        query = "SELECT * FROM schedules WHERE is_active = TRUE"
        params = []
        
        # Add filters if provided
        block = request.args.get('block')
        year_level = request.args.get('year_level')
        day = request.args.get('day')
        
        if block:
            query += " AND block = %s"
            params.append(block)
        if year_level:
            query += " AND year_level = %s"
            params.append(int(year_level))
        if day:
            query += " AND day_of_week = %s"
            params.append(day)
        
        schedules = db.execute_query(query, tuple(params) if params else None)
        
        return jsonify({
            'success': True,
            'schedules': schedules
        }), 200
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@schedules_bp.route('/<int:schedule_id>', methods=['GET'])
def get_schedule(schedule_id):
    """Get single schedule"""
    try:
        query = "SELECT * FROM schedules WHERE schedule_id = %s"
        schedule = db.execute_one(query, (schedule_id,))
        
        if not schedule:
            return jsonify({'success': False, 'error': 'Schedule not found'}), 404
        
        return jsonify({
            'success': True,
            'schedule': schedule
        }), 200
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@schedules_bp.route('/', methods=['POST'])
def create_schedule():
    """Create new schedule"""
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
        
        insert_query = """
            INSERT INTO schedules 
            (subject_code, subject_name, block, year_level, day_of_week, 
             start_time, end_time, room_code, instructor_name)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        schedule_id = db.execute_insert(insert_query, (
            data['subject_code'],
            data['subject_name'],
            data['block'],
            data['year_level'],
            data['day_of_week'],
            data['start_time'],
            data['end_time'],
            data.get('room_code'),
            data.get('instructor_name')
        ))
        
        # Get created schedule
        schedule = db.execute_one(
            "SELECT * FROM schedules WHERE schedule_id = %s",
            (schedule_id,)
        )
        
        return jsonify({
            'success': True,
            'message': 'Schedule created successfully',
            'schedule': schedule
        }), 201
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@schedules_bp.route('/<int:schedule_id>', methods=['DELETE'])
def delete_schedule(schedule_id):
    """Soft delete schedule"""
    try:
        check_query = "SELECT * FROM schedules WHERE schedule_id = %s"
        schedule = db.execute_one(check_query, (schedule_id,))
        
        if not schedule:
            return jsonify({'success': False, 'error': 'Schedule not found'}), 404
        
        update_query = "UPDATE schedules SET is_active = FALSE WHERE schedule_id = %s"
        db.execute_update(update_query, (schedule_id,))
        
        return jsonify({
            'success': True,
            'message': 'Schedule deleted successfully'
        }), 200
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
