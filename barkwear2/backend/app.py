"""
BarkWear Attendance System - Main Flask Application (Pure MySQL)
"""
from flask import Flask, jsonify
from flask_cors import CORS
from barkwear2.config import Config
import os
from barkwear2.utils.db import init_db
from barkwear2.routes.students import students_bp
from barkwear2.routes.schedules import schedules_bp
from barkwear2.routes.attendance import attendance_bp
from barkwear2.routes.detection import detection_bp
from barkwear2.routes.admin import admin_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Enable CORS for React frontend
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Initialize database
    with app.app_context():
        init_db()
    
    # Create necessary folders
    Config.init_folders()
    
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

    app.register_blueprint(admin_bp)

if __name__ == '__main__':
    app = create_app()
    print("🚀 BarkWear API Server Starting...")
    print("📍 Running on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)