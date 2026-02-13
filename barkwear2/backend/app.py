from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
import base64
import cv2
import numpy as np
from io import BytesIO
from PIL import Image
import datetime
import os
import face_recognition
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from barkwear2.utils.db import init_db, db
from barkwear2.routes.schedules_crud import schedule_bp
from barkwear2.routes.students import students_bp
from barkwear2.config import Config

app = Flask(__name__)
CORS(app)

app.register_blueprint(schedule_bp)
app.register_blueprint(students_bp)

MODEL_PATH = r'C:\Users\Aron\Desktop\Barkwear2\barkwear2\uniform-training\runs\detect\uniform_detector5\weights\best.pt'
model = YOLO(MODEL_PATH)

REQUIRED_UNIFORM_ITEMS = ['id_card', 'blue_polo', 'black_pants']

# Structure: [{ 'student_id': str, 'name': str, 'encoding': np.array }, ...]
_face_db: list[dict] = []


def get_student_name_from_db(student_id: str) -> str:
    """Look up a student's full name from the database by their ID."""
    try:
        row = db.execute_one(
            "SELECT first_name, middle_name, last_name FROM students WHERE student_id = %s",
            (student_id,)
        )
        if row:
            parts = [row['first_name']]
            if row.get('middle_name'):
                parts.append(row['middle_name'])
            parts.append(row['last_name'])
            return ' '.join(parts)
    except Exception as e:
        print(f"⚠️  DB lookup failed for {student_id}: {e}")
    return ''


def reload_face_db():
    """
    Walk Config.STUDENT_PHOTO_FOLDER and build face encodings.
    Folder name is the student ID (e.g. 2024-1005618).
    The actual name is fetched from the database.
    """
    global _face_db
    _face_db = []

    photo_root = Config.STUDENT_PHOTO_FOLDER
    if not os.path.isdir(photo_root):
        print(f"⚠️  Student photo folder not found: {photo_root}")
        return

    for folder_name in os.listdir(photo_root):
        folder_path = os.path.join(photo_root, folder_name)
        if not os.path.isdir(folder_path):
            continue

        # folder_name is the student ID e.g. "2024-1005618"
        student_id = folder_name.strip()

        # Try to get the name from DB first
        student_display = get_student_name_from_db(student_id)

        # Fallback: if DB lookup fails, use folder name
        if not student_display:
            # Try old format "2024-1005618_Juan_Dela_Cruz"
            parts = folder_name.split('_', 1)
            student_display = parts[1].replace('_', ' ') if len(parts) == 2 else folder_name

        for img_file in os.listdir(folder_path):
            if not img_file.lower().endswith(('.jpg', '.jpeg', '.png')):
                continue
            img_path = os.path.join(folder_path, img_file)
            try:
                img = face_recognition.load_image_file(img_path)
                encodings = face_recognition.face_encodings(img)
                if encodings:
                    _face_db.append({
                        'student_id': student_id,
                        'name': student_display,
                        'encoding': encodings[0]
                    })
            except Exception as e:
                print(f"⚠️  Could not encode {img_path}: {e}")

    print(f"✅ Face DB loaded — {len(_face_db)} encoding(s) for "
          f"{len(set(e['student_id'] for e in _face_db))} student(s)")
    for e in _face_db:
        print(f"   👤 {e['student_id']} → {e['name']}")


def identify_student(opencv_image) -> dict:
    """
    Run face recognition on a single OpenCV BGR frame.
    Returns { 'student_id': str, 'name': str, 'face_bbox': list } or empty dict.
    """
    if not _face_db:
        return {}

    rgb = cv2.cvtColor(opencv_image, cv2.COLOR_BGR2RGB)
    face_locations = face_recognition.face_locations(rgb, model='hog')
    if not face_locations:
        return {}

    face_encodings = face_recognition.face_encodings(rgb, face_locations)
    known_encodings = [e['encoding'] for e in _face_db]

    best_match = {}
    best_distance = 1.0

    for i, encoding in enumerate(face_encodings):
        distances = face_recognition.face_distance(known_encodings, encoding)
        if len(distances) == 0:
            continue
        min_idx = int(np.argmin(distances))
        min_dist = distances[min_idx]

        if min_dist < 0.6 and min_dist < best_distance:
            best_distance = min_dist
            matched = _face_db[min_idx]
            # face_locations format: (top, right, bottom, left)
            top, right, bottom, left = face_locations[i]
            best_match = {
                'student_id': matched['student_id'],
                'name': matched['name'],
                'face_bbox': [float(left), float(top), float(right), float(bottom)]
            }

    return best_match


def base64_to_image(base64_string):
    if ',' in base64_string:
        base64_string = base64_string.split(',')[1]
    img_bytes = base64.b64decode(base64_string)
    pil_image = Image.open(BytesIO(img_bytes))
    return cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)


def check_uniform_compliance(detections):
    detected_items = [det['class'].lower() for det in detections]
    found_items = [item for item in REQUIRED_UNIFORM_ITEMS if item.lower() in detected_items]
    if len(found_items) == len(REQUIRED_UNIFORM_ITEMS):
        return "Compliant"
    elif len(found_items) > 0:
        return "Partially Compliant"
    else:
        return "Non-Compliant"


@app.route('/detect', methods=['POST'])
def detect():
    try:
        data = request.get_json()
        image_data = data.get('image')
        if not image_data:
            return jsonify({'success': False, 'error': 'No image data provided'}), 400

        image = base64_to_image(image_data)

        # 1. YOLO uniform detection
        results = model(image, conf=0.15)
        detections = []
        for result in results:
            for box in result.boxes:
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                confidence = float(box.conf[0].cpu().numpy())
                class_id = int(box.cls[0].cpu().numpy())
                class_name = result.names[class_id]
                detections.append({
                    'class': class_name,
                    'confidence': confidence,
                    'bbox': [float(x1), float(y1), float(x2), float(y2)]
                })

        uniform_status = check_uniform_compliance(detections)

        # 2. Face recognition
        student_info = identify_student(image)
        student_name = student_info.get('name', '')
        student_id   = student_info.get('student_id', '')
        face_bbox    = student_info.get('face_bbox', None)

        print(f"👤 Identified: '{student_name or 'unknown'}' ({student_id or 'N/A'})")

        return jsonify({
            'success':          True,
            'detections':       detections,
            'uniform_status':   uniform_status,
            'total_detections': len(detections),
            'student_name':     student_name,
            'student_id':       student_id,
            'face_bbox':        face_bbox,
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/reload-faces', methods=['POST'])
def reload_faces():
    reload_face_db()
    return jsonify({'success': True, 'total_encodings': len(_face_db)})


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status':         'ok',
        'model_loaded':   model is not None,
        'face_encodings': len(_face_db),
        'known_students': len(set(e['student_id'] for e in _face_db))
    })


@app.route('/test-detection', methods=['GET'])
def test_detection():
    return jsonify({
        'status':               'ok',
        'model_classes':        model.names,
        'required_items':       REQUIRED_UNIFORM_ITEMS,
        'confidence_threshold': 0.15,
        'face_encodings':       len(_face_db),
        'known_students':       [{'id': e['student_id'], 'name': e['name']} for e in _face_db]
    })


if __name__ == '__main__':
    print("=" * 50)
    print("🚀 Starting BarkWear Backend...")
    print("=" * 50)

    Config.init_folders()
    print(f"📁 Student photo folder : {Config.STUDENT_PHOTO_FOLDER}")

    try:
        with app.app_context():
            init_db()
        print("✅ Database initialized")
    except Exception as db_err:
        print(f"⚠️  Database init failed: {db_err}")
        print("   → Server will still start. Fix MySQL and restart.")

    reload_face_db()

    print(f"🎯 Required uniform items : {REQUIRED_UNIFORM_ITEMS}")
    print(f"🔍 Confidence threshold   : 0.15 (15%)")
    print("✅ Starting Flask server on http://localhost:5000")
    print("=" * 50 + "\n")

    app.run(host='0.0.0.0', port=5000, debug=True)