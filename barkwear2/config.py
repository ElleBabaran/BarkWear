import os
from datetime import timedelta

class Config:
    # Flask Config
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'barkwear-secret-key-2024'
    
    # MySQL Database Config - EDIT THIS SECTION ONLY!
    MYSQL_HOST = 'localhost'              # ← Usually OK
    MYSQL_USER = 'root'                   # ← Usually OK
    MYSQL_PASSWORD = 'Admin#Pass123'    # ← CHANGE THIS!!!
    MYSQL_DB = 'BarkWeb'             # ← Usually OK
    MYSQL_PORT = 3306                     # ← Usually OK
    
    
    # File Upload Config
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), '..', 'uploads')
    FACE_ENCODINGS_FOLDER = os.path.join(os.path.dirname(__file__), '..', 'ml-models', 'face_encodings')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024
    
    # ML Models Config
    YOLO_MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'ml-models', 'uniform_detector.pt')
    FACE_RECOGNITION_TOLERANCE = 0.6
    
    # Attendance Config
    LATE_THRESHOLD_MINUTES = 15
    
    # Camera Config
    CAMERA_INDEX = 0
    FRAME_WIDTH = 640
    FRAME_HEIGHT = 480
    
    @staticmethod
    def init_folders():
        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
        os.makedirs(Config.FACE_ENCODINGS_FOLDER, exist_ok=True)