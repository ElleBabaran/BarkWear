"""
Improved Uniform Detection Model Training Script
Enhanced for better pants and shoes detection
Trains YOLOv8 to detect:
- Blue Polo
- Black Pants  
- ID Card
- Shoes (if included)
"""

from ultralytics import YOLO
import torch
import os

def train_uniform_model_improved():
    """Train YOLOv8 for uniform detection with optimized settings"""
    
    print("🎯 Starting IMPROVED Uniform Detection Training...")
    print(f"🔧 Using device: {'CUDA (GPU)' if torch.cuda.is_available() else 'CPU'}")
    
    if torch.cuda.is_available():
        print(f"   GPU: {torch.cuda.get_device_name(0)}")
        print(f"   Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")
    
    # Load pre-trained YOLOv8 model
    # Options: yolov8n.pt (fastest), yolov8s.pt (balanced), yolov8m.pt (better accuracy)
    model = YOLO('yolov8n.pt')
    
    print("\n📋 Training Configuration:")
    print("   - Model: YOLOv8 Nano (fast + accurate)")
    print("   - Focus: Better pants & shoes detection")
    print("   - Image size: 640x640")
    print("   - Epochs: 150 (with early stopping)")
    print("   - Enhanced augmentation for lower body items")
    
    # Train the model with improved hyperparameters
    results = model.train(
        # Dataset
        data='uniform_data.yaml',
        
        # Training parameters
        epochs=150,                     # More epochs for better learning
        imgsz=640,                      # Standard image size
        batch=8,                        # Smaller batch for better gradient updates
        
        # Optimizer settings
        optimizer='AdamW',              # Better optimizer for small objects
        lr0=0.001,                      # Initial learning rate (lower for stability)
        lrf=0.01,                       # Final learning rate
        momentum=0.937,
        weight_decay=0.0005,
        
        # Model settings
        patience=30,                    # Early stopping patience (more tolerance)
        save=True,
        device=0 if torch.cuda.is_available() else 'cpu',
        workers=4,                      # Data loading workers
        project='runs/detect',
        name='uniform_detector_v2',
        exist_ok=True,
        
        # Improved Data Augmentation (better for pants/shoes)
        hsv_h=0.02,                    # HSV-Hue augmentation
        hsv_s=0.7,                     # HSV-Saturation (helps with color variance)
        hsv_v=0.4,                     # HSV-Value (lighting changes)
        degrees=15.0,                  # Rotation (people stand at angles)
        translate=0.15,                # Translation (movement)
        scale=0.6,                     # Scaling (distance from camera)
        shear=5.0,                     # Shear augmentation
        perspective=0.0005,            # Perspective transformation
        flipud=0.0,                    # No vertical flip (people don't stand upside down)
        fliplr=0.5,                    # Horizontal flip (50% chance)
        mosaic=1.0,                    # Mosaic augmentation (great for detection)
        mixup=0.1,                     # Mixup augmentation (10% chance)
        copy_paste=0.1,                # Copy-paste augmentation (helps with occlusion)
        
        # Detection settings (better for small objects like ID cards)
        box=7.5,                       # Box loss weight
        cls=0.5,                       # Class loss weight
        dfl=1.5,                       # DFL loss weight
        
        # Advanced settings
        close_mosaic=10,               # Disable mosaic in last N epochs
        amp=True,                      # Automatic Mixed Precision (faster training)
        fraction=1.0,                  # Use 100% of dataset
        
        # Validation
        val=True,
        plots=True,
        save_period=10,                # Save checkpoint every 10 epochs
    )
    
    print("\n✅ Training Complete!")
    print(f"📁 Best model saved at: runs/detect/uniform_detector_v2/weights/best.pt")
    print(f"📁 Last model saved at: runs/detect/uniform_detector_v2/weights/last.pt")
    
    # Validate the model
    print("\n🧪 Validating model...")
    metrics = model.val()
    
    print(f"\n📊 Final Results:")
    print(f"   mAP50:    {metrics.box.map50:.3f} (IoU=0.5)")
    print(f"   mAP50-95: {metrics.box.map:.3f} (IoU=0.5:0.95)")
    print(f"   Precision: {metrics.box.mp:.3f}")
    print(f"   Recall:    {metrics.box.mr:.3f}")
    
    # Per-class metrics
    if hasattr(metrics.box, 'maps'):
        print(f"\n📋 Per-Class mAP50:")
        class_names = ['Blue Polo', 'Black Pants', 'ID Card']
        for i, (name, ap) in enumerate(zip(class_names, metrics.box.maps)):
            print(f"   {name}: {ap:.3f}")
    
    return model

def test_model_on_images(model_path='runs/detect/uniform_detector_v2/weights/best.pt', 
                         test_dir='uniform-dataset/images/val'):
    """Test the trained model on sample images"""
    
    if not os.path.exists(model_path):
        print(f"❌ Model not found at: {model_path}")
        print("   Please train the model first!")
        return None
    
    print(f"\n🧪 Testing trained model...")
    print(f"📁 Model: {model_path}")
    print(f"📁 Test images: {test_dir}")
    
    model = YOLO(model_path)
    
    # Test on validation images
    results = model.predict(
        source=test_dir,
        save=True,
        conf=0.25,              # Lower confidence threshold to see more detections
        iou=0.45,               # IoU threshold for NMS
        imgsz=640,
        name='test_predictions_v2',
        show_labels=True,
        show_conf=True,
        line_width=2,
    )
    
    print(f"✅ Test complete!")
    print(f"📁 Results saved to: runs/detect/test_predictions_v2/")
    
    return results

def analyze_current_model(model_path):
    """Analyze what might be wrong with current model"""
    
    if not os.path.exists(model_path):
        print(f"❌ Cannot find model at: {model_path}")
        return
    
    print("🔍 Analyzing current model performance...\n")
    model = YOLO(model_path)
    
    # Run validation
    metrics = model.val()
    
    print("📊 Current Model Metrics:")
    print(f"   Overall mAP50: {metrics.box.map50:.3f}")
    print(f"   Overall Recall: {metrics.box.mr:.3f}")
    
    # Check per-class performance
    if hasattr(metrics.box, 'maps'):
        class_names = ['Blue Polo', 'Black Pants', 'ID Card']
        print(f"\n📋 Per-Class Performance:")
        for name, ap in zip(class_names, metrics.box.maps):
            print(f"   {name}: {ap:.3f}")
    
    print("\n💡 Recommendations:")
    print("   1. Ensure you have enough training images (100+ per class)")
    print("   2. Check that pants/shoes annotations are accurate")
    print("   3. Make sure images show full body (not just upper body)")
    print("   4. Add more varied lighting conditions")
    print("   5. Include images from different camera angles")

if __name__ == '__main__':
    import sys
    
    print("="*60)
    print("🎯 UNIFORM DETECTION MODEL - IMPROVED TRAINING")
    print("="*60)
    
    # Option to analyze old model first
    if len(sys.argv) > 1 and sys.argv[1] == '--analyze':
        old_model = r"C:\Users\Aron\Desktop\BarkWear\uniform-training\runs\detect\uniform_detector5\weights\best.pt"
        analyze_current_model(old_model)
        print("\n" + "="*60)
        input("Press Enter to continue with retraining...")
    
    # Train the improved model
    print("\n🚀 Starting training...\n")
    trained_model = train_uniform_model_improved()
    
    # Test the model
    print("\n" + "="*60)
    test_model_on_images()
    
    print("\n" + "="*60)
    print("🎉 All done! Your improved uniform detector is ready!")
    print("📁 Model location: runs/detect/uniform_detector_v2/weights/best.pt")
    print("\n💡 Next steps:")
    print("   1. Check the validation results in runs/detect/uniform_detector_v2/")
    print("   2. Test with webcam using test_webcam.py")
    print("   3. If still not detecting well, consider:")
    print("      - Adding more training images of pants/shoes")
    print("      - Using yolov8s.pt for better accuracy")
    print("      - Checking annotation quality")
    print("="*60)