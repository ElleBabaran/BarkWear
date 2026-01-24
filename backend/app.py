"""
BarkWear Attendance System - Main Flask Application
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
from config import Config
from utils.db import init_db, get_db
import os

# Import routes
from routes.students import students_bp
from routes.schedules import schedules_bp
from routes.attendance import attendance_bp
from routes.detection import detection_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Enable CORS for React frontend
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Initialize database
    init_db(app)
    
    # Register blueprints
    app.register_blueprint(students_bp, url_prefix='/api/students')
    app.register_blueprint(schedules_bp, url_prefix='/api/schedules')
    app.register_blueprint(attendance_bp, url_prefix='/api/attendance')
    app.register_blueprint(detection_bp, url_prefix='/api/detection')
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'message': 'BarkWear API is running'
        }), 200
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Route not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error'}), 500
    
    return app

if __name__ == '__main__':
    app = create_app()
    print("🚀 BarkWear API Server Starting...")
    print("📍 Running on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)