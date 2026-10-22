
"""FastAPI backend for TF-IDF → SVD → GMM predictions."""

from functools import lru_cache
from pathlib import Path
import os
import joblib

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from preprocessing import preprocess_text


# Model folder
MODEL_DIR = Path(__file__).resolve().parent / "models"


# Provisional cluster names
CLUSTER_TOPICS = {
    16: "Acknowledgments & Short Replies",
    17: "App-Related Discussions",
    8: "Language-Based Pattern",
}


# Create FastAPI app
app = FastAPI(
    title="Customer Support Intelligence API",
    version="1.0.0"
)


# Frontend URL from Render environment variable
frontend_url = os.getenv("FRONTEND_URL", "").rstrip("/")

# Allowed frontend addresses
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

if frontend_url:
    allowed_origins.append(frontend_url)


# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# Request and response models
class MessageRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


class PredictionResponse(BaseModel):
    cluster: int
    topic_name: str
    review_status: str
    confidence: float


class BatchRequest(BaseModel):
    messages: list[str] = Field(min_length=1, max_length=100)


# Load saved machine-learning models
@lru_cache(maxsize=1)
def load_models():
    vectorizer = joblib.load(
        MODEL_DIR / "tfidf_vectorizer.pkl"
    )

    svd = joblib.load(
        MODEL_DIR / "svd_100_final.pkl"
    )

    gmm = joblib.load(
        MODEL_DIR / "gmm_19_candidate.pkl"
    )

    return vectorizer, svd, gmm


# Home endpoint
@app.get("/")
def home():
    return {
        "message": "Customer Support Intelligence API",
        "docs": "/docs"
    }


# Health endpoint
@app.get("/health")
def health():
    return {"status": "ok"}


# Single-message prediction
@app.post("/predict", response_model=PredictionResponse)
def predict(request: MessageRequest):

    if not request.message.strip():
        raise HTTPException(
            status_code=422,
            detail="Message cannot be empty."
        )

    processed = preprocess_text(request.message)

    if not processed:
        raise HTTPException(
            status_code=422,
            detail="No usable text after preprocessing."
        )

    try:
        vectorizer, svd, gmm = load_models()

    except (OSError, ValueError, ImportError, AttributeError) as exc:
        raise HTTPException(
            status_code=503,
            detail="Saved models could not be loaded."
        ) from exc

    try:
        # Step 1: TF-IDF
        tfidf_features = vectorizer.transform([processed])

        # Step 2: SVD
        reduced_features = svd.transform(tfidf_features)

        # Step 3: GMM
        cluster = int(gmm.predict(reduced_features)[0])

        probability = float(
            gmm.predict_proba(reduced_features)[0, cluster]
        )

    except (ValueError, AttributeError) as exc:
        raise HTTPException(
            status_code=500,
            detail="Prediction failed. Check model compatibility."
        ) from exc

    topic = CLUSTER_TOPICS.get(
        cluster,
        "Mixed / Unclear Topic"
    )

    status = (
        "Provisional topic - needs validation"
        if cluster in CLUSTER_TOPICS
        else "Exploratory cluster"
    )

    return PredictionResponse(
        cluster=cluster,
        topic_name=topic,
        review_status=status,
        confidence=probability
    )


# CSV batch prediction
@app.post("/predict-batch")
def predict_batch(request: BatchRequest):

    results = []

    for message in request.messages:
        result = predict(
            MessageRequest(message=message)
        )

        results.append(result)

    return {
        "total": len(results),
        "results": results
    }
