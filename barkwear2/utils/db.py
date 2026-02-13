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
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, params or ())
                return cursor.fetchall()

    def execute_one(self, query, params=None):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, params or ())
                return cursor.fetchone()

    def execute_insert(self, query, params=None):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, params or ())
                return cursor.lastrowid

    def execute_update(self, query, params=None):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, params or ())
                return cursor.rowcount

db = Database()

def init_db():
    conn = pymysql.connect(
        host=db.config['host'],
        user=db.config['user'],
        password=db.config['password'],
        database=db.config['database'],
        port=db.config['port'],
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True
    )

    try:
        with conn.cursor() as cursor:
            cursor.execute("SET FOREIGN_KEY_CHECKS = 0")

            # Drop ALL tables that reference schedules (including enrollments)
            cursor.execute("DROP TABLE IF EXISTS enrollments")
            cursor.execute("DROP TABLE IF EXISTS violations")
            cursor.execute("DROP TABLE IF EXISTS attendance")
            cursor.execute("DROP TABLE IF EXISTS schedules")

            cursor.execute("SET FOREIGN_KEY_CHECKS = 1")

            cursor.execute("""
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
                    photo_folder VARCHAR(255),
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            """)

            cursor.execute("""
                CREATE TABLE schedules (
                    schedule_id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
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
            """)

            cursor.execute("""
                CREATE TABLE attendance (
                    attendance_id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
                    student_id VARCHAR(20) NOT NULL,
                    schedule_id INT UNSIGNED NOT NULL,
                    date DATE NOT NULL,
                    time_in TIME,
                    status VARCHAR(10) NOT NULL,
                    has_violation BOOLEAN DEFAULT FALSE,
                    remarks TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (student_id) REFERENCES students(student_id),
                    FOREIGN KEY (schedule_id) REFERENCES schedules(schedule_id)
                )
            """)

            cursor.execute("""
                CREATE TABLE violations (
                    violation_id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
                    attendance_id INT UNSIGNED NOT NULL,
                    student_id VARCHAR(20) NOT NULL,
                    violation_type VARCHAR(50) NOT NULL,
                    description TEXT,
                    severity VARCHAR(20) DEFAULT 'minor',
                    image_path VARCHAR(255),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (attendance_id) REFERENCES attendance(attendance_id),
                    FOREIGN KEY (student_id) REFERENCES students(student_id)
                )
            """)

    finally:
        conn.close()

    print("✅ Database tables ready")