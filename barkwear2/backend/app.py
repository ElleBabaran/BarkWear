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

# ✅ Model Configuration
MODEL_PATH = r'C:\Users\Aron\Desktop\Barkwear2\barkwear2\uniform-training\runs\detect\uniform_detector_v2\weights\best.pt'
model = YOLO(MODEL_PATH)
model.fuse()

REQUIRED_UNIFORM_ITEMS = ['shoes', 'blue_polo', 'black_pants']

# 🆕 Adjustable Face Recognition Settings
FACE_RECOGNITION_THRESHOLD = 0.6  # Lower = more lenient (0.4-0.7 range)
FACE_MIN_SIZE = 0.02  # Minimum 2% of image (was 5%, too strict)

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
        print(f"⚠️ DB lookup failed for {student_id}: {e}")
    return ''


def reload_face_db():
    """Load face encodings from student photo folder"""
    global _face_db
    _face_db = []

    photo_root = Config.STUDENT_PHOTO_FOLDER
    if not os.path.isdir(photo_root):
        print(f"⚠️ Student photo folder not found: {photo_root}")
        return

    for folder_name in os.listdir(photo_root):
        folder_path = os.path.join(photo_root, folder_name)
        if not os.path.isdir(folder_path):
            continue

        student_id = folder_name.strip()
        student_display = get_student_name_from_db(student_id)

        if not student_display:
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
                print(f"⚠️ Could not encode {img_path}: {e}")

    print(f"✅ Face DB loaded — {len(_face_db)} encoding(s)")


def identify_student(opencv_image, threshold=None) -> dict:
    """
    🆕 IMPROVED: Adjustable threshold for face recognition
    Lower threshold = more lenient matching
    """
    if not _face_db:
        return {}

    # Use global threshold if not specified
    if threshold is None:
        threshold = FACE_RECOGNITION_THRESHOLD

    rgb = cv2.cvtColor(opencv_image, cv2.COLOR_BGR2RGB)

    # Shrink to max 320px for face detection — much faster for live feed
    h_orig, w_orig = rgb.shape[:2]
    face_scale = min(1.0, 320 / max(h_orig, w_orig))
    rgb_small = cv2.resize(rgb, (int(w_orig * face_scale), int(h_orig * face_scale))) if face_scale < 1.0 else rgb

    # upsample=1 is fast enough for live detection; use 2 only for static photo capture
    face_locations_small = face_recognition.face_locations(
        rgb_small,
        number_of_times_to_upsample=1,
        model='hog'
    )

    # Scale face locations back to original image coordinates
    face_locations = [
        (int(top / face_scale), int(right / face_scale),
         int(bottom / face_scale), int(left / face_scale))
        for (top, right, bottom, left) in face_locations_small
    ] if face_scale < 1.0 else face_locations_small

    if not face_locations:
        print("👤 No faces detected in frame")
        return {}

    # Filter out very small faces (likely background)
    h, w = opencv_image.shape[:2]
    valid_faces = []
    for face_loc in face_locations:
        top, right, bottom, left = face_loc
        face_width = right - left
        face_height = bottom - top
        face_area = (face_width * face_height) / (w * h)
        
        if face_area >= FACE_MIN_SIZE:  # At least 5% of image
            valid_faces.append(face_loc)
        else:
            print(f"👤 Filtered small face: {face_area*100:.1f}% of image")
    
    if not valid_faces:
        print("👤 No valid-sized faces found")
        return {}

    face_encodings = face_recognition.face_encodings(rgb, valid_faces)
    known_encodings = [e['encoding'] for e in _face_db]

    best_match = {}
    best_distance = 1.0

    for i, encoding in enumerate(face_encodings):
        distances = face_recognition.face_distance(known_encodings, encoding)
        if len(distances) == 0:
            continue
        
        min_idx = int(np.argmin(distances))
        min_dist = distances[min_idx]

        print(f"👤 Face match distance: {min_dist:.3f} (threshold: {threshold:.3f})")

        # 🆕 Use adjustable threshold
        if min_dist < threshold and min_dist < best_distance:
            best_distance = min_dist
            matched = _face_db[min_idx]
            top, right, bottom, left = valid_faces[i]

            # Tighten bbox to actual face — trim hair/forehead from top,
            # and shrink sides so box hugs the face more closely
            face_h = bottom - top
            face_w = right - left
            tight_top   = int(top    + face_h * 0.10)   # skip top 10% (hair/forehead)
            tight_bottom= int(bottom - face_h * 0.02)   # small trim at chin
            tight_left  = int(left   + face_w * 0.08)   # trim sides
            tight_right = int(right  - face_w * 0.08)

            best_match = {
                'student_id': matched['student_id'],
                'name': matched['name'],
                'face_bbox': [float(tight_left), float(tight_top), float(tight_right), float(tight_bottom)],
                'confidence': float(1.0 - min_dist)
            }
            print(f"✅ Matched: {matched['name']} (confidence: {(1.0-min_dist)*100:.1f}%)")

    if not best_match:
        print(f"❌ No match found (best distance: {best_distance:.3f})")

    return best_match


def base64_to_image(base64_string):
    """Convert base64 string to OpenCV image"""
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


# ==================== UNIFORM DETECTION (LiveDetection) ====================
@app.route('/detect', methods=['POST'])
def detect():
    """Main uniform detection endpoint for LiveDetection"""
    try:
        data = request.get_json()
        image_data = data.get('image')
        face_threshold = data.get('face_threshold', FACE_RECOGNITION_THRESHOLD)  # 🆕 Adjustable
        
        if not image_data:
            return jsonify({'success': False, 'error': 'No image data provided'}), 400

        image = base64_to_image(image_data)
        image = cv2.flip(image, 1)

        # Resize for faster processing
        height, width = image.shape[:2]
        max_dimension = 640
        if max(height, width) > max_dimension:
            scale = max_dimension / max(height, width)
            new_width = int(width * scale)
            new_height = int(height * scale)
            image = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_LINEAR)

        # 1. YOLO uniform detection
        results = model(image, conf=0.5, verbose=False)
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

        # Deduplicate
        seen_classes: dict = {}
        for det in sorted(detections, key=lambda d: d['confidence'], reverse=True):
            cls = det['class']
            if cls not in seen_classes:
                seen_classes[cls] = det
        detections = list(seen_classes.values())

        uniform_status = check_uniform_compliance(detections)

        # 2. Face recognition with adjustable threshold
        student_info = identify_student(image, threshold=face_threshold)
        student_name = student_info.get('name', '')
        student_id   = student_info.get('student_id', '')
        face_bbox    = student_info.get('face_bbox', None)
        face_conf    = student_info.get('confidence', 0)

        return jsonify({
            'success':          True,
            'detections':       detections,
            'uniform_status':   uniform_status,
            'total_detections': len(detections),
            'student_name':     student_name,
            'student_id':       student_id,
            'face_bbox':        face_bbox,
            'face_confidence':  face_conf,
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


# ==================== FACE DETECTION (PhotoCapture) ====================
@app.route('/detect-face', methods=['POST'])
def detect_face():
    """
    Face detection for PhotoCapture - crops face properly without background
    """
    try:
        data = request.get_json()
        image_data = data.get('image')
        confidence_threshold = data.get('confidence', 0.2)
        quality = data.get('quality', 'accurate')
        
        if not image_data:
            return jsonify({'success': False, 'error': 'No image data provided'}), 400

        image = base64_to_image(image_data)
        # No flip here — frontend already sends the correct orientation
        rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Quality settings — always upsample more for better far detection
        if quality == 'fast':
            upsample = 2
        else:
            upsample = 3
        
        # Resize image larger before detection to help with distant faces
        scale = 2.0
        enlarged = cv2.resize(rgb, (int(rgb.shape[1] * scale), int(rgb.shape[0] * scale)))
        
        # Detect faces on enlarged image
        face_locations_enlarged = face_recognition.face_locations(enlarged, number_of_times_to_upsample=upsample, model='hog')
        
        # Scale back coordinates to original image size
        face_locations = [
            (int(top / scale), int(right / scale), int(bottom / scale), int(left / scale))
            for (top, right, bottom, left) in face_locations_enlarged
        ]
        
        if not face_locations:
            return jsonify({
                'success': True,
                'face_bbox': None,
                'confidence': 0,
                'message': 'No face detected'
            })
        
        # Get largest face only
        h, w = image.shape[:2]
        largest_face = None
        largest_area = 0
        
        for face_loc in face_locations:
            top, right, bottom, left = face_loc
            area = (right - left) * (bottom - top)
            if area > largest_area:
                largest_area = area
                largest_face = face_loc
        
        if not largest_face:
            return jsonify({
                'success': True,
                'face_bbox': None,
                'confidence': 0,
                'message': 'No valid face found'
            })
        
        top, right, bottom, left = largest_face
        face_width = right - left
        face_height = bottom - top
        face_area = face_width * face_height
        image_area = w * h
        
        # Calculate confidence — don't penalize small faces (user may be far)
        # size_score: 1% of image = full score (para hindi ma-penalize pag malayo)
        size_score = min(face_area / (image_area * 0.01), 1.0)
        face_center_x = (left + right) / 2
        face_center_y = (top + bottom) / 2
        image_center_x = w / 2
        image_center_y = h / 2
        center_distance = np.sqrt(
            ((face_center_x - image_center_x) / w) ** 2 + 
            ((face_center_y - image_center_y) / h) ** 2
        )
        center_score = max(0, 1.0 - center_distance * 1.5)  # less strict centering
        
        # Get face encodings for quality check
        face_encodings = face_recognition.face_encodings(rgb, [largest_face])
        encoding_score = 1.0 if face_encodings else 0.5
        
        confidence_score = (size_score * 0.4 + center_score * 0.3 + encoding_score * 0.3)
        
        # Return tight face bbox
        face_bbox = [float(left), float(top), float(right), float(bottom)]
        
        print(f"📸 Face for capture: confidence={confidence_score:.2f}, size={face_width}x{face_height}")
        
        return jsonify({
            'success': True,
            'face_bbox': face_bbox,
            'confidence': float(confidence_score),
            'message': f'Face detected ({confidence_score*100:.0f}% confidence)',
            'face_size': {'width': int(face_width), 'height': int(face_height)},
            'meets_threshold': bool(confidence_score >= confidence_threshold)
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


# ==================== CONFIGURATION ENDPOINTS ====================
@app.route('/set-face-threshold', methods=['POST'])
def set_face_threshold():
    """
    🆕 Adjust face recognition threshold dynamically
    Lower = more lenient, Higher = more strict
    """
    global FACE_RECOGNITION_THRESHOLD
    
    data = request.get_json()
    new_threshold = data.get('threshold', 0.6)
    
    # Clamp between 0.3 and 0.8
    new_threshold = max(0.3, min(0.8, new_threshold))
    
    FACE_RECOGNITION_THRESHOLD = new_threshold
    
    print(f"🎚️ Face recognition threshold set to: {new_threshold}")
    
    return jsonify({
        'success': True,
        'threshold': FACE_RECOGNITION_THRESHOLD,
        'message': f'Threshold set to {new_threshold:.2f}'
    })


@app.route('/get-face-threshold', methods=['GET'])
def get_face_threshold():
    """Get current face recognition threshold"""
    return jsonify({
        'success': True,
        'threshold': FACE_RECOGNITION_THRESHOLD,
        'recommended_range': '0.4-0.7',
        'description': 'Lower = more lenient, Higher = more strict'
    })


@app.route('/reload-faces', methods=['POST'])
def reload_faces():
    reload_face_db()
    return jsonify({'success': True, 'total_encodings': len(_face_db)})


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'model_loaded': model is not None,
        'face_encodings': len(_face_db),
        'known_students': len(set(e['student_id'] for e in _face_db)),
        'face_threshold': FACE_RECOGNITION_THRESHOLD
    })


@app.route('/test-detection', methods=['GET'])
def test_detection():
    return jsonify({
        'status': 'ok',
        'model_classes': model.names,
        'required_items': REQUIRED_UNIFORM_ITEMS,
        'confidence_threshold': 0.5,
        'face_threshold': FACE_RECOGNITION_THRESHOLD,
        'face_encodings': len(_face_db),
        'known_students': [{'id': e['student_id'], 'name': e['name']} for e in _face_db]
    })


if __name__ == '__main__':
    print("=" * 60)
    print("🚀 Starting BarkWear Backend (FIXED FACE DETECTION)...")
    print("=" * 60)

    Config.init_folders()
    print(f"📁 Student photo folder: {Config.STUDENT_PHOTO_FOLDER}")

    try:
        with app.app_context():
            init_db()
        print("✅ Database initialized")
    except Exception as db_err:
        print(f"⚠️ Database init failed: {db_err}")

    reload_face_db()

    print(f"🎯 Required uniform items: {REQUIRED_UNIFORM_ITEMS}")
    print(f"🎯 Model: uniform_detector_v2 (98.3% mAP50!)")
    print(f"📊 Uniform confidence: 0.5 (50%)")
    print(f"👤 Face recognition threshold: {FACE_RECOGNITION_THRESHOLD} (adjustable)")
    print(f"   - Lower threshold = more lenient matching")
    print(f"   - Can adjust via: POST /set-face-threshold")
    print(f"📸 Face min size: {FACE_MIN_SIZE*100:.0f}% of image")
    print("✅ Starting Flask server on http://localhost:5000")
    print("=" * 60 + "\n")

    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)