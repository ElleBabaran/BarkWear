
from flask import Blueprint, request, jsonify
from barkwear2.utils.db import db
from datetime import datetime, date

attendance_bp = Blueprint('attendance', __name__)

@attendance_bp.route('/', methods=['GET'])
def get_attendance():
    """Get attendance records with filters"""
    try:
        query = "SELECT * FROM attendance WHERE 1=1"
        params = []
        
        schedule_id = request.args.get('schedule_id')
        student_id = request.args.get('student_id')
        date_str = request.args.get('date')
        status = request.args.get('status')
        
        if schedule_id:
            query += " AND schedule_id = %s"
            params.append(int(schedule_id))
        if student_id:
            query += " AND student_id = %s"
            params.append(student_id)
        if date_str:
            query += " AND date = %s"
            params.append(date_str)
        if status:
            query += " AND status = %s"
            params.append(status)
        
        records = db.execute_query(query, tuple(params) if params else None)
        
        return jsonify({
            'success': True,
            'attendance': records
        }), 200
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@attendance_bp.route('/violations', methods=['GET'])
def get_violations():
    """Get violation records"""
    try:
        query = "SELECT * FROM violations WHERE 1=1"
        params = []
        
        student_id = request.args.get('student_id')
        
        if student_id:
            query += " AND student_id = %s"
            params.append(student_id)
        
        violations = db.execute_query(query, tuple(params) if params else None)
        
        return jsonify({
            'success': True,
            'violations': violations
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
        
        query = """
            SELECT * FROM attendance 
            WHERE schedule_id = %s AND date = %s
        """
        records = db.execute_query(query, (int(schedule_id), date_str))
        
        summary = {
            'total': len(records),
            'present': len([r for r in records if r['status'] == 'present']),
            'late': len([r for r in records if r['status'] == 'late']),
            'absent': 0,
            'with_violations': len([r for r in records if r['has_violation']])
        }
        
        return jsonify({
            'success': True,
            'summary': summary,
            'records': records
        }), 200
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500