"""
BarkWear Configuration File
"""
import os
from datetime import timedelta

class Config:
    # Flask Config
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'barkwear-secret-key-2024'
    
    # MySQL Database Config
    MYSQL_HOST = os.environ.get('MYSQL_HOST') or 'localhost'
    MYSQL_USER = os.environ.get('MYSQL_USER') or 'root'
    MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD') or 'your_password'
    MYSQL_DB = os.environ.get('MYSQL_DB') or 'barkwear_db'
    MYSQL_PORT = int(os.environ.get('MYSQL_PORT') or 3306)
    
    # SQLAlchemy Config
    SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False  # Set to True for SQL debugging
    
    # File Upload Config
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
    FACE_ENCODINGS_FOLDER = os.path.join(os.path.dirname(__file__), 'ml-models', 'face_encodings')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    
    # ML Models Config
    YOLO_MODEL_PATH = os.path.join(os.path.dirname(__file__), 'ml-models', 'uniform_detector.pt')
    FACE_RECOGNITION_TOLERANCE = 0.6  # Lower is more strict
    
    # Attendance Config
    LATE_THRESHOLD_MINUTES = 15  # Minutes after schedule start to mark as late
    
    # Camera Config
    CAMERA_INDEX = 0  # Default camera (0 for laptop webcam)
    FRAME_WIDTH = 640
    FRAME_HEIGHT = 480
    
    # Create necessary directories
    @staticmethod
    def init_folders():
        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
        os.makedirs(Config.FACE_ENCODINGS_FOLDER, exist_ok=True)