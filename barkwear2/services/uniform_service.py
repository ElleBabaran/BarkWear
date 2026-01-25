"""
Uniform Detection Service using YOLOv8
"""
from ultralytics import YOLO
import cv2
import numpy as np
from barkwear2.config import Config
import os

class UniformDetectionService:
    def __init__(self):
        self.model_path = Config.YOLO_MODEL_PATH
        self.model = None
        self._load_model()
        
        # Expected uniform items (based on your training)
        self.required_items = ['blue_polo', 'black_pants', 'id_card']
    
    def _load_model(self):
        """Load YOLOv8 model"""
        if os.path.exists(self.model_path):
            try:
                self.model = YOLO(self.model_path)
                print(f"✅ YOLO model loaded from {self.model_path}")
            except Exception as e:
                print(f"❌ Error loading YOLO model: {e}")
                self.model = None
        else:
            print(f"⚠️  YOLO model not found at {self.model_path}")
            print("   Uniform detection will be disabled until model is provided")
            self.model = None
    
    def detect_uniform(self, image_array):
        """
        Detect uniform items in image
        
        Args:
            image_array: NumPy array of image (BGR format from OpenCV)
        
        Returns:
            dict: Detection results
        """
        if self.model is None:
            return {
                'success': False,
                'message': 'YOLO model not loaded',
                'has_blue_polo': False,
                'has_black_pants': False,
                'has_id_card': False,
                'is_complete': False,
                'violations': ['Model not available']
            }
        
        try:
            # Run inference
            results = self.model(image_array, verbose=False)
            
            # Parse detections
            detections = {
                'blue_polo': False,
                'black_pants': False,
                'id_card': False
            }
            
            detected_objects = []
            
            # Process results
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    class_id = int(box.cls[0])
                    confidence = float(box.conf[0])
                    class_name = result.names[class_id]
                    
                    # Check if detected item is a required uniform component
                    if class_name in detections and confidence > 0.5:
                        detections[class_name] = True
                        detected_objects.append({
                            'item': class_name,
                            'confidence': confidence,
                            'bbox': box.xyxy[0].tolist()
                        })
            
            # Check for violations
            violations = []
            if not detections['blue_polo']:
                violations.append('Missing blue polo')
            if not detections['black_pants']:
                violations.append('Missing black pants')
            if not detections['id_card']:
                violations.append('Missing ID card')
            
            is_complete = len(violations) == 0
            
            return {
                'success': True,
                'message': 'Uniform check complete',
                'has_blue_polo': detections['blue_polo'],
                'has_black_pants': detections['black_pants'],
                'has_id_card': detections['id_card'],
                'is_complete': is_complete,
                'violations': violations,
                'detected_objects': detected_objects
            }
        
        except Exception as e:
            return {
                'success': False,
                'message': f'Error during detection: {str(e)}',
                'has_blue_polo': False,
                'has_black_pants': False,
                'has_id_card': False,
                'is_complete': False,
                'violations': ['Detection error']
            }
    
    def annotate_image(self, image_array, detection_result):
        """
        Draw bounding boxes on image
        
        Args:
            image_array: NumPy array of image
            detection_result: Result from detect_uniform()
        
        Returns:
            Annotated image array
        """
        annotated = image_array.copy()
        
        if not detection_result.get('success'):
            return annotated
        
        # Draw detected objects
        for obj in detection_result.get('detected_objects', []):
            bbox = obj['bbox']
            item = obj['item']
            conf = obj['confidence']
            
            # Convert bbox to integers
            x1, y1, x2, y2 = map(int, bbox)
            
            # Choose color based on item
            color_map = {
                'blue_polo': (255, 0, 0),      # Blue
                'black_pants': (0, 0, 0),      # Black
                'id_card': (0, 255, 0)         # Green
            }
            color = color_map.get(item, (255, 255, 255))
            
            # Draw rectangle
            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
            
            # Draw label
            label = f"{item} {conf:.2f}"
            cv2.putText(annotated, label, (x1, y1-10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
        
        return annotated