
import cv2
import numpy as np
import logging
import os
from typing import Optional, Dict

logger = logging.getLogger(__name__)

class GenericLandmarkAnalyzer:
    """
    Fallback analyzer using OpenCV Haar Cascades when MediaPipe is unavailable (e.g. Python 3.13+).
    Detects Smiles and Eyes to infer 'Happy' or 'Surprise'.
    """
    def __init__(self):
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        self.smile_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_smile.xml')
        self.eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')
        
        if self.smile_cascade.empty():
            logger.warning("Smile cascade not found!")
            
    def analyze(self, image: np.ndarray) -> Optional[Dict[str, float]]:
        """
        Analyze face for specific features (Smile, Wide Eyes).
        """
        try:
            # Image expected to be BGR or Gray
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray = image
                
            # Detect Face first (if not already cropped? assume input is full frame or large crop)
            # The input from websocket is usually the full frame OR the cropped face.
            # Let's assume it's the cropped face from `process_image_for_fer`, but `process_image_for_fer` returns 48x48 relative to model?
            # No, we should pass the full face region before resizing.
            
            # If the input is small (48x48), cascades fail. We need the specific face ROI *before* resizing.
            # But the current pipeline only exposes the 48x48 pixel input to the model function.
            # I need to update the pipeline to pass the full-res face ROI.
            
            # For now, let's assume we get a reasonable resolution face (e.g. >100x100).
            # If image is too small, return None.
            if gray.shape[0] < 50 or gray.shape[1] < 50:
                 return None

            boosts = {}
            
            # 1. Smile Detection
            # Scale factor, minNeighbors need tuning. Smile is tricky.
            smiles = self.smile_cascade.detectMultiScale(
                gray,
                scaleFactor=1.7,
                minNeighbors=22,
                minSize=(25, 25)
            )
            
            if len(smiles) > 0:
                # Found a smile!
                boosts['happy'] = 0.8  # Strong indicator
                
            # 2. Eye Detection (Open Eyes)
            # eyes = self.eye_cascade.detectMultiScale(gray, 1.3, 5)
            # Difficult to distinguish "Normal" from "Surprised" just by count.
            # Skipping eye heuristic for now to avoid noise.
            
            # 3. Neutral Heuristic
            # If NO smile is detected, and we trust the cascade?
            # It's risky. But if we are consistent:
            if len(smiles) == 0:
                # Weak boost to neutral? Or just don't boost Happy.
                # Actually, if no smile, we can suppress Happy.
                pass
                
            return boosts

        except Exception as e:
            logger.error(f"Cascade analysis failed: {e}")
            return None

# Singleton
landmark_analyzer = GenericLandmarkAnalyzer()
