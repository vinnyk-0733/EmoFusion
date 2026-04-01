import time
import numpy as np
import cv2
import matplotlib.pyplot as plt
import seaborn as sns
import os
import sys

# Define absolute paths to models
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from config import FER_MODEL_PATH, TER_MODEL_PATH, EMOTION_LABELS
from models.fer import predict_emotion as predict_fer, load_fer_model
from models.ter import predict_text_emotion as predict_ter, load_ter_model

def run_tests(num_requests=50):
    print(f"Pre-loading models from:\nFER: {FER_MODEL_PATH}\nTER: {TER_MODEL_PATH}")
    
    # Pre-load to ensure initial load time doesn't skew graphs
    load_fer_model(FER_MODEL_PATH)
    load_ter_model(TER_MODEL_PATH)
    
    print("Models loaded successfully. Generating mock inputs...")
    # Mock FER Input (random face image 48x48)
    dummy_face = np.random.randint(0, 256, (48, 48), dtype=np.uint8)
    
    # Mock TER Input
    dummy_text = "I feel like everything is going wrong today, but I am excited for tomorrow."

    fer_latencies = []
    ter_latencies = []
    
    print(f"Running {num_requests} inference loops...")
    
    for i in range(num_requests):
        print(f"Iteration {i+1}/{num_requests}", end='\r')
        # -----------------------------
        # FER TIMING
        # -----------------------------
        start_time = time.time()
        # predict_fer is synchronous
        res_fer = predict_fer(dummy_face, FER_MODEL_PATH, EMOTION_LABELS)
        fer_ms = (time.time() - start_time) * 1000
        fer_latencies.append(fer_ms)
        
        # -----------------------------
        # TER TIMING
        # -----------------------------
        start_time = time.time()
        # predict_ter is synchronous
        res_ter = predict_ter(dummy_text, TER_MODEL_PATH, EMOTION_LABELS)
        ter_ms = (time.time() - start_time) * 1000
        ter_latencies.append(ter_ms)
    
    print("\nInference complete. Generating plot...")
    
    fer_latencies = np.array(fer_latencies)
    ter_latencies = np.array(ter_latencies)
    requests = np.arange(1, num_requests + 1)
    
    # Generate Plots
    sns.set_theme(style="whitegrid")
    plt.rcParams['figure.figsize'] = (14, 6)
    
    fig, (ax1, ax2) = plt.subplots(1, 2, sharey=False)
    fig.suptitle('Actual Model Inference Latency (Parallel Processing Simulation)', fontsize=16, fontweight='bold')
    
    # --- GRAPH 1: FER Latency ---
    sns.lineplot(x=requests, y=fer_latencies, ax=ax1, color='#3498db', linewidth=2.5, marker='o')
    avg_fer = fer_latencies.mean()
    ax1.axhline(avg_fer, color='#2980b9', linestyle='--', label=f'Avg: {avg_fer:.0f}ms')
    ax1.set_title('FER (Keras CNN) Response Time', fontsize=14)
    ax1.set_xlabel('Request Number')
    ax1.set_ylabel('Latency (ms)')
    ax1.fill_between(requests, fer_latencies, alpha=0.2, color='#3498db')
    ax1.legend()
    
    # --- GRAPH 2: TER Latency ---
    sns.lineplot(x=requests, y=ter_latencies, ax=ax2, color='#e74c3c', linewidth=2.5, marker='s')
    avg_ter = ter_latencies.mean()
    ax2.axhline(avg_ter, color='#c0392b', linestyle='--', label=f'Avg: {avg_ter:.0f}ms')
    ax2.set_title('TER (DistilBERT) Response Time', fontsize=14)
    ax2.set_xlabel('Request Number')
    ax2.set_ylabel('Latency (ms)')
    ax2.fill_between(requests, ter_latencies, alpha=0.2, color='#e74c3c')
    ax2.legend()
    
    plt.tight_layout()
    output_path = os.path.join(os.path.dirname(backend_dir), 'real_latency_graph.png')
    plt.savefig(output_path, dpi=300)
    print(f"\nGraph saved to: {output_path}")

if __name__ == "__main__":
    run_tests(num_requests=50)
