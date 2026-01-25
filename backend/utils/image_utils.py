# Image Processing Utilities
# Handles image decoding, face detection, and preprocessing

import base64
import numpy as np
from typing import Optional, Tuple
import logging

logger = logging.getLogger(__name__)

# Lazy load OpenCV
_face_cascade = None

def decode_base64_image(base64_string: str) -> Optional[np.ndarray]:
    """
    Decode a base64 encoded image to numpy array
    
    Args:
        base64_string: Base64 encoded image (with or without data URI prefix)
    
    Returns:
        Numpy array of the image or None if decoding fails
    """
    try:
        import cv2
        
        # Remove data URI prefix if present
        if "," in base64_string:
            base64_string = base64_string.split(",")[1]
        
        # Decode base64
        image_bytes = base64.b64decode(base64_string)
        
        # Convert to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        
        # Decode image
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            logger.warning("Failed to decode image")
            return None
        
        return image
        
    except Exception as e:
        logger.error(f"Image decoding failed: {e}")
        return None

def load_face_cascade(cascade_path: str = None):
    """Load Haar cascade for face detection"""
    global _face_cascade
    
    if _face_cascade is None:
        import cv2
        
        if cascade_path is None:
            # Use OpenCV's built-in cascade
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        
        _face_cascade = cv2.CascadeClassifier(cascade_path)
        
        if _face_cascade.empty():
            raise ValueError(f"Failed to load cascade from {cascade_path}")
        
        logger.info("Face cascade loaded")
    
    return _face_cascade

def detect_face(image: np.ndarray) -> Optional[Tuple[int, int, int, int]]:
    """
    Detect face in image using Haar cascade
    
    Args:
        image: Input image as numpy array (BGR)
    
    Returns:
        Tuple of (x, y, width, height) for the detected face, or None
    """
    try:
        import cv2
        
        cascade = load_face_cascade()
        
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30),
            flags=cv2.CASCADE_SCALE_IMAGE
        )
        
        if len(faces) == 0:
            logger.debug("No face detected")
            return None
        
        # Return the largest face
        largest_face = max(faces, key=lambda f: f[2] * f[3])
        return tuple(largest_face)
        
    except Exception as e:
        logger.error(f"Face detection failed: {e}")
        return None

def extract_face(image: np.ndarray, face_rect: Tuple[int, int, int, int]) -> np.ndarray:
    """
    Extract face region from image
    
    Args:
        image: Input image
        face_rect: Face bounding box (x, y, w, h)
    
    Returns:
        Cropped face image
    """
    x, y, w, h = face_rect
    return image[y:y+h, x:x+w]

def process_image_for_fer(base64_image: str) -> Optional[np.ndarray]:
    """
    Complete image processing pipeline for FER
    
    Args:
        base64_image: Base64 encoded image
    
    Returns:
        Grayscale face image ready for FER model, or None if no face detected
    """
    import cv2
    
    # Decode image
    image = decode_base64_image(base64_image)
    if image is None:
        return None
    
    # Detect face
    face_rect = detect_face(image)
    if face_rect is None:
        return None
    
    # Extract and convert to grayscale
    face = extract_face(image, face_rect)
    face_gray = cv2.cvtColor(face, cv2.COLOR_BGR2GRAY)
    
    return face_gray
