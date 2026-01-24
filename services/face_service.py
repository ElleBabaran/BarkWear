"""
Face Recognition Service using DeepFace
Much easier to install than dlib - no C++ compiler needed!
"""
from deepface import DeepFace
import numpy as np
import os
import pickle
import cv2
from backend.config import Config

class FaceRecognitionService:
    def __init__(self):
        self.known_faces = {}  # {student_id: face_embedding}
        self.encodings_folder = Config.FACE_ENCODINGS_FOLDER
        self.model_name = "Facenet512"  # Options: VGG-Face, Facenet, Facenet512, ArcFace
        self.distance_metric = "cosine"  # Options: cosine, euclidean, euclidean_l2
        self.threshold = 0.4  # Lower = more strict (Facenet512 threshold)
        self._load_all_encodings()
    
    def _load_all_encodings(self):
        """Load all saved face embeddings from disk"""
        if not os.path.exists(self.encodings_folder):
            os.makedirs(self.encodings_folder, exist_ok=True)
            return
        
        for filename in os.listdir(self.encodings_folder):
            if filename.endswith('.pkl'):
                student_id = filename.replace('.pkl', '')
                encoding_path = os.path.join(self.encodings_folder, filename)
                
                try:
                    with open(encoding_path, 'rb') as f:
                        embedding = pickle.load(f)
                        self.known_faces[student_id] = embedding
                except Exception as e:
                    print(f"Error loading encoding for {student_id}: {e}")
        
        print(f"✅ Loaded {len(self.known_faces)} face encodings")
    
    def save_face_encoding(self, student_id, image_array):
        """
        Save face embedding for a student using DeepFace
        
        Args:
            student_id: Student ID
            image_array: NumPy array of the face image (RGB or BGR)
        
        Returns:
            dict: Success status and message
        """
        try:
            # DeepFace works with both RGB and BGR, handles it automatically
            
            # Detect and extract face embedding
            result = DeepFace.represent(
                img_path=image_array,
                model_name=self.model_name,
                enforce_detection=True,
                detector_backend='opencv',  # Fast detector
                align=True
            )
            
            # DeepFace returns a list of face embeddings (one per face detected)
            if len(result) == 0:
                return {
                    'success': False,
                    'message': 'No face detected in image'
                }
            
            if len(result) > 1:
                return {
                    'success': False,
                    'message': 'Multiple faces detected. Please ensure only one face is visible.'
                }
            
            # Get the face embedding (it's a list of floats)
            face_embedding = np.array(result[0]['embedding'])
            
            # Save to disk
            encoding_path = os.path.join(self.encodings_folder, f"{student_id}.pkl")
            with open(encoding_path, 'wb') as f:
                pickle.dump(face_embedding, f)
            
            # Add to memory
            self.known_faces[student_id] = face_embedding
            
            return {
                'success': True,
                'message': 'Face encoding saved successfully',
                'encoding_path': encoding_path
            }
        
        except ValueError as e:
            # DeepFace raises ValueError when no face detected
            return {
                'success': False,
                'message': f'No face detected: {str(e)}'
            }
        
        except Exception as e:
            return {
                'success': False,
                'message': f'Error saving face encoding: {str(e)}'
            }
    
    def recognize_face(self, image_array):
        """
        Recognize a face in the given image using DeepFace
        
        Args:
            image_array: NumPy array of the image (RGB or BGR)
        
        Returns:
            dict: Recognition results
        """
        try:
            # Extract face embedding from new image
            result = DeepFace.represent(
                img_path=image_array,
                model_name=self.model_name,
                enforce_detection=True,
                detector_backend='opencv',
                align=True
            )
            
            if len(result) == 0:
                return {
                    'success': False,
                    'message': 'No face detected',
                    'student_id': None
                }
            
            # Get face embedding
            face_embedding = np.array(result[0]['embedding'])
            
            # Get face location for drawing box
            face_location = result[0]['facial_area']  # {x, y, w, h}
            
            if len(self.known_faces) == 0:
                return {
                    'success': False,
                    'message': 'No students registered yet',
                    'student_id': None
                }
            
            # Compare with all known faces
            best_match_id = None
            best_distance = float('inf')
            
            for student_id, known_embedding in self.known_faces.items():
                # Calculate distance
                if self.distance_metric == "cosine":
                    distance = self._cosine_distance(face_embedding, known_embedding)
                elif self.distance_metric == "euclidean":
                    distance = self._euclidean_distance(face_embedding, known_embedding)
                else:
                    distance = self._euclidean_l2_distance(face_embedding, known_embedding)
                
                if distance < best_distance:
                    best_distance = distance
                    best_match_id = student_id
            
            # Check if best match is below threshold
            if best_distance < self.threshold:
                confidence = 1 - best_distance  # Convert distance to confidence
                
                return {
                    'success': True,
                    'message': 'Face recognized',
                    'student_id': best_match_id,
                    'confidence': float(confidence),
                    'distance': float(best_distance),
                    'face_location': (
                        face_location['y'],
                        face_location['x'] + face_location['w'],
                        face_location['y'] + face_location['h'],
                        face_location['x']
                    )  # Convert to (top, right, bottom, left) format
                }
            else:
                return {
                    'success': False,
                    'message': f'Face not recognized (distance: {best_distance:.3f}, threshold: {self.threshold})',
                    'student_id': None
                }
        
        except ValueError as e:
            return {
                'success': False,
                'message': f'No face detected: {str(e)}',
                'student_id': None
            }
        
        except Exception as e:
            return {
                'success': False,
                'message': f'Error during recognition: {str(e)}',
                'student_id': None
            }
    
    def _cosine_distance(self, embedding1, embedding2):
        """Calculate cosine distance"""
        return 1 - np.dot(embedding1, embedding2) / (
            np.linalg.norm(embedding1) * np.linalg.norm(embedding2)
        )
    
    def _euclidean_distance(self, embedding1, embedding2):
        """Calculate euclidean distance"""
        return np.linalg.norm(embedding1 - embedding2)
    
    def _euclidean_l2_distance(self, embedding1, embedding2):
        """Calculate L2 normalized euclidean distance"""
        embedding1_normalized = embedding1 / np.linalg.norm(embedding1)
        embedding2_normalized = embedding2 / np.linalg.norm(embedding2)
        return np.linalg.norm(embedding1_normalized - embedding2_normalized)
    
    def delete_face_encoding(self, student_id):
        """Delete face encoding for a student"""
        encoding_path = os.path.join(self.encodings_folder, f"{student_id}.pkl")
        
        if os.path.exists(encoding_path):
            os.remove(encoding_path)
        
        if student_id in self.known_faces:
            del self.known_faces[student_id]
        
        return {'success': True, 'message': 'Face encoding deleted'}
    
    def verify_face(self, student_id, image_array):
        """
        Verify if image matches a specific student (1:1 verification)
        Faster than recognition when you know the student ID
        
        Args:
            student_id: Known student ID
            image_array: Image to verify
        
        Returns:
            dict: Verification result
        """
        if student_id not in self.known_faces:
            return {
                'success': False,
                'verified': False,
                'message': 'Student not found in database'
            }
        
        try:
            # Get embedding from image
            result = DeepFace.represent(
                img_path=image_array,
                model_name=self.model_name,
                enforce_detection=True,
                detector_backend='opencv'
            )
            
            if len(result) == 0:
                return {
                    'success': False,
                    'verified': False,
                    'message': 'No face detected'
                }
            
            face_embedding = np.array(result[0]['embedding'])
            known_embedding = self.known_faces[student_id]
            
            # Calculate distance
            distance = self._cosine_distance(face_embedding, known_embedding)
            
            verified = distance < self.threshold
            
            return {
                'success': True,
                'verified': verified,
                'distance': float(distance),
                'confidence': float(1 - distance),
                'message': 'Face matches' if verified else 'Face does not match'
            }
        
        except Exception as e:
            return {
                'success': False,
                'verified': False,
                'message': f'Error during verification: {str(e)}'
            }