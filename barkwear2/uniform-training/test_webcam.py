"""
Enhanced Uniform Detection Webcam Test
Tests improved model with better visualization
"""

from ultralytics import YOLO
import cv2
import numpy as np
from datetime import datetime

def draw_enhanced_ui(frame, detections, uniform_status):
    """Draw enhanced UI overlay"""
    
    h, w = frame.shape[:2]
    
    # Create semi-transparent overlay
    overlay = frame.copy()
    
    # Status banner at top
    banner_height = 100
    cv2.rectangle(overlay, (0, 0), (w, banner_height), (0, 0, 0), -1)
    
    # Main status
    status_text = "✅ UNIFORM COMPLETE" if uniform_status else "❌ INCOMPLETE"
    status_color = (0, 255, 0) if uniform_status else (0, 0, 255)
    
    cv2.putText(overlay, status_text, (20, 50), 
               cv2.FONT_HERSHEY_SCRIPT_SIMPLEX, 1.5, status_color, 3)
    
    # Detection counts with icons
    y_pos = 85
    x_start = 20
    spacing = 200
    
    for i, (name, count) in enumerate(detections.items()):
        x = x_start + (i * spacing)
        text = f"{name}: {count}"
        color = (0, 255, 0) if count > 0 else (100, 100, 100)
        cv2.putText(overlay, text, (x, y_pos), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
    
    # Blend overlay
    alpha = 0.7
    cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0, frame)
    
    return frame

def test_webcam_improved(model_path=None, confidence=0.5):
    """Test uniform detection with enhanced visualization"""
    
    # Model path
    if model_path is None:
        model_path = "runs/detect/uniform_detector_v2/weights/best.pt"
    
    print("="*60)
    print("🎯 ENHANCED UNIFORM DETECTION TEST")
    print("="*60)
    print(f"\n📁 Model: {model_path}")
    print(f"🎚️ Confidence threshold: {confidence}")
    
    try:
        model = YOLO(model_path)
        print("✅ Model loaded successfully!")
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        print("\n💡 Make sure you've trained the model first!")
        print("   Run: python train_uniform_improved.py")
        return
    
    # Class names
    class_names = {
        0: 'Blue Polo',
        1: 'Black Pants',
        2: 'ID Card'
    }
    
    # Open webcam
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("❌ Cannot open webcam!")
        print("\n💡 Troubleshooting:")
        print("   1. Check if another app is using the camera")
        print("   2. Try a different camera index (1, 2, etc.)")
        print("   3. Check camera permissions")
        return
    
    # Set camera properties for better quality
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    cap.set(cv2.CAP_PROP_FPS, 30)
    
    print("\n✅ Webcam opened!")
    print(f"📷 Resolution: {int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))}x{int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))}")
    print(f"\n🎬 Controls:")
    print("   'q' - Quit")
    print("   's' - Save snapshot")
    print("   '+' - Increase confidence")
    print("   '-' - Decrease confidence")
    print("\n🔍 Detecting uniform items...\n")
    
    frame_count = 0
    fps_update_freq = 30
    fps = 0
    start_time = datetime.now()
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("❌ Failed to grab frame")
            break
        
        frame_count += 1
        
        # Calculate FPS
        if frame_count % fps_update_freq == 0:
            elapsed = (datetime.now() - start_time).total_seconds()
            fps = fps_update_freq / elapsed if elapsed > 0 else 0
            start_time = datetime.now()
        
        # Run detection
        results = model(frame, conf=confidence, verbose=False)
        
        # Get detection boxes
        boxes = results[0].boxes
        
        # Count detections by class
        detections = {name: 0 for name in class_names.values()}
        
        for box in boxes:
            cls = int(box.cls[0])
            if cls in class_names:
                detections[class_names[cls]] += 1
        
        # Determine uniform status
        uniform_complete = all(count > 0 for count in detections.values())
        
        # Draw detections on frame
        annotated = results[0].plot(
            line_width=2,
            font_size=12,
            labels=True,
            conf=True
        )
        
        # Add enhanced UI
        annotated = draw_enhanced_ui(annotated, detections, uniform_complete)
        
        # Add FPS counter
        cv2.putText(annotated, f"FPS: {fps:.1f}", 
                   (annotated.shape[1] - 120, 30),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        
        # Add confidence threshold
        cv2.putText(annotated, f"Conf: {confidence:.2f}", 
                   (annotated.shape[1] - 120, 60),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        
        # Display
        cv2.imshow('Uniform Detection - Enhanced', annotated)
        
        # Handle key presses
        key = cv2.waitKey(1) & 0xFF
        
        if key == ord('q'):
            break
        elif key == ord('s'):
            # Save snapshot
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"snapshot_{timestamp}.jpg"
            cv2.imwrite(filename, annotated)
            print(f"📸 Snapshot saved: {filename}")
        elif key == ord('+') or key == ord('='):
            confidence = min(0.95, confidence + 0.05)
            print(f"🎚️ Confidence: {confidence:.2f}")
        elif key == ord('-') or key == ord('_'):
            confidence = max(0.05, confidence - 0.05)
            print(f"🎚️ Confidence: {confidence:.2f}")
    
    cap.release()
    cv2.destroyAllWindows()
    
    print("\n✅ Test complete!")
    print("="*60)

def test_on_images(model_path=None, image_folder='test_images', confidence=0.5):
    """Test model on a folder of images"""
    
    if model_path is None:
        model_path = "runs/detect/uniform_detector_v2/weights/best.pt"
    
    print(f"\n🖼️ Testing on images from: {image_folder}")
    
    try:
        model = YOLO(model_path)
        
        results = model.predict(
            source=image_folder,
            save=True,
            conf=confidence,
            name='image_test_results',
            show_labels=True,
            show_conf=True
        )
        
        print(f"✅ Results saved to: runs/detect/image_test_results/")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == '__main__':
    import sys
    import os
    
    # Parse arguments
    model_path = None
    confidence = 0.5
    
    if len(sys.argv) > 1:
        model_path = sys.argv[1]
    
    if len(sys.argv) > 2:
        try:
            confidence = float(sys.argv[2])
        except ValueError:
            print("⚠️ Invalid confidence value, using default: 0.5")
    
    # Run webcam test
    test_webcam_improved(model_path, confidence)