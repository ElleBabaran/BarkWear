from flask import Blueprint, jsonify, request
from utils.db import get_db

students_bp = Blueprint("students", __name__)

# ==========================
# GET ALL STUDENTS
# ==========================
@students_bp.route("/", methods=["GET"])
def get_students():
    db = get_db()
    cursor = db.cursor()

    cursor.execute("SELECT * FROM student")
    students = cursor.fetchall()

    db.close()
    return jsonify(students)


# ==========================
# GET SINGLE STUDENT
# ==========================
@students_bp.route("/<student_id>", methods=["GET"])
def get_student(student_id):
    db = get_db()
    cursor = db.cursor()

    cursor.execute(
        "SELECT * FROM student WHERE student_id = %s",
        (student_id,)
    )
    student = cursor.fetchone()

    db.close()

    if not student:
        return jsonify({"error": "Student not found"}), 404

    return jsonify(student)


# ==========================
# CREATE STUDENT
# ==========================
@students_bp.route("/", methods=["POST"])
def add_student():
    data = request.json

    sql = """
    INSERT INTO student
    (student_id, student_name, block, year_level, program, photo_folder, face_encoding_path)
    VALUES (%s, %s, %s, %s, %s, %s, %s)
    """

    db = get_db()
    cursor = db.cursor()

    cursor.execute(sql, (
        data["student_id"],
        data["student_name"],
        data["block"],
        data["year_level"],
        data.get("program"),
        data.get("photo_folder"),
        data.get("face_encoding_path")
    ))

    db.close()
    return jsonify({"message": "Student created"}), 201


# ==========================
# UPDATE STUDENT
# ==========================
@students_bp.route("/<student_id>", methods=["PUT"])
def update_student(student_id):
    data = request.json

    sql = """
    UPDATE student SET
        student_name = %s,
        block = %s,
        year_level = %s,
        program = %s
    WHERE student_id = %s
    """

    db = get_db()
    cursor = db.cursor()

    cursor.execute(sql, (
        data["student_name"],
        data["block"],
        data["year_level"],
        data.get("program"),
        student_id
    ))

    db.close()
    return jsonify({"message": "Student updated"})


# ==========================
# DELETE STUDENT
# ==========================
@students_bp.route("/<student_id>", methods=["DELETE"])
def delete_student(student_id):
    db = get_db()
    cursor = db.cursor()

    cursor.execute(
        "DELETE FROM student WHERE student_id = %s",
        (student_id,)
    )

    db.close()
    return jsonify({"message": "Student deleted"})
