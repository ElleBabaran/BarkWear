"""
Quick Start Guide
Run this to get started with retraining your uniform detection model
"""

import os
import sys

def print_header(text):
    print("\n" + "="*60)
    print(f"  {text}")
    print("="*60)

def check_requirements():
    """Check if all required packages are installed"""
    print_header("📦 CHECKING REQUIREMENTS")
    
    required = {
        'ultralytics': '8.0.196',
        'torch': '2.0.1',
        'cv2': 'opencv-python==4.8.1.78',
        'PIL': 'pillow==10.1.0',
        'numpy': '1.24.3'
    }
    
    missing = []
    
    for package, version_info in required.items():
        try:
            if package == 'cv2':
                import cv2
                print(f"✅ opencv-python: {cv2.__version__}")
            elif package == 'PIL':
                import PIL
                print(f"✅ pillow: {PIL.__version__}")
            else:
                module = __import__(package)
                version = getattr(module, '__version__', 'unknown')
                print(f"✅ {package}: {version}")
        except ImportError:
            missing.append(version_info)
            print(f"❌ {package}: NOT INSTALLED")
    
    if missing:
        print(f"\n⚠️ Missing packages detected!")
        print(f"\nInstall with:")
        print(f"pip install {' '.join(missing)}")
        return False
    
    print("\n✅ All requirements satisfied!")
    return True

def check_files():
    """Check if all necessary files exist"""
    print_header("📁 CHECKING FILES")
    
    required_files = [
        ('yolov8n.pt', 'YOLOv8 pretrained weights'),
        ('uniform_data.yaml', 'Dataset configuration'),
        ('train_uniform_improved.py', 'Training script'),
        ('diagnose_dataset.py', 'Diagnostic tool'),
        ('test_webcam_improved.py', 'Testing script'),
    ]
    
    all_present = True
    
    for filename, description in required_files:
        if os.path.exists(filename):
            print(f"✅ {filename:<30} ({description})")
        else:
            print(f"❌ {filename:<30} MISSING!")
            all_present = False
    
    return all_present

def check_dataset():
    """Check if dataset exists and has correct structure"""
    print_header("📊 CHECKING DATASET")
    
    try:
        import yaml
        with open('uniform_data.yaml', 'r') as f:
            config = yaml.safe_load(f)
        
        dataset_path = config.get('path', '')
        print(f"Dataset path: {dataset_path}")
        
        if not os.path.exists(dataset_path):
            print(f"❌ Dataset not found at: {dataset_path}")
            print(f"\n💡 Please update the 'path' in uniform_data.yaml")
            return False
        
        # Check structure
        required_dirs = [
            os.path.join(dataset_path, 'images', 'train'),
            os.path.join(dataset_path, 'images', 'val'),
            os.path.join(dataset_path, 'labels', 'train'),
            os.path.join(dataset_path, 'labels', 'val'),
        ]
        
        for dir_path in required_dirs:
            if os.path.exists(dir_path):
                files = len(os.listdir(dir_path))
                print(f"✅ {dir_path}: {files} files")
            else:
                print(f"❌ {dir_path}: NOT FOUND")
                return False
        
        return True
        
    except Exception as e:
        print(f"❌ Error checking dataset: {e}")
        return False

def show_menu():
    """Show main menu"""
    print_header("🎯 UNIFORM DETECTION - RETRAINING GUIDE")
    
    print("\nWhat would you like to do?\n")
    print("1. 🔍 Diagnose current dataset")
    print("2. 🚀 Train improved model")
    print("3. 📹 Test with webcam")
    print("4. 📖 View full README")
    print("5. 🛠️ Install requirements")
    print("6. ❌ Exit")
    
    return input("\nEnter your choice (1-6): ").strip()

def main():
    """Main menu loop"""
    
    print("\n")
    print("╔═══════════════════════════════════════════════════════════╗")
    print("║                                                           ║")
    print("║     UNIFORM DETECTION MODEL - RETRAINING ASSISTANT       ║")
    print("║                                                           ║")
    print("╚═══════════════════════════════════════════════════════════╝")
    
    # Initial checks
    if not check_requirements():
        print("\n❌ Please install required packages first!")
        print("Run: pip install -r requirements.txt")
        return
    
    if not check_files():
        print("\n❌ Some required files are missing!")
        return
    
    # Main loop
    while True:
        choice = show_menu()
        
        if choice == '1':
            print_header("🔍 RUNNING DATASET DIAGNOSTIC")
            os.system('python diagnose_dataset.py')
            input("\nPress Enter to continue...")
            
        elif choice == '2':
            print_header("🚀 STARTING MODEL TRAINING")
            
            if not check_dataset():
                print("\n❌ Dataset check failed!")
                print("Please fix dataset issues before training.")
                input("\nPress Enter to continue...")
                continue
            
            confirm = input("\n⚠️ Training may take 15-60 minutes. Continue? (y/n): ")
            if confirm.lower() == 'y':
                os.system('python train_uniform_improved.py')
            input("\nPress Enter to continue...")
            
        elif choice == '3':
            print_header("📹 WEBCAM TEST")
            
            model_path = "runs/detect/uniform_detector_v2/weights/best.pt"
            
            if not os.path.exists(model_path):
                print(f"❌ Trained model not found at: {model_path}")
                print("\n💡 Please train the model first (Option 2)")
                input("\nPress Enter to continue...")
                continue
            
            print("\nStarting webcam test...")
            print("Press 'q' to quit the test")
            input("\nPress Enter to start...")
            os.system('python test_webcam_improved.py')
            
        elif choice == '4':
            print_header("📖 README")
            
            if os.path.exists('README_RETRAINING.md'):
                with open('README_RETRAINING.md', 'r') as f:
                    print(f.read())
            else:
                print("❌ README not found")
            
            input("\nPress Enter to continue...")
            
        elif choice == '5':
            print_header("🛠️ INSTALLING REQUIREMENTS")
            
            if os.path.exists('requirements.txt'):
                confirm = input("\nInstall packages from requirements.txt? (y/n): ")
                if confirm.lower() == 'y':
                    os.system('pip install -r requirements.txt')
            else:
                print("❌ requirements.txt not found")
            
            input("\nPress Enter to continue...")
            
        elif choice == '6':
            print("\n👋 Goodbye!")
            break
        
        else:
            print("\n❌ Invalid choice. Please enter 1-6.")
            input("Press Enter to continue...")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Interrupted by user. Goodbye!")
        sys.exit(0)