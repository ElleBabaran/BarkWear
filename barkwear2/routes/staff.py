from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash
from barkwear2.utils.db import db

staff_bp = Blueprint("staff", __name__, url_prefix="/staff")

@staff_bp.route("/login", methods=["POST"])
def staff_login():
    """Login staff using username and password"""
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"success": False, "error": "Username and password are required"}), 400

    # Fetch user
    user = db.execute_one("SELECT * FROM users WHERE username = %s", (username,))
    if not user:
        return jsonify({"success": False, "error": "User not found"}), 404

    # Check password
    if not check_password_hash(user["password_hash"], password):
        return jsonify({"success": False, "error": "Incorrect password"}), 401

    return jsonify({
        "success": True,
        "message": "Login successful",
        "user": {
            "username": user["username"],
            "first_name": user["first_name"],
            "last_name": user["last_name"],
            "role": user["role"],
            "outlook_email": user["outlook_email"]
        }
    }), 200
