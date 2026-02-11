from flask import Blueprint, request, jsonify
from barkwear2.utils.db import db
from datetime import datetime

schedule_bp = Blueprint('schedule', __name__, url_prefix='/schedules')

def time_str_to_db(time_str):
    """Convert '9:00 - 10:30' to ('09:00:00', '10:30:00')"""
    parts = time_str.split('-')
    start = parts[0].strip()
    end = parts[1].strip() if len(parts) > 1 else start
    # Pad with seconds
    if len(start.split(':')) == 2:
        start += ':00'
    if len(end.split(':')) == 2:
        end += ':00'
    return start, end

@schedule_bp.route('/', methods=['GET'])
def get_schedules():
    """Return all active schedules"""
    try:
        query = """
            SELECT schedule_id, subject_code, subject_name, block, year_level,
                   day_of_week, start_time, end_time, room_code, instructor_name,
                   is_active, created_at
            FROM schedules
            WHERE is_active = TRUE
            ORDER BY 
                FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'),
                start_time
        """
        schedules = db.execute_query(query)
        # Convert time objects to strings for JSON
        for s in schedules:
            if s.get('start_time'):
                s['start_time'] = str(s['start_time'])
            if s.get('end_time'):
                s['end_time'] = str(s['end_time'])
        return jsonify({'success': True, 'schedules': schedules}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@schedule_bp.route('/', methods=['POST'])
def create_schedule():
    """Create a new schedule"""
    try:
        data = request.get_json()
        required = ['subject_name', 'block', 'time', 'room_code', 'instructor_name']
        if not all(k in data for k in required):
            return jsonify({'success': False, 'error': f'Missing fields. Required: {required}'}), 400

        # Convert time range
        start_time, end_time = time_str_to_db(data['time'])

        # Default values for fields not in the form
        subject_code = data.get('subject_code', data['subject_name'][:10].upper())
        year_level = data.get('year_level', 1)
        day_of_week = data.get('day_of_week', 'Monday')   # Default to Monday
        is_active = data.get('is_active', True)

        query = """
            INSERT INTO schedules
            (subject_code, subject_name, block, year_level, day_of_week,
             start_time, end_time, room_code, instructor_name, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        schedule_id = db.execute_insert(query, (
            subject_code, data['subject_name'], data['block'], year_level, day_of_week,
            start_time, end_time, data['room_code'], data['instructor_name'], is_active
        ))
        return jsonify({'success': True, 'schedule_id': schedule_id}), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@schedule_bp.route('/<int:schedule_id>', methods=['PUT'])
def update_schedule(schedule_id):
    """Update an existing schedule"""
    try:
        data = request.get_json()
        start_time, end_time = time_str_to_db(data['time'])

        query = """
            UPDATE schedules
            SET subject_name = %s, block = %s, start_time = %s, end_time = %s,
                room_code = %s, instructor_name = %s
            WHERE schedule_id = %s
        """
        affected = db.execute_update(query, (
            data['subject_name'], data['block'], start_time, end_time,
            data['room_code'], data['instructor_name'], schedule_id
        ))
        return jsonify({'success': True, 'affected': affected}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@schedule_bp.route('/<int:schedule_id>', methods=['DELETE'])
def delete_schedule(schedule_id):
    """Soft‑delete a schedule (set is_active = FALSE)"""
    try:
        query = "UPDATE schedules SET is_active = FALSE WHERE schedule_id = %s"
        affected = db.execute_update(query, (schedule_id,))
        return jsonify({'success': True, 'affected': affected}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500