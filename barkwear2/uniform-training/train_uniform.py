"""
Uniform Detection Model Training Script
Trains YOLOv8 to detect:
- Blue Polo
- Black Pants  
- ID Card
"""

from ultralytics import YOLO
import torch

def train_uniform_model():
    """Train YOLOv8 for uniform detection"""
    
    print("🎓 Starting Uniform Detection Training...")
    print(f"🔧 Using device: {'CUDA' if torch.cuda.is_available() else 'CPU'}")
    
    # Load pre-trained YOLOv8 model (nano version for speed)
    model = YOLO('yolov8n.pt')  # or 'yolov8s.pt' for better accuracy
    
    # Train the model
    results = model.train(
        data='uniform_data.yaml',      # Dataset config file
        epochs=100,                     # Number of training epochs
        imgsz=640,                      # Image size
        batch=16,                       # Batch size (adjust based on GPU)
        name='uniform_detector',        # Experiment name
        patience=20,                    # Early stopping patience
        save=True,                      # Save checkpoints
        device=0 if torch.cuda.is_available() else 'cpu',
        
        # Data Augmentation
        hsv_h=0.015,                   # HSV-Hue augmentation
        hsv_s=0.7,                     # HSV-Saturation
        hsv_v=0.4,                     # HSV-Value
        degrees=10.0,                  # Rotation
        translate=0.1,                 # Translation
        scale=0.5,                     # Scaling
        flipud=0.0,                    # Vertical flip
        fliplr=0.5,                    # Horizontal flip (50% chance)
        mosaic=1.0,                    # Mosaic augmentation
    )
    
    print("\n✅ Training Complete!")
    print(f"📁 Best model saved at: runs/detect/uniform_detector/weights/best.pt")
    
    # Validate the model
    print("\n🧪 Validating model...")
    metrics = model.val()
    
    print(f"\n📊 Results:")
    print(f"   mAP50: {metrics.box.map50:.3f}")
    print(f"   mAP50-95: {metrics.box.map:.3f}")
    
    return model

def test_model(model_path = r"C:\Users\Aron\Desktop\BarkWear\ml-service\NuNiform\runs\detect\uniform_detector3\weights\best.pt"):
    """Test the trained model on sample images"""
    
    print("\n🧪 Testing trained model...")
    model = YOLO(model_path)
    
    # Test on validation images
    results = model.predict(
        source='uniform-dataset/images/val',
        save=True,
        conf=0.25,
        name='test_predictions'
    )
    
    print(f"✅ Test complete! Check: runs/detect/test_predictions/")
    
    return results

if __name__ == '__main__':
    # Train the model
    trained_model = train_uniform_model()
    
    # Test the model
    test_model()
    
    print("\n🎉 All done! Your uniform detector is ready!")
    print("📁 Model location: runs/detect/uniform_detector/weights/best.pt")