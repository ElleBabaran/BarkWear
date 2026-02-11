import pymysql
from contextlib import contextmanager
from barkwear2.config import Config

class Database:
    def __init__(self):
        self.config = {
            'host': Config.MYSQL_HOST,
            'user': Config.MYSQL_USER,
            'password': Config.MYSQL_PASSWORD,
            'database': Config.MYSQL_DB,
            'port': Config.MYSQL_PORT,
            'cursorclass': pymysql.cursors.DictCursor
        }
    
    @contextmanager
    def get_connection(self):
        """Get database connection context manager"""
        connection = pymysql.connect(**self.config)
        try:
            yield connection
            connection.commit()
        except Exception as e:
            connection.rollback()
            raise e
        finally:
            connection.close()
    
    def execute_query(self, query, params=None):
        """Execute a query and return results (list of dicts)"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, params or ())
                return cursor.fetchall()
    
    def execute_one(self, query, params=None):
        """Execute a query and return single row"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, params or ())
                return cursor.fetchone()
    
    def execute_insert(self, query, params=None):
        """Execute INSERT and return last inserted ID"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, params or ())
                return cursor.lastrowid
    
    def execute_update(self, query, params=None):
        """Execute UPDATE/DELETE and return affected row count"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, params or ())
                return cursor.rowcount

# Global database instance
db = Database()

def init_db():
    """Initialize database tables - DROPS EXISTING TABLES FIRST (dev only)"""
    
    # ----- DROP OLD/NORMALIZED TABLES -----
    with db.get_connection() as conn:
        with conn.cursor() as cursor:
            # Drop in correct order (respect foreign keys)
            cursor.execute("DROP TABLE IF EXISTS violations")
            cursor.execute("DROP TABLE IF EXISTS attendance")
            cursor.execute("DROP TABLE IF EXISTS enrollments")
            cursor.execute("DROP TABLE IF EXISTS schedules")
            cursor.execute("DROP TABLE IF EXISTS students")
            cursor.execute("DROP TABLE IF EXISTS subjects")
            cursor.execute("DROP TABLE IF EXISTS room")
            cursor.execute("DROP TABLE IF EXISTS colleges")
            
            # ⚠️ Also drop the old 'student' table (singular, from normalized schema)
            cursor.execute("DROP TABLE IF EXISTS student")
            
            print("🗑️ Dropped all existing tables")
    
    # ----- CREATE FRESH TABLES -----
    tables = [
        """
        CREATE TABLE IF NOT EXISTS students (
            student_id VARCHAR(20) PRIMARY KEY,
            first_name VARCHAR(50) NOT NULL,
            last_name VARCHAR(50) NOT NULL,
            middle_name VARCHAR(50),
            email VARCHAR(100) UNIQUE,
            block VARCHAR(10) NOT NULL,
            year_level INT NOT NULL,
            college_code VARCHAR(10),
            face_encoding_path VARCHAR(255),
            photo_path VARCHAR(255),
            photo_folder VARCHAR(255),      -- 📸 NEW: folder for the 3 enrollment photos
            is_active BOOLEAN DEFAULT TRUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS schedules (
            schedule_id INT PRIMARY KEY AUTO_INCREMENT,
            subject_code VARCHAR(20) NOT NULL,
            subject_name VARCHAR(100) NOT NULL,
            block VARCHAR(10) NOT NULL,
            year_level INT NOT NULL,
            day_of_week VARCHAR(10) NOT NULL,
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            room_code VARCHAR(20),
            instructor_name VARCHAR(100),
            is_active BOOLEAN DEFAULT TRUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS attendance (
            attendance_id INT PRIMARY KEY AUTO_INCREMENT,
            student_id VARCHAR(20) NOT NULL,
            schedule_id INT NOT NULL,
            date DATE NOT NULL,
            time_in TIME,
            status VARCHAR(10) NOT NULL,
            has_violation BOOLEAN DEFAULT FALSE,
            remarks TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES students(student_id),
            FOREIGN KEY (schedule_id) REFERENCES schedules(schedule_id)
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS violations (
            violation_id INT PRIMARY KEY AUTO_INCREMENT,
            attendance_id INT NOT NULL,
            student_id VARCHAR(20) NOT NULL,
            violation_type VARCHAR(50) NOT NULL,
            description TEXT,
            severity VARCHAR(20) DEFAULT 'minor',
            image_path VARCHAR(255),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (attendance_id) REFERENCES attendance(attendance_id),
            FOREIGN KEY (student_id) REFERENCES students(student_id)
        )
        """
    ]
    
    with db.get_connection() as conn:
        with conn.cursor() as cursor:
            for table_sql in tables:
                cursor.execute(table_sql)
    
    print("✅ Database tables initialized (fresh)")