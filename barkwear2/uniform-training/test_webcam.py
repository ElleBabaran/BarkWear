"""
Test Uniform Detection Model with Webcam
Real-time detection of: Blue Polo, Black Pants, ID Card
"""

from ultralytics import YOLO
import cv2

def test_webcam():
    """Test uniform detection on live webcam"""
    
    # Load your trained model
    model_path = r"C:\Users\Aron\Desktop\BarkWear\uniform-training\runs\detect\uniform_detector5\weights\best.pt"
    model = YOLO(model_path)
    
    print("🎯 Loading trained uniform detector...")
    print(f"📁 Model: {model_path}")
    
    # Open webcam
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("❌ Cannot open webcam!")
        return
    
    print("\n✅ Webcam opened!")
    print("📸 Detecting: Blue Polo, Black Pants, ID Card")
    print("Press 'q' to quit\n")
    
    class_names = ['Blue Polo', 'Black Pants', 'ID Card']
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("❌ Failed to grab frame")
            break
        
        # Run detection
        results = model(frame, conf=0.7, verbose=False)
        
        # Get detection boxes
        boxes = results[0].boxes
        
        # Count detections
        polo_count = sum(1 for box in boxes if int(box.cls) == 0)
        pants_count = sum(1 for box in boxes if int(box.cls) == 1)
        id_count = sum(1 for box in boxes if int(box.cls) == 2)
        
        # Determine uniform status
        uniform_complete = (polo_count > 0 and pants_count > 0 and id_count > 0)
        
        # Draw detections
        annotated = results[0].plot()
        
        # Add status overlay
        status_text = "✅ UNIFORM COMPLETE" if uniform_complete else "❌ UNIFORM INCOMPLETE"
        status_color = (0, 255, 0) if uniform_complete else (0, 0, 255)
        
        # Draw status box
        cv2.rectangle(annotated, (10, 10), (500, 120), (0, 0, 0), -1)
        cv2.putText(annotated, status_text, (20, 50), 
                   cv2.FONT_HERSHEY_SIMPLEX, 1.2, status_color, 3)
        
        # Draw item counts
        cv2.putText(annotated, f"Blue Polo: {polo_count}", (20, 80), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        cv2.putText(annotated, f"Black Pants: {pants_count}", (200, 80), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        cv2.putText(annotated, f"ID Card: {id_count}", (400, 80), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        
        # Display
        cv2.imshow('Uniform Detection - Press Q to Quit', annotated)
        
        # Exit on 'q'
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    cap.release()
    cv2.destroyAllWindows()
    print("\n✅ Test complete!")

if __name__ == '__main__':
    test_webcam()