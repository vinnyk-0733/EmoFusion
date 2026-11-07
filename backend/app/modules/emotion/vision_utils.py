"""
Vision Utilities
Handles base64 decoding, face detection with Haar cascade, and facial image extraction.
"""

import base64
import logging
from typing import Optional, Tuple
import cv2
import numpy as np

logger = logging.getLogger(__name__)

_face_cascade = None


def decode_base64_image(base64_string: str) -> Optional[np.ndarray]:
    """Decode a base64 encoded image to a numpy BGR image array."""
    try:
        if "," in base64_string:
            base64_string = base64_string.split(",")[1]

        image_bytes = base64.b64decode(base64_string)
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if image is None:
            logger.warning("Failed to decode image from base64")
            return None

        return image
    except Exception as e:
        logger.error(f"Image decoding failed: {e}")
        return None


def get_face_cascade(cascade_path: Optional[str] = None) -> cv2.CascadeClassifier:
    """Load and cache the OpenCV Haar cascade classifier for frontal faces."""
    global _face_cascade
    if _face_cascade is None:
        if cascade_path is None:
            cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        _face_cascade = cv2.CascadeClassifier(cascade_path)
        if _face_cascade.empty():
            raise ValueError(f"Failed to load Haar cascade from {cascade_path}")
        logger.info("Frontal face Haar cascade loaded successfully")
    return _face_cascade


def detect_face(image: np.ndarray) -> Optional[Tuple[int, int, int, int]]:
    """Detect the largest face in an image using Haar cascade."""
    try:
        cascade = get_face_cascade()
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        faces = cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30),
            flags=cv2.CASCADE_SCALE_IMAGE
        )

        if len(faces) == 0:
            return None

        largest_face = max(faces, key=lambda f: f[2] * f[3])
        return tuple(largest_face)
    except Exception as e:
        logger.error(f"Face detection failed: {e}")
        return None


def extract_face(image: np.ndarray, face_rect: Tuple[int, int, int, int]) -> np.ndarray:
    """Crop the face region given bounding box (x, y, w, h)."""
    x, y, w, h = face_rect
    return image[y:y + h, x:x + w]


def process_image_for_fer(base64_image: str) -> Optional[np.ndarray]:
    """Decode base64 image, detect face, and return 48x48-ready grayscale face image."""
    image = decode_base64_image(base64_image)
    if image is None:
        return None

    face_rect = detect_face(image)
    if face_rect is None:
        return None

    face = extract_face(image, face_rect)
    face_gray = cv2.cvtColor(face, cv2.COLOR_BGR2GRAY)
    return face_gray

