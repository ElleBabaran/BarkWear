from flask import Blueprint, request, jsonify
from barkwear2.utils.db import db

schedule_bp = Blueprint('schedule', __name__, url_prefix='/schedules')


def parse_times(data):
    """Accept either start_time/end_time directly, or legacy 'time' string like '9:00 - 10:30'"""
    if 'start_time' in data and 'end_time' in data:
        start = data['start_time']
        end = data['end_time']
        # Ensure HH:MM:SS format
        if len(start.split(':')) == 2:
            start += ':00'
        if len(end.split(':')) == 2:
            end += ':00'
        return start, end
    elif 'time' in data:
        parts = data['time'].split('-')
        start = parts[0].strip()
        end = parts[1].strip() if len(parts) > 1 else start
        if len(start.split(':')) == 2:
            start += ':00'
        if len(end.split(':')) == 2:
            end += ':00'
        return start, end
    else:
        raise ValueError("Missing time fields. Provide 'start_time' and 'end_time'.")


@schedule_bp.route('/', methods=['GET'])
def get_schedules():
    try:
        query = """
            SELECT schedule_id, subject_code, subject_name, block, year_level,
                   day_of_week, start_time, end_time, room_code, instructor_name,
                   is_active, created_at
            FROM schedules
            WHERE is_active = TRUE
            ORDER BY
                FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
                start_time
        """
        schedules = db.execute_query(query)
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
    try:
        data = request.get_json()
        start_time, end_time = parse_times(data)

        subject_code = data.get('subject_code', data.get('subject_name', '')[:10].upper())
        subject_name = data.get('subject_name', '')
        block = data.get('block', '')
        year_level = data.get('year_level', 1)
        day_of_week = data.get('day_of_week', 'Monday')
        room_code = data.get('room_code', '')
        instructor_name = data.get('instructor_name', '')
        is_active = data.get('is_active', True)

        query = """
            INSERT INTO schedules
            (subject_code, subject_name, block, year_level, day_of_week,
             start_time, end_time, room_code, instructor_name, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        schedule_id = db.execute_insert(query, (
            subject_code, subject_name, block, year_level, day_of_week,
            start_time, end_time, room_code, instructor_name, is_active
        ))
        return jsonify({'success': True, 'schedule_id': schedule_id}), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@schedule_bp.route('/<int:schedule_id>', methods=['PUT'])
def update_schedule(schedule_id):
    try:
        data = request.get_json()
        start_time, end_time = parse_times(data)

        subject_code = data.get('subject_code', data.get('subject_name', '')[:10].upper())
        subject_name = data.get('subject_name', '')
        block = data.get('block', '')
        year_level = data.get('year_level', 1)
        day_of_week = data.get('day_of_week', 'Monday')
        room_code = data.get('room_code', '')
        instructor_name = data.get('instructor_name', '')

        query = """
            UPDATE schedules
            SET subject_code = %s, subject_name = %s, block = %s, year_level = %s,
                day_of_week = %s, start_time = %s, end_time = %s,
                room_code = %s, instructor_name = %s
            WHERE schedule_id = %s
        """
        affected = db.execute_update(query, (
            subject_code, subject_name, block, year_level, day_of_week,
            start_time, end_time, room_code, instructor_name, schedule_id
        ))
        return jsonify({'success': True, 'affected': affected}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@schedule_bp.route('/<int:schedule_id>', methods=['DELETE'])
def delete_schedule(schedule_id):
    try:
        query = "UPDATE schedules SET is_active = FALSE WHERE schedule_id = %s"
        affected = db.execute_update(query, (schedule_id,))
        return jsonify({'success': True, 'affected': affected}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500