from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
import base64
import cv2
import numpy as np
from io import BytesIO
from PIL import Image
import datetime

app = Flask(__name__)
CORS(app)

# Load your trained YOLOv8 model
MODEL_PATH = r'C:\Users\Aron\Desktop\Barkwear2\barkwear2\uniform-training\runs\detect\uniform_detector5\weights\best.pt'
model = YOLO(MODEL_PATH)

# Define your uniform items - FIXED to match actual model classes
REQUIRED_UNIFORM_ITEMS = ['id_card', 'blue_polo', 'black_pants']

def base64_to_image(base64_string):
    """Convert base64 string to OpenCV image"""
    if ',' in base64_string:
        base64_string = base64_string.split(',')[1]
    
    img_bytes = base64.b64decode(base64_string)
    pil_image = Image.open(BytesIO(img_bytes))
    opencv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
    
    return opencv_image

def check_uniform_compliance(detections):
    """Check if all required uniform items are detected"""
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
        print("\n" + "="*50)
        print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] 🔍 DETECTION REQUEST RECEIVED")
        print("="*50)
        
        data = request.get_json()
        image_data = data.get('image')
        
        if not image_data:
            print("❌ ERROR: No image data provided")
            return jsonify({
                'success': False,
                'error': 'No image data provided'
            }), 400
        
        print("✅ Image data received")
        print(f"📊 Image data length: {len(image_data)} characters")
        
        # Convert base64 to image
        image = base64_to_image(image_data)
        print(f"🖼️ Image converted - Shape: {image.shape}")
        
        # Run YOLOv8 detection with LOWER confidence threshold
        print("🤖 Running YOLOv8 detection...")
        results = model(image, conf=0.15)  # LOWERED to 0.15 (15%)
        
        # Process detections
        detections = []
        for result in results:
            boxes = result.boxes
            print(f"📦 Total boxes found: {len(boxes)}")
            
            for i, box in enumerate(boxes):
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                confidence = float(box.conf[0].cpu().numpy())
                class_id = int(box.cls[0].cpu().numpy())
                class_name = result.names[class_id]
                
                print(f"   [{i+1}] {class_name}: {confidence:.2%} at [{x1:.0f}, {y1:.0f}, {x2:.0f}, {y2:.0f}]")
                
                detections.append({
                    'class': class_name,
                    'confidence': confidence,
                    'bbox': [float(x1), float(y1), float(x2), float(y2)]
                })
        
        # Check uniform compliance
        uniform_status = check_uniform_compliance(detections)
        
        print(f"\n📋 RESULTS:")
        print(f"   Total detections: {len(detections)}")
        print(f"   Detected items: {[d['class'] for d in detections]}")
        print(f"   Uniform status: {uniform_status}")
        print("="*50 + "\n")
        
        return jsonify({
            'success': True,
            'detections': detections,
            'uniform_status': uniform_status,
            'total_detections': len(detections)
        })
    
    except Exception as e:
        print(f"\n❌ ERROR in detection: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'model_loaded': model is not None,
        'model_path': MODEL_PATH
    })

@app.route('/test-detection', methods=['GET'])
def test_detection():
    """Test endpoint to check model classes"""
    return jsonify({
        'status': 'ok',
        'model_classes': model.names,
        'required_items': REQUIRED_UNIFORM_ITEMS,
        'confidence_threshold': 0.15
    })

if __name__ == '__main__':
    print(f"Loading YOLOv8 model from: {MODEL_PATH}")
    print(f"Model classes: {model.names}")
    print(f"Required uniform items: {REQUIRED_UNIFORM_ITEMS}")
    print(f"Confidence threshold: 0.15 (15%)")
    print("Starting Flask server on http://localhost:5000")
    print("\n💡 TIP: Open http://localhost:5000/test-detection to see model info")
    print("="*50 + "\n")
    app.run(host='0.0.0.0', port=5000, debug=True)