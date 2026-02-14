"""
Dataset Diagnostic Script
Checks your uniform detection dataset for common issues
that might cause poor pants/shoes detection
"""

import os
import yaml
from pathlib import Path
import cv2
import numpy as np
from collections import defaultdict, Counter

def load_yaml_config(yaml_path='uniform_data.yaml'):
    """Load dataset configuration"""
    with open(yaml_path, 'r') as f:
        config = yaml.safe_load(f)
    return config

def analyze_annotations(dataset_path, split='train'):
    """Analyze annotation files for issues"""
    
    labels_path = Path(dataset_path) / 'labels' / split
    
    if not labels_path.exists():
        print(f"❌ Labels directory not found: {labels_path}")
        return None
    
    print(f"\n🔍 Analyzing {split} annotations...")
    
    stats = {
        'total_images': 0,
        'total_objects': 0,
        'class_counts': defaultdict(int),
        'bbox_sizes': defaultdict(list),
        'empty_images': 0,
        'images_per_class': defaultdict(set),
        'issues': []
    }
    
    class_names = {0: 'Blue Polo', 1: 'Black Pants', 2: 'ID Card'}
    
    for label_file in labels_path.glob('*.txt'):
        stats['total_images'] += 1
        
        with open(label_file, 'r') as f:
            lines = f.readlines()
        
        if not lines:
            stats['empty_images'] += 1
            continue
        
        for line in lines:
            parts = line.strip().split()
            if len(parts) < 5:
                continue
            
            cls = int(parts[0])
            x_center, y_center, width, height = map(float, parts[1:5])
            
            stats['total_objects'] += 1
            stats['class_counts'][cls] += 1
            stats['bbox_sizes'][cls].append((width, height))
            stats['images_per_class'][cls].add(label_file.stem)
            
            # Check for issues
            if width <= 0 or height <= 0:
                stats['issues'].append(f"❌ Invalid bbox in {label_file.name}: width={width}, height={height}")
            
            if width < 0.01 or height < 0.01:
                stats['issues'].append(f"⚠️ Very small bbox in {label_file.name} (class={cls}): {width:.4f}x{height:.4f}")
            
            if width > 0.95 or height > 0.95:
                stats['issues'].append(f"⚠️ Very large bbox in {label_file.name} (class={cls}): {width:.4f}x{height:.4f}")
    
    return stats, class_names

def print_statistics(stats, class_names, split='train'):
    """Print detailed statistics"""
    
    print(f"\n{'='*60}")
    print(f"📊 {split.upper()} SET STATISTICS")
    print(f"{'='*60}")
    
    print(f"\n📁 Overall:")
    print(f"   Total images: {stats['total_images']}")
    print(f"   Total objects: {stats['total_objects']}")
    print(f"   Empty images: {stats['empty_images']}")
    print(f"   Avg objects/image: {stats['total_objects']/max(stats['total_images'],1):.2f}")
    
    print(f"\n📋 Class Distribution:")
    for cls, count in sorted(stats['class_counts'].items()):
        name = class_names.get(cls, f'Class {cls}')
        img_count = len(stats['images_per_class'][cls])
        percentage = (count / stats['total_objects'] * 100) if stats['total_objects'] > 0 else 0
        print(f"   {name}:")
        print(f"      Objects: {count} ({percentage:.1f}%)")
        print(f"      Images: {img_count}")
        print(f"      Avg per image: {count/max(img_count,1):.2f}")
    
    print(f"\n📏 Bounding Box Sizes (normalized):")
    for cls, sizes in sorted(stats['bbox_sizes'].items()):
        name = class_names.get(cls, f'Class {cls}')
        widths = [s[0] for s in sizes]
        heights = [s[1] for s in sizes]
        areas = [w*h for w, h in sizes]
        
        print(f"   {name}:")
        print(f"      Width:  avg={np.mean(widths):.3f}, min={np.min(widths):.3f}, max={np.max(widths):.3f}")
        print(f"      Height: avg={np.mean(heights):.3f}, min={np.min(heights):.3f}, max={np.max(heights):.3f}")
        print(f"      Area:   avg={np.mean(areas):.3f}, min={np.min(areas):.3f}, max={np.max(areas):.3f}")
    
    if stats['issues']:
        print(f"\n⚠️ Issues Found ({len(stats['issues'])}):")
        for issue in stats['issues'][:10]:  # Show first 10
            print(f"   {issue}")
        if len(stats['issues']) > 10:
            print(f"   ... and {len(stats['issues'])-10} more")

def check_image_quality(dataset_path, split='train', sample_size=10):
    """Check image quality and resolution"""
    
    images_path = Path(dataset_path) / 'images' / split
    
    if not images_path.exists():
        print(f"❌ Images directory not found: {images_path}")
        return
    
    print(f"\n🖼️ Checking image quality...")
    
    image_files = list(images_path.glob('*.jpg')) + list(images_path.glob('*.png'))
    
    if not image_files:
        print("❌ No images found!")
        return
    
    resolutions = []
    aspects = []
    
    sample_files = image_files[:min(sample_size, len(image_files))]
    
    for img_file in sample_files:
        img = cv2.imread(str(img_file))
        if img is not None:
            h, w = img.shape[:2]
            resolutions.append((w, h))
            aspects.append(w / h)
    
    if resolutions:
        print(f"   Sample size: {len(resolutions)} images")
        widths = [r[0] for r in resolutions]
        heights = [r[1] for r in resolutions]
        print(f"   Width:  avg={np.mean(widths):.0f}px, min={np.min(widths)}px, max={np.max(widths)}px")
        print(f"   Height: avg={np.mean(heights):.0f}px, min={np.min(heights)}px, max={np.max(heights)}px")
        print(f"   Aspect ratio: avg={np.mean(aspects):.2f}")
        
        # Recommendations
        if np.min(widths) < 416 or np.min(heights) < 416:
            print(f"   ⚠️ Some images are quite small - consider using higher resolution")

def diagnose_pants_detection(stats, class_names):
    """Specific diagnostics for pants detection issues"""
    
    print(f"\n{'='*60}")
    print(f"🔍 PANTS/SHOES DETECTION DIAGNOSIS")
    print(f"{'='*60}")
    
    # Find pants class (usually class 1)
    pants_cls = 1
    pants_name = class_names.get(pants_cls, 'Unknown')
    
    if pants_cls not in stats['class_counts']:
        print(f"❌ No {pants_name} annotations found!")
        print("\n💡 Possible issues:")
        print("   1. Missing annotations for pants in your dataset")
        print("   2. Incorrect class ID in annotations")
        print("   3. Annotations file is empty or corrupted")
        return
    
    pants_count = stats['class_counts'][pants_cls]
    pants_images = len(stats['images_per_class'][pants_cls])
    total_images = stats['total_images']
    
    print(f"\n📊 {pants_name} Statistics:")
    print(f"   Total objects: {pants_count}")
    print(f"   Images with pants: {pants_images}/{total_images} ({pants_images/max(total_images,1)*100:.1f}%)")
    
    # Check bbox sizes
    if pants_cls in stats['bbox_sizes']:
        sizes = stats['bbox_sizes'][pants_cls]
        areas = [w*h for w, h in sizes]
        avg_area = np.mean(areas)
        
        print(f"   Average bbox area: {avg_area:.3f} (normalized)")
        
        if avg_area < 0.02:
            print(f"   ⚠️ Very small bboxes - pants might be too small in images")
        
        # Compare with other classes
        polo_cls = 0
        if polo_cls in stats['bbox_sizes']:
            polo_areas = [w*h for w, h in stats['bbox_sizes'][polo_cls]]
            polo_avg = np.mean(polo_areas)
            ratio = avg_area / polo_avg
            print(f"   Size compared to polo: {ratio:.2f}x")
            
            if ratio < 0.5:
                print(f"   ⚠️ Pants are much smaller than polos - might need closer shots")
    
    print(f"\n💡 Recommendations for better pants detection:")
    
    if pants_images < total_images * 0.8:
        print(f"   1. ⚠️ Only {pants_images/max(total_images,1)*100:.1f}% of images have pants")
        print(f"      → Add more full-body images showing pants")
    
    if pants_count < stats['class_counts'].get(0, 0) * 0.8:
        print(f"   2. ⚠️ Fewer pants than polo annotations")
        print(f"      → Check if pants are being missed during annotation")
    
    print(f"   3. Ensure images show full body (not just upper body)")
    print(f"   4. Include varied pants positions (sitting, standing, walking)")
    print(f"   5. Add different lighting conditions for lower body")
    print(f"   6. Include images from different camera heights/angles")

def main():
    """Run full dataset diagnosis"""
    
    print("="*60)
    print("🔍 UNIFORM DETECTION DATASET DIAGNOSTIC")
    print("="*60)
    
    # Load config
    try:
        config = load_yaml_config('uniform_data.yaml')
        dataset_path = config['path']
        print(f"\n📁 Dataset path: {dataset_path}")
    except Exception as e:
        print(f"\n❌ Error loading config: {e}")
        print("   Using default path...")
        dataset_path = 'uniform-dataset'
    
    # Analyze train set
    train_stats, class_names = analyze_annotations(dataset_path, 'train')
    if train_stats:
        print_statistics(train_stats, class_names, 'train')
        check_image_quality(dataset_path, 'train')
        diagnose_pants_detection(train_stats, class_names)
    
    # Analyze val set
    val_stats, _ = analyze_annotations(dataset_path, 'val')
    if val_stats:
        print_statistics(val_stats, class_names, 'val')
    
    print(f"\n{'='*60}")
    print("✅ Diagnosis complete!")
    print("="*60)
    
    # Summary recommendations
    print("\n📝 SUMMARY & RECOMMENDATIONS:")
    print("\nIf pants detection is poor, most common issues are:")
    print("   1. Not enough full-body images (only upper body shots)")
    print("   2. Pants bounding boxes too small or inaccurate")
    print("   3. Insufficient variety in pants appearance")
    print("   4. Poor lighting on lower body")
    print("   5. Imbalanced dataset (too many polo, not enough pants)")
    
    print("\n🎯 To improve:")
    print("   1. Re-check your annotations (are all pants labeled?)")
    print("   2. Add more full-body training images")
    print("   3. Ensure bounding boxes tightly fit the pants")
    print("   4. Include varied poses and camera angles")
    print("   5. Retrain with improved dataset using train_uniform_improved.py")

if __name__ == '__main__':
    main()