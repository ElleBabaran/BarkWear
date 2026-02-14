"""
Dataset Manager for Uniform Training Project
Helps you add new images and prepare them for training
"""

import os
import shutil
import yaml
from pathlib import Path
from datetime import datetime
import random

class UniformDatasetManager:
    def __init__(self, project_root="C:\\Users\\Aron\\Desktop\\BarkWear\\uniform-training"):
        self.project_root = Path(project_root)
        self.config_file = self.project_root / "uniform_data.yaml"
        
        # Load dataset path from config
        self.load_config()
        
    def load_config(self):
        """Load dataset configuration"""
        try:
            with open(self.config_file, 'r') as f:
                config = yaml.safe_load(f)
            self.dataset_path = Path(config['path'])
            print(f"✅ Dataset path: {self.dataset_path}")
        except Exception as e:
            print(f"❌ Error loading config: {e}")
            self.dataset_path = None
    
    def show_current_stats(self):
        """Show current dataset statistics"""
        print("\n" + "="*60)
        print("📊 CURRENT DATASET STATISTICS")
        print("="*60)
        
        if not self.dataset_path or not self.dataset_path.exists():
            print("❌ Dataset path not found!")
            return
        
        for split in ['train', 'val']:
            images_dir = self.dataset_path / 'images' / split
            labels_dir = self.dataset_path / 'labels' / split
            
            if images_dir.exists() and labels_dir.exists():
                img_count = len(list(images_dir.glob('*.jpg'))) + len(list(images_dir.glob('*.png')))
                lbl_count = len(list(labels_dir.glob('*.txt')))
                
                print(f"\n{split.upper()} SET:")
                print(f"  Images: {img_count}")
                print(f"  Labels: {lbl_count}")
                
                if img_count != lbl_count:
                    print(f"  ⚠️ Mismatch! {abs(img_count - lbl_count)} files difference")
            else:
                print(f"\n{split.upper()} SET: ❌ Not found")
    
    def add_new_images_folder(self, source_folder, auto_split=True, train_ratio=0.8):
        """
        Add images from a folder to your dataset
        
        Args:
            source_folder: Path to folder with new images and labels
            auto_split: Automatically split into train/val
            train_ratio: Percentage for training (default 80%)
        """
        source = Path(source_folder)
        
        if not source.exists():
            print(f"❌ Source folder not found: {source}")
            return
        
        print("\n" + "="*60)
        print(f"📥 ADDING IMAGES FROM: {source}")
        print("="*60)
        
        # Find all images
        images = list(source.glob('*.jpg')) + list(source.glob('*.png'))
        
        if not images:
            print("❌ No images found in source folder!")
            return
        
        print(f"\nFound {len(images)} images")
        
        # Check for corresponding labels
        images_with_labels = []
        images_without_labels = []
        
        for img in images:
            label_file = img.with_suffix('.txt')
            if label_file.exists():
                images_with_labels.append(img)
            else:
                images_without_labels.append(img)
        
        print(f"  ✅ With labels: {len(images_with_labels)}")
        if images_without_labels:
            print(f"  ⚠️ Without labels: {len(images_without_labels)}")
            print("     (These will be skipped)")
        
        if not images_with_labels:
            print("\n❌ No images have corresponding label files!")
            print("   Make sure each image has a matching .txt file")
            return
        
        # Auto-split into train/val
        if auto_split:
            random.shuffle(images_with_labels)
            split_idx = int(len(images_with_labels) * train_ratio)
            train_images = images_with_labels[:split_idx]
            val_images = images_with_labels[split_idx:]
            
            print(f"\n📊 Split:")
            print(f"  Training: {len(train_images)} images ({train_ratio*100:.0f}%)")
            print(f"  Validation: {len(val_images)} images ({(1-train_ratio)*100:.0f}%)")
        else:
            train_images = images_with_labels
            val_images = []
        
        # Copy files
        print("\n📋 Copying files...")
        
        copied_train = self._copy_images_and_labels(train_images, 'train')
        copied_val = self._copy_images_and_labels(val_images, 'val') if val_images else 0
        
        print(f"\n✅ Done!")
        print(f"  Added {copied_train} to training set")
        print(f"  Added {copied_val} to validation set")
        
        # Show updated stats
        self.show_current_stats()
    
    def _copy_images_and_labels(self, image_files, split):
        """Copy images and their labels to dataset"""
        
        images_dir = self.dataset_path / 'images' / split
        labels_dir = self.dataset_path / 'labels' / split
        
        # Create directories if they don't exist
        images_dir.mkdir(parents=True, exist_ok=True)
        labels_dir.mkdir(parents=True, exist_ok=True)
        
        copied = 0
        
        for img_file in image_files:
            label_file = img_file.with_suffix('.txt')
            
            # Generate unique filename if exists
            img_dest = images_dir / img_file.name
            lbl_dest = labels_dir / label_file.name
            
            counter = 1
            while img_dest.exists():
                stem = img_file.stem
                ext = img_file.suffix
                img_dest = images_dir / f"{stem}_{counter}{ext}"
                lbl_dest = labels_dir / f"{stem}_{counter}.txt"
                counter += 1
            
            # Copy files
            try:
                shutil.copy2(img_file, img_dest)
                shutil.copy2(label_file, lbl_dest)
                copied += 1
            except Exception as e:
                print(f"  ⚠️ Error copying {img_file.name}: {e}")
        
        return copied
    
    def verify_dataset(self):
        """Verify dataset integrity"""
        print("\n" + "="*60)
        print("🔍 VERIFYING DATASET INTEGRITY")
        print("="*60)
        
        issues = []
        
        for split in ['train', 'val']:
            images_dir = self.dataset_path / 'images' / split
            labels_dir = self.dataset_path / 'labels' / split
            
            if not images_dir.exists() or not labels_dir.exists():
                continue
            
            print(f"\n{split.upper()} SET:")
            
            # Check for orphaned files
            images = set([f.stem for f in images_dir.glob('*.jpg')] + 
                        [f.stem for f in images_dir.glob('*.png')])
            labels = set([f.stem for f in labels_dir.glob('*.txt')])
            
            orphaned_images = images - labels
            orphaned_labels = labels - images
            
            if orphaned_images:
                print(f"  ⚠️ {len(orphaned_images)} images without labels")
                issues.append(f"{split}: {len(orphaned_images)} images without labels")
            
            if orphaned_labels:
                print(f"  ⚠️ {len(orphaned_labels)} labels without images")
                issues.append(f"{split}: {len(orphaned_labels)} labels without images")
            
            # Check label files
            empty_labels = 0
            for label_file in labels_dir.glob('*.txt'):
                if label_file.stat().st_size == 0:
                    empty_labels += 1
            
            if empty_labels:
                print(f"  ⚠️ {empty_labels} empty label files")
                issues.append(f"{split}: {empty_labels} empty label files")
            
            if not orphaned_images and not orphaned_labels and not empty_labels:
                print(f"  ✅ All good! {len(images)} matched image-label pairs")
        
        if issues:
            print(f"\n⚠️ Found {len(issues)} issue(s)")
            return False
        else:
            print(f"\n✅ Dataset is clean!")
            return True
    
    def backup_dataset(self):
        """Create a backup of current dataset"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_name = f"dataset_backup_{timestamp}"
        backup_path = self.dataset_path.parent / backup_name
        
        print(f"\n💾 Creating backup: {backup_name}")
        
        try:
            shutil.copytree(self.dataset_path, backup_path)
            print(f"✅ Backup created at: {backup_path}")
            return backup_path
        except Exception as e:
            print(f"❌ Backup failed: {e}")
            return None
    
    def show_training_history(self):
        """Show previous training runs"""
        print("\n" + "="*60)
        print("📜 TRAINING HISTORY")
        print("="*60)
        
        runs_dir = self.project_root / 'runs' / 'detect'
        
        if not runs_dir.exists():
            print("❌ No training runs found")
            return
        
        runs = sorted([d for d in runs_dir.iterdir() if d.is_dir()], 
                     key=lambda x: x.stat().st_mtime, reverse=True)
        
        for i, run in enumerate(runs[:10], 1):  # Show last 10 runs
            weights_file = run / 'weights' / 'best.pt'
            results_file = run / 'results.csv'
            
            print(f"\n{i}. {run.name}")
            print(f"   Path: {run}")
            
            if weights_file.exists():
                size_mb = weights_file.stat().st_size / (1024*1024)
                mod_time = datetime.fromtimestamp(weights_file.stat().st_mtime)
                print(f"   ✅ Model: {size_mb:.1f} MB (trained: {mod_time.strftime('%Y-%m-%d %H:%M')})")
            else:
                print(f"   ❌ No trained model found")
            
            if results_file.exists():
                print(f"   📊 Results available")

def main():
    """Interactive menu"""
    print("\n")
    print("╔═══════════════════════════════════════════════════════════╗")
    print("║                                                           ║")
    print("║           UNIFORM DATASET MANAGER                         ║")
    print("║                                                           ║")
    print("╚═══════════════════════════════════════════════════════════╝")
    
    manager = UniformDatasetManager()
    
    while True:
        print("\n" + "="*60)
        print("MENU")
        print("="*60)
        print("\n1. 📊 Show current dataset stats")
        print("2. ➕ Add new images from folder")
        print("3. 🔍 Verify dataset integrity")
        print("4. 💾 Backup dataset")
        print("5. 📜 Show training history")
        print("6. 🚀 Train new model (runs train_uniform_improved.py)")
        print("7. 📹 Test with webcam")
        print("8. ❌ Exit")
        
        choice = input("\nEnter choice (1-8): ").strip()
        
        if choice == '1':
            manager.show_current_stats()
        
        elif choice == '2':
            print("\n📁 Add new images")
            folder = input("Enter path to folder with images and labels: ").strip()
            
            if folder:
                auto = input("Auto-split into train/val? (y/n, default=y): ").strip().lower()
                auto_split = auto != 'n'
                
                if auto_split:
                    ratio = input("Training ratio (default=0.8 for 80%): ").strip()
                    train_ratio = float(ratio) if ratio else 0.8
                else:
                    train_ratio = 1.0
                
                manager.add_new_images_folder(folder, auto_split, train_ratio)
        
        elif choice == '3':
            manager.verify_dataset()
        
        elif choice == '4':
            manager.backup_dataset()
        
        elif choice == '5':
            manager.show_training_history()
        
        elif choice == '6':
            print("\n🚀 Starting training...")
            import subprocess
            subprocess.run(['python', 'train_uniform_improved.py'])
        
        elif choice == '7':
            print("\n📹 Starting webcam test...")
            import subprocess
            subprocess.run(['python', 'test_webcam_improved.py'])
        
        elif choice == '8':
            print("\n👋 Goodbye!")
            break
        
        else:
            print("❌ Invalid choice")
        
        input("\nPress Enter to continue...")

if __name__ == '__main__':
    main()