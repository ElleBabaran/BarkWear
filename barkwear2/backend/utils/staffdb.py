import pymysql
import bcrypt
from contextlib import contextmanager
from config import Config

class StaffDB:
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
        conn = pymysql.connect(**self.config)
        try:
            yield conn
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()

    def init_users_table(self):
        sql = """
        CREATE TABLE IF NOT EXISTS users (
            id INT PRIMARY KEY AUTO_INCREMENT,
            username VARCHAR(50) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(20) NOT NULL DEFAULT 'admin',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(sql)
        print("✅ Users table initialized")

    def create_user(self, username, password, role="admin"):
        pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
        sql = "INSERT INTO users (username, password_hash, role) VALUES (%s, %s, %s)"
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(sql, (username, pw_hash, role))

    def authenticate_user(self, username, password):
        sql = "SELECT * FROM users WHERE username = %s"
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(sql, (username,))
                user = cursor.fetchone()
                if user and bcrypt.checkpw(password.encode(), user["password_hash"].encode()):
                    return user
        return None

    def delete_user(self, username):
        sql = "DELETE FROM users WHERE username = %s"
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(sql, (username,))

# global instance
staff_db = StaffDB()
