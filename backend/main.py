"""
AI-Powered Decision Support System for Forest Rights Act (FRA) Monitoring
Backend API - FastAPI + Gemini AI + GeoJSON In-Memory Spatial Data
"""

import os
import random
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure Google Generative AI (Gemini)
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    genai = None
    GEMINI_AVAILABLE = False

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

if GEMINI_AVAILABLE and GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    print("✅ Google Generative AI configured with API key.")
else:
    print("⚠️ GEMINI_API_KEY not found or google-generativeai not installed. Fallback analyzer will be used.")

# Initialize FastAPI App
app = FastAPI(
    title="FRA Monitoring Decision Support System API",
    description="AI-powered GeoJSON backend for Forest Rights Act claim monitoring and anomaly detection.",
    version="1.0.0"
)

# Enable CORS for Frontend (Vite, Next.js, Create React App, localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================================
# IN-MEMORY MOCK GEOJSON DATA SETUP
# Central India Districts (Madhya Pradesh tribal belt)
# =====================================================================

MOCK_DISTRICTS: Dict[str, Dict[str, Any]] = {
    "DIST_001": {
        "district_id": "DIST_001",
        "name": "Dindori",
        "state": "Madhya Pradesh",
        "tribal_population_pct": 64.7,
        "coordinates": [
            [
                [80.70, 22.70],
                [81.40, 22.70],
                [81.55, 23.20],
                [80.85, 23.35],
                [80.50, 23.00],
                [80.70, 22.70]
            ]
        ]
    },
    "DIST_002": {
        "district_id": "DIST_002",
        "name": "Mandla",
        "state": "Madhya Pradesh",
        "tribal_population_pct": 57.9,
        "coordinates": [
            [
                [79.95, 22.35],
                [80.70, 22.30],
                [80.85, 22.85],
                [80.15, 23.05],
                [79.80, 22.70],
                [79.95, 22.35]
            ]
        ]
    },
    "DIST_003": {
        "district_id": "DIST_003",
        "name": "Balaghat",
        "state": "Madhya Pradesh",
        "tribal_population_pct": 53.2,
        "coordinates": [
            [
                [79.70, 21.50],
                [80.60, 21.45],
                [80.75, 22.15],
                [80.05, 22.25],
                [79.60, 21.85],
                [79.70, 21.50]
            ]
        ]
    }
}

# 30 Mock FRA Claim Points scattered across the 3 districts
# DIST_001 (Dindori) is intentionally heavily skewed with pending claims & high days_pending (Anomaly)
MOCK_CLAIMS: List[Dict[str, Any]] = [
    # -------------------------------------------------------------
    # District 1: Dindori (ANOMALY: 8 Pending, high delay 180-410 days)
    # -------------------------------------------------------------
    {"claim_id": "CLM-DIN-001", "district_id": "DIST_001", "status": "pending", "days_pending": 342, "type": "individual", "lon": 81.02, "lat": 22.92, "area_ha": 2.4},
    {"claim_id": "CLM-DIN-002", "district_id": "DIST_001", "status": "pending", "days_pending": 298, "type": "community",  "lon": 81.15, "lat": 23.05, "area_ha": 18.5},
    {"claim_id": "CLM-DIN-003", "district_id": "DIST_001", "status": "pending", "days_pending": 410, "type": "individual", "lon": 80.88, "lat": 22.84, "area_ha": 1.8},
    {"claim_id": "CLM-DIN-004", "district_id": "DIST_001", "status": "pending", "days_pending": 265, "type": "individual", "lon": 81.25, "lat": 22.98, "area_ha": 3.1},
    {"claim_id": "CLM-DIN-005", "district_id": "DIST_001", "status": "approved", "days_pending": 45,  "type": "individual", "lon": 80.75, "lat": 22.78, "area_ha": 2.0},
    {"claim_id": "CLM-DIN-006", "district_id": "DIST_001", "status": "pending", "days_pending": 380, "type": "community",  "lon": 81.30, "lat": 23.12, "area_ha": 24.0},
    {"claim_id": "CLM-DIN-007", "district_id": "DIST_001", "status": "pending", "days_pending": 315, "type": "individual", "lon": 80.95, "lat": 23.18, "area_ha": 1.5},
    {"claim_id": "CLM-DIN-008", "district_id": "DIST_001", "status": "pending", "days_pending": 290, "type": "individual", "lon": 81.08, "lat": 22.80, "area_ha": 2.7},
    {"claim_id": "CLM-DIN-009", "district_id": "DIST_001", "status": "rejected", "days_pending": 180, "type": "individual", "lon": 80.82, "lat": 23.02, "area_ha": 1.2},
    {"claim_id": "CLM-DIN-010", "district_id": "DIST_001", "status": "pending", "days_pending": 365, "type": "community",  "lon": 81.38, "lat": 22.89, "area_ha": 15.0},

    # -------------------------------------------------------------
    # District 2: Mandla (Healthy District: 7 Approved, 2 Pending, 1 Rejected)
    # -------------------------------------------------------------
    {"claim_id": "CLM-MAN-001", "district_id": "DIST_002", "status": "approved", "days_pending": 28,  "type": "individual", "lon": 80.35, "lat": 22.60, "area_ha": 2.1},
    {"claim_id": "CLM-MAN-002", "district_id": "DIST_002", "status": "approved", "days_pending": 35,  "type": "community",  "lon": 80.48, "lat": 22.72, "area_ha": 22.0},
    {"claim_id": "CLM-MAN-003", "district_id": "DIST_002", "status": "pending",  "days_pending": 54,  "type": "individual", "lon": 80.20, "lat": 22.48, "area_ha": 1.9},
    {"claim_id": "CLM-MAN-004", "district_id": "DIST_002", "status": "approved", "days_pending": 40,  "type": "individual", "lon": 80.60, "lat": 22.55, "area_ha": 2.8},
    {"claim_id": "CLM-MAN-005", "district_id": "DIST_002", "status": "approved", "days_pending": 22,  "type": "individual", "lon": 80.10, "lat": 22.75, "area_ha": 1.4},
    {"claim_id": "CLM-MAN-006", "district_id": "DIST_002", "status": "rejected", "days_pending": 60,  "type": "individual", "lon": 80.52, "lat": 22.80, "area_ha": 3.0},
    {"claim_id": "CLM-MAN-007", "district_id": "DIST_002", "status": "approved", "days_pending": 31,  "type": "community",  "lon": 80.25, "lat": 22.90, "area_ha": 30.5},
    {"claim_id": "CLM-MAN-008", "district_id": "DIST_002", "status": "approved", "days_pending": 48,  "type": "individual", "lon": 80.68, "lat": 22.40, "area_ha": 2.3},
    {"claim_id": "CLM-MAN-009", "district_id": "DIST_002", "status": "pending",  "days_pending": 62,  "type": "individual", "lon": 80.40, "lat": 22.68, "area_ha": 1.7},
    {"claim_id": "CLM-MAN-010", "district_id": "DIST_002", "status": "approved", "days_pending": 19,  "type": "individual", "lon": 80.15, "lat": 22.58, "area_ha": 2.5},

    # -------------------------------------------------------------
    # District 3: Balaghat (Balanced District: 5 Approved, 3 Pending, 2 Rejected)
    # -------------------------------------------------------------
    {"claim_id": "CLM-BAL-001", "district_id": "DIST_003", "status": "approved", "days_pending": 45,  "type": "individual", "lon": 80.18, "lat": 21.82, "area_ha": 2.2},
    {"claim_id": "CLM-BAL-002", "district_id": "DIST_003", "status": "pending",  "days_pending": 95,  "type": "individual", "lon": 80.32, "lat": 21.95, "area_ha": 1.6},
    {"claim_id": "CLM-BAL-003", "district_id": "DIST_003", "status": "approved", "days_pending": 50,  "type": "community",  "lon": 80.45, "lat": 21.75, "area_ha": 16.0},
    {"claim_id": "CLM-BAL-004", "district_id": "DIST_003", "status": "rejected", "days_pending": 110, "type": "individual", "lon": 79.95, "lat": 21.65, "area_ha": 1.1},
    {"claim_id": "CLM-BAL-005", "district_id": "DIST_003", "status": "approved", "days_pending": 38,  "type": "individual", "lon": 80.25, "lat": 22.05, "area_ha": 3.4},
    {"claim_id": "CLM-BAL-006", "district_id": "DIST_003", "status": "pending",  "days_pending": 85,  "type": "community",  "lon": 80.55, "lat": 21.88, "area_ha": 20.2},
    {"claim_id": "CLM-BAL-007", "district_id": "DIST_003", "status": "rejected", "days_pending": 125, "type": "individual", "lon": 79.85, "lat": 21.90, "area_ha": 1.5},
    {"claim_id": "CLM-BAL-008", "district_id": "DIST_003", "status": "approved", "days_pending": 42,  "type": "individual", "lon": 80.10, "lat": 21.70, "area_ha": 2.0},
    {"claim_id": "CLM-BAL-009", "district_id": "DIST_003", "status": "pending",  "days_pending": 78,  "type": "individual", "lon": 80.38, "lat": 22.10, "area_ha": 1.8},
    {"claim_id": "CLM-BAL-010", "district_id": "DIST_003", "status": "approved", "days_pending": 55,  "type": "individual", "lon": 80.02, "lat": 21.98, "area_ha": 2.6},
]


# =====================================================================
# HELPER FUNCTIONS & AI PROMPT BUILDER
# =====================================================================

def calculate_district_statistics(district_id: str, claims: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Calculate summary metrics for a set of claims in a district."""
    total = len(claims)
    if total == 0:
        return {
            "total_claims": 0,
            "pending_count": 0,
            "pending_percentage": 0.0,
            "approved_count": 0,
            "approved_percentage": 0.0,
            "rejected_count": 0,
            "rejected_percentage": 0.0,
            "avg_days_pending": 0.0,
            "community_claims": 0,
            "individual_claims": 0
        }

    pending_claims = [c for c in claims if c["status"] == "pending"]
    approved_claims = [c for c in claims if c["status"] == "approved"]
    rejected_claims = [c for c in claims if c["status"] == "rejected"]

    avg_days_pending = (
        sum(c["days_pending"] for c in pending_claims) / len(pending_claims)
        if pending_claims else 0.0
    )

    return {
        "total_claims": total,
        "pending_count": len(pending_claims),
        "pending_percentage": round((len(pending_claims) / total) * 100, 1),
        "approved_count": len(approved_claims),
        "approved_percentage": round((len(approved_claims) / total) * 100, 1),
        "rejected_count": len(rejected_claims),
        "rejected_percentage": round((len(rejected_claims) / total) * 100, 1),
        "avg_days_pending": round(avg_days_pending, 1),
        "community_claims": len([c for c in claims if c["type"] == "community"]),
        "individual_claims": len([c for c in claims if c["type"] == "individual"]),
    }


def generate_fallback_analysis(district_name: str, stats: Dict[str, Any]) -> str:
    """
    Deterministic rule-based fallback if Gemini API is unreachable or key is unset.
    Guarantees the hackathon demo remains 100% resilient.
    """
    if stats["pending_percentage"] >= 60.0 or stats["avg_days_pending"] > 180:
        return (
            f"Analysis of {district_name} District reveals a critical bottleneck with {stats['pending_percentage']}% "
            f"of claims currently pending and an alarming average delay of {stats['avg_days_pending']} days. "
            f"This indicates significant administrative stagnation at the Sub-Divisional Level Committee (SDLC) stage, "
            f"requiring prioritized verification triage to protect tribal land tenure."
        )
    elif stats["approved_percentage"] >= 60.0:
        return (
            f"{district_name} District demonstrates a healthy FRA implementation trajectory, achieving an "
            f"{stats['approved_percentage']}% title distribution rate with low processing lag ({stats['avg_days_pending']} days avg). "
            f"Current operational workflows show consistent progress in titling both individual and community forest rights."
        )
    else:
        return (
            f"{district_name} District maintains moderate FRA processing throughput, recording {stats['approved_percentage']}% approvals "
            f"alongside a {stats['pending_percentage']}% pending queue averaging {stats['avg_days_pending']} days. "
            f"Targeted coordination between Revenue and Forest departments could expedite remaining claims."
        )


# =====================================================================
# API ENDPOINTS
# =====================================================================

@app.get("/")
def root():
    """Health check and API overview."""
    return {
        "service": "AI-Powered FRA Monitoring Decision Support System",
        "status": "online",
        "endpoints": {
            "districts": "/api/districts",
            "claims": "/api/claims/{district_id}",
            "analyze": "/api/analyze/{district_id} (POST)"
        },
        "gemini_configured": bool(GEMINI_AVAILABLE and GEMINI_API_KEY)
    }


@app.get("/api/districts")
def get_districts():
    """
    Returns a GeoJSON FeatureCollection of the 3 district boundary polygons.
    """
    features = []
    for dist_id, dist_info in MOCK_DISTRICTS.items():
        feature = {
            "type": "Feature",
            "properties": {
                "district_id": dist_info["district_id"],
                "name": dist_info["name"],
                "state": dist_info["state"],
                "tribal_population_pct": dist_info["tribal_population_pct"]
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": dist_info["coordinates"]
            }
        }
        features.append(feature)

    return {
        "type": "FeatureCollection",
        "features": features
    }


@app.get("/api/claims/{district_id}")
def get_claims_by_district(district_id: str):
    """
    Returns a GeoJSON FeatureCollection of claim points belonging only to the requested district.
    """
    if district_id not in MOCK_DISTRICTS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"District '{district_id}' not found. Available IDs: {list(MOCK_DISTRICTS.keys())}"
        )

    # Filter claims for the specific district
    district_claims = [c for c in MOCK_CLAIMS if c["district_id"] == district_id]

    features = []
    for claim in district_claims:
        feature = {
            "type": "Feature",
            "properties": {
                "claim_id": claim["claim_id"],
                "district_id": claim["district_id"],
                "status": claim["status"],
                "days_pending": claim["days_pending"],
                "type": claim["type"],
                "area_ha": claim.get("area_ha", 1.0)
            },
            "geometry": {
                "type": "Point",
                "coordinates": [claim["lon"], claim["lat"]]
            }
        }
        features.append(feature)

    return {
        "type": "FeatureCollection",
        "district_id": district_id,
        "district_name": MOCK_DISTRICTS[district_id]["name"],
        "total_features": len(features),
        "features": features
    }


@app.post("/api/analyze/{district_id}")
def analyze_district(district_id: str):
    """
    Core AI Endpoint:
    1. Filters claims for the district_id.
    2. Calculates summary statistics (total claims, % pending, % rejected, avg days pending).
    3. Injects statistics into a structured prompt with system context.
    4. Calls the Gemini API (google-generativeai) for a 2-3 sentence official decision support report.
    5. Returns the text response to the frontend along with summary metrics.
    """
    if district_id not in MOCK_DISTRICTS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"District '{district_id}' not found. Available IDs: {list(MOCK_DISTRICTS.keys())}"
        )

    district_info = MOCK_DISTRICTS[district_id]
    district_name = district_info["name"]

    # 1. Filter claims
    district_claims = [c for c in MOCK_CLAIMS if c["district_id"] == district_id]

    # 2. Calculate summary statistics
    stats = calculate_district_statistics(district_id, district_claims)

    # 3. Construct the prompt injecting statistics and system context
    system_context = (
        "You are a senior data analyst for the Ministry of Tribal Affairs. "
        "I will provide you with FRA claim statistics for a specific district. "
        "Write a concise, 2-3 sentence decision-support summary highlighting any bottlenecks or anomalies in the data. "
        "Be objective and professional. Do not prescribe legal action."
    )

    user_prompt = (
        f"{system_context}\n\n"
        f"District: {district_name} (ID: {district_id}, State: {district_info['state']})\n"
        f"- Total Claims: {stats['total_claims']}\n"
        f"- Pending Claims: {stats['pending_count']} ({stats['pending_percentage']}%)\n"
        f"- Approved Claims: {stats['approved_count']} ({stats['approved_percentage']}%)\n"
        f"- Rejected Claims: {stats['rejected_count']} ({stats['rejected_percentage']}%)\n"
        f"- Average Days Pending: {stats['avg_days_pending']} days\n"
        f"- Community Forest Rights (CFR) Claims: {stats['community_claims']}\n"
        f"- Individual Forest Rights (IFR) Claims: {stats['individual_claims']}\n\n"
        f"Provide your 2-3 sentence executive decision-support summary now:"
    )

    # 4. Call Gemini API or use resilient fallback
    report_text = ""
    ai_engine = "Gemini-1.5-Flash"

    if GEMINI_AVAILABLE and GEMINI_API_KEY:
        try:
            # Try gemini-1.5-flash first, then fallback to gemini-pro if needed
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(user_prompt)
            if response and response.text:
                report_text = response.text.strip()
            else:
                report_text = generate_fallback_analysis(district_name, stats)
                ai_engine = "Fallback Rules Engine (Empty Gemini Response)"
        except Exception as e:
            print(f"⚠️ Gemini API Call encountered an issue: {e}")
            try:
                # Secondary model attempt
                model_alt = genai.GenerativeModel("gemini-pro")
                response_alt = model_alt.generate_content(user_prompt)
                report_text = response_alt.text.strip()
                ai_engine = "Gemini-Pro"
            except Exception as e2:
                print(f"⚠️ Secondary model attempt failed: {e2}. Using intelligent fallback.")
                report_text = generate_fallback_analysis(district_name, stats)
                ai_engine = "Internal Decision Support Engine"
    else:
        report_text = generate_fallback_analysis(district_name, stats)
        ai_engine = "Internal Decision Support Engine (Set GEMINI_API_KEY to activate live Gemini)"

    # 5. Return complete structured response to frontend
    return {
        "district_id": district_id,
        "district_name": district_name,
        "state": district_info["state"],
        "statistics": stats,
        "ai_anomaly_report": report_text,
        "ai_engine": ai_engine
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
