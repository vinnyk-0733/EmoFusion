"""
Facial Landmark Analyzer — 68-Point LBF Model
Uses OpenCV FacemarkLBF to compute rich geometric features:
EAR, MAR, smile ratio, brow distance, brow furrow, and lip corner angle.
"""

import os
import logging
from typing import Optional, Dict
import cv2
import cv2.face
import numpy as np

from app.core.config import settings

logger = logging.getLogger(__name__)


class LBFLandmarkAnalyzer:
    """
    68-point facial landmark analyzer using OpenCV FacemarkLBF.
    Computes geometric metrics and returns emotion boost scores.
    """

    def __init__(self, model_path: Optional[str] = None):
        if model_path is None:
            model_path = settings.LBF_MODEL_PATH

        self.model_path = model_path
        self.facemark = None

        if not os.path.exists(model_path):
            logger.warning(f"LBF model not found at {model_path}. Landmark boosts disabled.")
            return

        try:
            self.facemark = cv2.face.createFacemarkLBF()
            self.facemark.loadModel(model_path)
            logger.info("LBF 68-point landmark model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load LBF model: {e}")
            self.facemark = None

        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )

    def _detect_landmarks(self, image: np.ndarray) -> Optional[np.ndarray]:
        """Detect 68 landmarks. Returns shape (68, 2) or None."""
        if self.facemark is None:
            return None

        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image

        faces = self.face_cascade.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30)
        )
        if len(faces) == 0:
            return None

        faces_arr = np.array(faces)
        ok, landmarks_list = self.facemark.fit(gray, faces_arr)
        if not ok or len(landmarks_list) == 0:
            return None

        return landmarks_list[0].reshape(68, 2)

    @staticmethod
    def _interocular_distance(pts: np.ndarray) -> float:
        """Distance between outer eye corners (points 36 & 45)."""
        d = np.linalg.norm(pts[36] - pts[45])
        return max(float(d), 1.0)

    @staticmethod
    def _eye_aspect_ratio(pts: np.ndarray) -> float:
        """Eye Aspect Ratio (EAR) for both eyes."""
        def ear_one_eye(p):
            v1 = np.linalg.norm(p[1] - p[5])
            v2 = np.linalg.norm(p[2] - p[4])
            h = np.linalg.norm(p[0] - p[3])
            return (v1 + v2) / (2.0 * max(h, 1.0))

        right_eye = pts[36:42]
        left_eye = pts[42:48]
        return float((ear_one_eye(right_eye) + ear_one_eye(left_eye)) / 2.0)

    @staticmethod
    def _mouth_aspect_ratio(pts: np.ndarray) -> float:
        """Mouth Aspect Ratio (MAR) using inner lip points."""
        v1 = np.linalg.norm(pts[61] - pts[67])
        v2 = np.linalg.norm(pts[62] - pts[66])
        v3 = np.linalg.norm(pts[63] - pts[65])
        h = np.linalg.norm(pts[60] - pts[64])
        return float((v1 + v2 + v3) / (3.0 * max(h, 1.0)))

    @staticmethod
    def _smile_ratio(pts: np.ndarray, iod: float) -> float:
        """Normalized mouth width + lip corner upward curvature."""
        mouth_width = np.linalg.norm(pts[48] - pts[54])
        normalized_width = mouth_width / iod

        corner_avg_y = (pts[48][1] + pts[54][1]) / 2.0
        center_y = pts[62][1]
        corner_lift = (center_y - corner_avg_y) / iod

        return float(normalized_width + corner_lift)

    @staticmethod
    def _brow_eye_distance(pts: np.ndarray, iod: float) -> float:
        """Average distance from brow to eye, normalized by IOD."""
        right_brow_center = pts[19]
        right_eye_center = (pts[37] + pts[38] + pts[40] + pts[41]) / 4.0
        d_right = np.linalg.norm(right_brow_center - right_eye_center)

        left_brow_center = pts[24]
        left_eye_center = (pts[43] + pts[44] + pts[46] + pts[47]) / 4.0
        d_left = np.linalg.norm(left_brow_center - left_eye_center)

        return float(((d_right + d_left) / 2.0) / iod)

    @staticmethod
    def _brow_furrow(pts: np.ndarray, iod: float) -> float:
        """Distance between inner brow points (21, 22) normalized by IOD."""
        return float(np.linalg.norm(pts[21] - pts[22]) / iod)

    @staticmethod
    def _lip_corner_angle(pts: np.ndarray) -> float:
        """Lip corner height relative to lower lip center."""
        left_corner = pts[48]
        right_corner = pts[54]
        mid_bottom = pts[57]

        corner_avg_y = (left_corner[1] + right_corner[1]) / 2.0
        return float(mid_bottom[1] - corner_avg_y)

    def analyze(self, image: np.ndarray) -> Optional[Dict[str, float]]:
        """Analyze facial landmarks and return emotion boost scores."""
        if image is None or image.size == 0:
            return None

        h, w = image.shape[:2]
        if h < 60 or w < 60:
            return None

        pts = self._detect_landmarks(image)
        if pts is None:
            return None

        iod = self._interocular_distance(pts)
        if iod < 5:
            return None

        ear = self._eye_aspect_ratio(pts)
        mar = self._mouth_aspect_ratio(pts)
        smile = self._smile_ratio(pts, iod)
        brow_dist = self._brow_eye_distance(pts, iod)
        furrow = self._brow_furrow(pts, iod)
        lip_angle = self._lip_corner_angle(pts)

        boosts: Dict[str, float] = {}

        # HAPPY
        if smile > 0.95 and lip_angle > 3.0 and mar < 0.6:
            confidence = float(min(1.0, 0.5 + (smile - 0.95) * 2.0 + (lip_angle - 3.0) * 0.05))
            boosts['happy'] = int(confidence * 1000) / 1000

        # SURPRISE
        if ear > 0.30 and mar > 0.5 and brow_dist > 0.28:
            confidence = float(min(1.0, 0.5 + (ear - 0.30) * 3.0 + (mar - 0.5) * 1.0))
            boosts['surprise'] = int(confidence * 1000) / 1000

        # ANGRY
        if brow_dist < 0.20 and furrow < 0.12 and mar < 0.25:
            confidence = float(min(1.0, 0.5 + (0.20 - brow_dist) * 5.0 + (0.12 - furrow) * 3.0))
            boosts['angry'] = int(confidence * 1000) / 1000

        # SAD
        if lip_angle < -2.0 and brow_dist < 0.24:
            confidence = float(min(1.0, 0.5 + abs(lip_angle + 2.0) * 0.05 + (0.24 - brow_dist) * 3.0))
            boosts['sad'] = int(confidence * 1000) / 1000

        # FEAR
        if ear > 0.28 and brow_dist > 0.26 and 0.15 < mar < 0.45 and furrow < 0.14:
            confidence = float(min(1.0, 0.5 + (ear - 0.28) * 3.0 + (brow_dist - 0.26) * 3.0))
            boosts['fear'] = int(confidence * 1000) / 1000

        # NEUTRAL
        is_neutral = (
            0.20 <= ear <= 0.32 and
            mar < 0.3 and
            0.20 <= brow_dist <= 0.30 and
            abs(lip_angle) < 3.0 and
            furrow > 0.10
        )
        if is_neutral and len(boosts) == 0:
            boosts['neutral'] = 0.6

        return boosts if boosts else None


landmark_analyzer = LBFLandmarkAnalyzer()

