CREATE DATABASE BarkWeb;
USE BarkWeb;


-- ======================
-- Colleges
-- ======================
CREATE TABLE colleges(
    college_id BIGINT AUTO_INCREMENT PRIMARY KEY, 
    college_code VARCHAR(10) UNIQUE NOT NULL, 
    college_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ======================
-- Students
-- ======================
CREATE TABLE student(
    student_id VARCHAR(20) PRIMARY KEY,
    student_name VARCHAR(100) NOT NULL,
    block VARCHAR(10) NOT NULL,
    year_level INT NOT NULL,
    program VARCHAR(100),
    photo_folder VARCHAR(255),
    face_encoding_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ======================
-- Subjects
-- ======================
CREATE TABLE subjects(
    subject_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    subject_code VARCHAR(20) UNIQUE NOT NULL,
    subject_name VARCHAR(100) UNIQUE NOT NULL,
    units INT DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ======================
-- Rooms
-- ======================
CREATE TABLE room (
    room_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    room_number VARCHAR(20) NOT NULL,             
    building VARCHAR(50),
    capacity INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ======================
-- Schedules
-- ======================
CREATE TABLE schedules(
    schedule_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    subject_id BIGINT NOT NULL,
    room_id BIGINT NOT NULL, 
    day_of_week INT NOT NULL COMMENT '1=Monday, 6=Saturday',
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    professor VARCHAR(100) NOT NULL,
    block VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE,
    FOREIGN KEY(room_id) REFERENCES room(room_id) ON DELETE CASCADE
);

-- ======================
-- Enrollments
-- ======================
CREATE TABLE enrollments (
    enrollment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL,
    schedule_id BIGINT NOT NULL,

    FOREIGN KEY(schedule_id) REFERENCES schedules(schedule_id) ON DELETE CASCADE,
    FOREIGN KEY(student_id) REFERENCES student(student_id) ON DELETE CASCADE,

    UNIQUE KEY unique_enrollment (student_id, schedule_id)
);

-- ======================
-- Attendance
-- ======================
CREATE TABLE attendance (
    attendance_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL,
    schedule_id BIGINT NOT NULL,
    timestamp DATETIME NOT NULL,
    status ENUM('present','late','absent') NOT NULL,
    uniform_compliant BOOLEAN DEFAULT TRUE, 
    photo_evidence VARCHAR(255),

    FOREIGN KEY(student_id) REFERENCES student(student_id),
    FOREIGN KEY(schedule_id) REFERENCES schedules(schedule_id),

    INDEX idx_student_date(student_id, timestamp),
    INDEX idx_schedule_date(schedule_id, timestamp)
);

-- ======================
-- Violations
-- ======================
CREATE TABLE violations (
    violation_number BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL,
    violation_type VARCHAR(100),
    missing_items VARCHAR(255),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(student_id) REFERENCES student(student_id)
);

-- ======================
-- Verify Structure
-- ======================
SHOW TABLES;
DESCRIBE student;
DESCRIBE violations;
DESCRIBE attendance;
