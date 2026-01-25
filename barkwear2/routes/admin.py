from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from barkwear2.utils.db import db
from barkwear2.config import Config

admin_bp = Blueprint("admin", __name__, url_prefix="/admin")

# Admin password for logging in
ADMIN_PASSWORD_HASH = generate_password_hash("supersecret")  # replace with your env var in prod

@admin_bp.route("/login", methods=["POST"])
def admin_login():
    """Verify admin password"""
    data = request.get_json()
    password = data.get("password")

    if not password:
        return jsonify({"success": False, "error": "Password is required"}), 400

    if check_password_hash(ADMIN_PASSWORD_HASH, password):
        return jsonify({"success": True, "message": "Login successful"}), 200
    else:
        return jsonify({"success": False, "error": "Invalid password"}), 401

@admin_bp.route("/add", methods=["POST"])
def add_account():
    """Add a new user account with hashed password"""
    data = request.get_json()
    required_fields = ["first_name", "last_name", "username", "role", "outlook_email", "password"]

    if not all(field in data for field in required_fields):
        return jsonify({"success": False, "error": "Missing required fields"}), 400

    # Hash the password
    password_hash = generate_password_hash(data["password"])

    try:
        query = """
            INSERT INTO users 
            (first_name, last_name, username, role, outlook_email, password_hash)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        user_id = db.execute_insert(query, (
            data["first_name"],
            data["last_name"],
            data["username"],
            data["role"],
            data["outlook_email"],
            password_hash
        ))
        return jsonify({"success": True, "message": "Account created", "user_id": user_id}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@admin_bp.route("/remove", methods=["POST"])
def remove_account():
    """Remove an account by username"""
    data = request.get_json()
    username = data.get("username")

    if not username:
        return jsonify({"success": False, "error": "Username is required"}), 400

    # Check if user exists
    user = db.execute_one("SELECT * FROM users WHERE username = %s", (username,))
    if not user:
        return jsonify({"success": False, "error": "User not found"}), 404

    # Delete the user
    try:
        db.execute_insert("DELETE FROM users WHERE username = %s", (username,))
        return jsonify({"success": True, "message": f"User '{username}' removed"}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
