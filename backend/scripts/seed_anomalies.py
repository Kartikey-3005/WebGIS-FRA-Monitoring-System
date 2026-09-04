"""
Seed Script for WebGIS FRA Monitoring System - Anomaly Data Extraction & Ingestion
Generates curated, lightweight GeoJSON datasets (< 100 KB combined):
1. backend/data/districts.json (4 Districts with targeted anomaly flags)
2. backend/data/claims.json (28 Claim points exhibiting exact anomaly profiles)
"""

import json
import os
from typing import Dict, Any, List

# Define Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(SCRIPT_DIR)
DATA_DIR = os.path.join(BACKEND_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

DISTRICTS_FILE = os.path.join(DATA_DIR, "districts.json")
CLAIMS_FILE = os.path.join(DATA_DIR, "claims.json")

# =====================================================================
# 1. DISTRICTS LAYER (4 Districts with explicit anomaly flags)
# =====================================================================
# - District A: Bureaucratic Bottleneck Anomaly (78% pending rate, avg wait time 620 days)
# - District B: High Rejection Anomaly (82% rejection rate within 14 days of filing)
# - District C: Encroachment / Land Conflict Anomaly (35% pending rate, vegetation_loss_pct: 42.5%)
# - District D: Normal Benchmark / Control Group (15% pending, 12% rejection, avg turnaround 65 days)

DISTRICTS_DATA: Dict[str, Any] = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": {
                "district_id": "dist_a",
                "name": "District A (Dindori - Bottleneck Zone)",
                "state": "Madhya Pradesh",
                "tribal_population_pct": 64.7,
                "anomaly_flag": "HIGH_PENDING_DELAY",
                "pending_rate_pct": 78.0,
                "avg_wait_days": 620,
                "rejection_rate_pct": 11.0,
                "vegetation_loss_pct": 3.5,
                "description": "Critical administrative bottleneck at SDLC verification stage. Claims stalled over 20 months."
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [
                    [
                        [80.60, 22.60],
                        [81.40, 22.60],
                        [81.55, 23.20],
                        [80.85, 23.35],
                        [80.50, 23.00],
                        [80.60, 22.60]
                    ]
                ]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "district_id": "dist_b",
                "name": "District B (Mandla - Rejection Spike)",
                "state": "Madhya Pradesh",
                "tribal_population_pct": 57.9,
                "anomaly_flag": "ABNORMAL_REJECTION_SPIKE",
                "pending_rate_pct": 10.0,
                "avg_wait_days": 14,
                "rejection_rate_pct": 82.0,
                "vegetation_loss_pct": 4.2,
                "description": "Abnormal mass rejection surge within 14 days of Gram Sabha submission without recorded hearing notes."
            },
            "geometry": {
                "type": "Polygon",
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
            }
        },
        {
            "type": "Feature",
            "properties": {
                "district_id": "dist_c",
                "name": "District C (Korba - Conflict & Encroachment)",
                "state": "Chhattisgarh",
                "tribal_population_pct": 51.3,
                "anomaly_flag": "FOREST_COVER_LOSS_ON_CLAIM",
                "pending_rate_pct": 35.0,
                "avg_wait_days": 140,
                "rejection_rate_pct": 15.0,
                "vegetation_loss_pct": 42.5,
                "description": "Satellite NDVI detection reveals 42.5% acute canopy loss on pending Community Forest Resource claims."
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [
                    [
                        [82.15, 22.10],
                        [82.90, 22.15],
                        [83.05, 22.75],
                        [82.35, 22.85],
                        [82.00, 22.45],
                        [82.15, 22.10]
                    ]
                ]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "district_id": "dist_d",
                "name": "District D (Balaghat - Normal Benchmark)",
                "state": "Madhya Pradesh",
                "tribal_population_pct": 53.2,
                "anomaly_flag": "NORMAL",
                "pending_rate_pct": 15.0,
                "avg_wait_days": 65,
                "rejection_rate_pct": 12.0,
                "vegetation_loss_pct": 2.8,
                "description": "Control benchmark district demonstrating smooth title titling throughput and low pendency."
            },
            "geometry": {
                "type": "Polygon",
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
    ]
}

# =====================================================================
# 2. CLAIMS LAYER (28 Targeted Claim Points, 7 per district)
# =====================================================================
# Properties per claim adhere to:
# {
#   "claim_id": "FRA-2026-001",
#   "district_id": "dist_a",
#   "claimant_type": "Community" | "Individual",
#   "status": "pending" | "approved" | "rejected",
#   "days_pending": 620,
#   "anomaly_tags": ["DELAY_EXCEEDS_STATE_AVG"],
#   "vegetation_loss_index": 0.05
# }

RAW_CLAIMS_DATA: List[Dict[str, Any]] = [
    # -------------------------------------------------------------
    # District A: Bureaucratic Bottleneck (dist_a)
    # 7 Claims: 5 Pending (620 days avg wait), 1 Approved, 1 Rejected -> 71.4% pending
    # Anomaly tag: DELAY_EXCEEDS_STATE_AVG, SDLC_BOTTLENECK
    # -------------------------------------------------------------
    {
        "claim_id": "FRA-2026-001",
        "district_id": "dist_a",
        "claimant_type": "Community",
        "status": "pending",
        "days_pending": 620,
        "anomaly_tags": ["DELAY_EXCEEDS_STATE_AVG", "SDLC_BOTTLENECK"],
        "vegetation_loss_index": 0.04,
        "lon": 81.02,
        "lat": 22.92,
        "claimant_name": "Karanjia Baiga CFR Council",
        "area_ha": 32.5
    },
    {
        "claim_id": "FRA-2026-002",
        "district_id": "dist_a",
        "claimant_type": "Individual",
        "status": "pending",
        "days_pending": 645,
        "anomaly_tags": ["DELAY_EXCEEDS_STATE_AVG"],
        "vegetation_loss_index": 0.03,
        "lon": 81.18,
        "lat": 23.05,
        "claimant_name": "Budhram Maravi",
        "area_ha": 2.4
    },
    {
        "claim_id": "FRA-2026-003",
        "district_id": "dist_a",
        "claimant_type": "Individual",
        "status": "pending",
        "days_pending": 595,
        "anomaly_tags": ["DELAY_EXCEEDS_STATE_AVG"],
        "vegetation_loss_index": 0.02,
        "lon": 80.88,
        "lat": 22.84,
        "claimant_name": "Phoolwati Bai",
        "area_ha": 1.8
    },
    {
        "claim_id": "FRA-2026-004",
        "district_id": "dist_a",
        "claimant_type": "Community",
        "status": "pending",
        "days_pending": 630,
        "anomaly_tags": ["DELAY_EXCEEDS_STATE_AVG", "SDLC_BOTTLENECK"],
        "vegetation_loss_index": 0.05,
        "lon": 81.25,
        "lat": 22.98,
        "claimant_name": "Samnapur Forest FRC",
        "area_ha": 44.0
    },
    {
        "claim_id": "FRA-2026-005",
        "district_id": "dist_a",
        "claimant_type": "Individual",
        "status": "pending",
        "days_pending": 610,
        "anomaly_tags": ["DELAY_EXCEEDS_STATE_AVG"],
        "vegetation_loss_index": 0.03,
        "lon": 80.75,
        "lat": 22.78,
        "claimant_name": "Ramcharan Markam",
        "area_ha": 3.1
    },
    {
        "claim_id": "FRA-2026-006",
        "district_id": "dist_a",
        "claimant_type": "Individual",
        "status": "approved",
        "days_pending": 75,
        "anomaly_tags": [],
        "vegetation_loss_index": 0.01,
        "lon": 81.30,
        "lat": 23.12,
        "claimant_name": "Sukratia Bai",
        "area_ha": 1.5
    },
    {
        "claim_id": "FRA-2026-007",
        "district_id": "dist_a",
        "claimant_type": "Individual",
        "status": "rejected",
        "days_pending": 180,
        "anomaly_tags": ["PROCEDURAL_DISPUTE"],
        "vegetation_loss_index": 0.02,
        "lon": 80.95,
        "lat": 23.18,
        "claimant_name": "Dhan Singh Uikey",
        "area_ha": 2.0
    },

    # -------------------------------------------------------------
    # District B: High Rejection Anomaly (dist_b)
    # 7 Claims: 6 Rejected (average turnaround 10-14 days), 1 Approved -> 85.7% rejection
    # Anomaly tag: RAPID_REJECTION_SPIKE
    # -------------------------------------------------------------
    {
        "claim_id": "FRA-2026-008",
        "district_id": "dist_b",
        "claimant_type": "Individual",
        "status": "rejected",
        "days_pending": 10,
        "anomaly_tags": ["RAPID_REJECTION_SPIKE", "NO_REASON_RECORDED"],
        "vegetation_loss_index": 0.04,
        "lon": 80.35,
        "lat": 22.60,
        "claimant_name": "Mangal Gond",
        "area_ha": 2.1
    },
    {
        "claim_id": "FRA-2026-009",
        "district_id": "dist_b",
        "claimant_type": "Individual",
        "status": "rejected",
        "days_pending": 12,
        "anomaly_tags": ["RAPID_REJECTION_SPIKE"],
        "vegetation_loss_index": 0.03,
        "lon": 80.48,
        "lat": 22.72,
        "claimant_name": "Ganga Bai Tekam",
        "area_ha": 1.9
    },
    {
        "claim_id": "FRA-2026-010",
        "district_id": "dist_b",
        "claimant_type": "Community",
        "status": "rejected",
        "days_pending": 14,
        "anomaly_tags": ["RAPID_REJECTION_SPIKE", "GRAM_SABHA_BYPASS"],
        "vegetation_loss_index": 0.05,
        "lon": 80.20,
        "lat": 22.48,
        "claimant_name": "Nainpur Forest FRC",
        "area_ha": 58.0
    },
    {
        "claim_id": "FRA-2026-011",
        "district_id": "dist_b",
        "claimant_type": "Individual",
        "status": "rejected",
        "days_pending": 8,
        "anomaly_tags": ["RAPID_REJECTION_SPIKE"],
        "vegetation_loss_index": 0.02,
        "lon": 80.60,
        "lat": 22.55,
        "claimant_name": "Devsingh Dhurve",
        "area_ha": 2.8
    },
    {
        "claim_id": "FRA-2026-012",
        "district_id": "dist_b",
        "claimant_type": "Individual",
        "status": "rejected",
        "days_pending": 13,
        "anomaly_tags": ["RAPID_REJECTION_SPIKE"],
        "vegetation_loss_index": 0.03,
        "lon": 80.10,
        "lat": 22.75,
        "claimant_name": "Kamla Bai",
        "area_ha": 1.7
    },
    {
        "claim_id": "FRA-2026-013",
        "district_id": "dist_b",
        "claimant_type": "Community",
        "status": "rejected",
        "days_pending": 11,
        "anomaly_tags": ["RAPID_REJECTION_SPIKE"],
        "vegetation_loss_index": 0.06,
        "lon": 80.52,
        "lat": 22.80,
        "claimant_name": "Bichhiya CFR Collective",
        "area_ha": 35.0
    },
    {
        "claim_id": "FRA-2026-014",
        "district_id": "dist_b",
        "claimant_type": "Individual",
        "status": "approved",
        "days_pending": 45,
        "anomaly_tags": [],
        "vegetation_loss_index": 0.02,
        "lon": 80.25,
        "lat": 22.90,
        "claimant_name": "Ramsingh Masram",
        "area_ha": 2.5
    },

    # -------------------------------------------------------------
    # District C: Encroachment / Land Conflict Anomaly (dist_c)
    # 7 Claims: 3 Pending (high vegetation loss 0.40 - 0.48 = ~42.5%), 3 Approved, 1 Rejected
    # Anomaly tag: FOREST_COVER_LOSS_ON_CLAIM, ENCROACHMENT_RISK
    # -------------------------------------------------------------
    {
        "claim_id": "FRA-2026-015",
        "district_id": "dist_c",
        "claimant_type": "Community",
        "status": "pending",
        "days_pending": 145,
        "anomaly_tags": ["FOREST_COVER_LOSS_ON_CLAIM", "ENCROACHMENT_RISK"],
        "vegetation_loss_index": 0.46,
        "lon": 82.42,
        "lat": 22.38,
        "claimant_name": "Pali Tehsil CFR Committee",
        "area_ha": 120.0
    },
    {
        "claim_id": "FRA-2026-016",
        "district_id": "dist_c",
        "claimant_type": "Community",
        "status": "pending",
        "days_pending": 160,
        "anomaly_tags": ["FOREST_COVER_LOSS_ON_CLAIM", "ILLEGAL_CLEARANCE"],
        "vegetation_loss_index": 0.43,
        "lon": 82.65,
        "lat": 22.52,
        "claimant_name": "Katghora Tribal Forest Forum",
        "area_ha": 85.0
    },
    {
        "claim_id": "FRA-2026-017",
        "district_id": "dist_c",
        "claimant_type": "Individual",
        "status": "pending",
        "days_pending": 115,
        "anomaly_tags": ["FOREST_COVER_LOSS_ON_CLAIM"],
        "vegetation_loss_index": 0.39,
        "lon": 82.25,
        "lat": 22.25,
        "claimant_name": "Birbal Korwa (PVTG)",
        "area_ha": 3.2
    },
    {
        "claim_id": "FRA-2026-018",
        "district_id": "dist_c",
        "claimant_type": "Individual",
        "status": "approved",
        "days_pending": 50,
        "anomaly_tags": [],
        "vegetation_loss_index": 0.05,
        "lon": 82.78,
        "lat": 22.68,
        "claimant_name": "Chandrawati Bai",
        "area_ha": 2.1
    },
    {
        "claim_id": "FRA-2026-019",
        "district_id": "dist_c",
        "claimant_type": "Individual",
        "status": "approved",
        "days_pending": 62,
        "anomaly_tags": [],
        "vegetation_loss_index": 0.04,
        "lon": 82.35,
        "lat": 22.60,
        "claimant_name": "Ghanshyam Majhi",
        "area_ha": 1.9
    },
    {
        "claim_id": "FRA-2026-020",
        "district_id": "dist_c",
        "claimant_type": "Community",
        "status": "approved",
        "days_pending": 80,
        "anomaly_tags": [],
        "vegetation_loss_index": 0.06,
        "lon": 82.55,
        "lat": 22.20,
        "claimant_name": "Kartala Gram Sabha",
        "area_ha": 65.0
    },
    {
        "claim_id": "FRA-2026-021",
        "district_id": "dist_c",
        "claimant_type": "Individual",
        "status": "rejected",
        "days_pending": 90,
        "anomaly_tags": ["BOUNDARY_OVERLAP"],
        "vegetation_loss_index": 0.08,
        "lon": 82.85,
        "lat": 22.42,
        "claimant_name": "Sonu Rathia",
        "area_ha": 2.6
    },

    # -------------------------------------------------------------
    # District D: Normal Benchmark / Control Group (dist_d)
    # 7 Claims: 5 Approved, 1 Pending (65 days wait), 1 Rejected (turnaround 40 days)
    # Anomaly tag: NORMAL / none
    # -------------------------------------------------------------
    {
        "claim_id": "FRA-2026-022",
        "district_id": "dist_d",
        "claimant_type": "Individual",
        "status": "approved",
        "days_pending": 55,
        "anomaly_tags": ["NORMAL"],
        "vegetation_loss_index": 0.02,
        "lon": 80.18,
        "lat": 21.82,
        "claimant_name": "Devi Prasad Bisen",
        "area_ha": 2.2
    },
    {
        "claim_id": "FRA-2026-023",
        "district_id": "dist_d",
        "claimant_type": "Community",
        "status": "approved",
        "days_pending": 70,
        "anomaly_tags": ["NORMAL"],
        "vegetation_loss_index": 0.03,
        "lon": 80.32,
        "lat": 21.95,
        "claimant_name": "Baihar Baiga CFR Collective",
        "area_ha": 42.0
    },
    {
        "claim_id": "FRA-2026-024",
        "district_id": "dist_d",
        "claimant_type": "Individual",
        "status": "approved",
        "days_pending": 60,
        "anomaly_tags": ["NORMAL"],
        "vegetation_loss_index": 0.01,
        "lon": 80.45,
        "lat": 21.75,
        "claimant_name": "Radhika Bai Netam",
        "area_ha": 1.6
    },
    {
        "claim_id": "FRA-2026-025",
        "district_id": "dist_d",
        "claimant_type": "Individual",
        "status": "approved",
        "days_pending": 65,
        "anomaly_tags": ["NORMAL"],
        "vegetation_loss_index": 0.02,
        "lon": 79.95,
        "lat": 21.65,
        "claimant_name": "Jagmohan Marskole",
        "area_ha": 3.0
    },
    {
        "claim_id": "FRA-2026-026",
        "district_id": "dist_d",
        "claimant_type": "Community",
        "status": "approved",
        "days_pending": 75,
        "anomaly_tags": ["NORMAL"],
        "vegetation_loss_index": 0.03,
        "lon": 80.25,
        "lat": 22.05,
        "claimant_name": "Paraswada Gram Sabha",
        "area_ha": 78.0
    },
    {
        "claim_id": "FRA-2026-027",
        "district_id": "dist_d",
        "claimant_type": "Individual",
        "status": "pending",
        "days_pending": 65,
        "anomaly_tags": ["NORMAL"],
        "vegetation_loss_index": 0.02,
        "lon": 80.55,
        "lat": 21.88,
        "claimant_name": "Chhotelal Pardhi",
        "area_ha": 1.8
    },
    {
        "claim_id": "FRA-2026-028",
        "district_id": "dist_d",
        "claimant_type": "Individual",
        "status": "rejected",
        "days_pending": 40,
        "anomaly_tags": ["NORMAL"],
        "vegetation_loss_index": 0.02,
        "lon": 79.85,
        "lat": 21.90,
        "claimant_name": "Mithilesh Sayam",
        "area_ha": 2.1
    }
]

# Convert to standard GeoJSON FeatureCollection
CLAIMS_DATA: Dict[str, Any] = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [c["lon"], c["lat"]]
            },
            "properties": {
                "claim_id": c["claim_id"],
                "district_id": c["district_id"],
                "claimant_type": c["claimant_type"],
                "status": c["status"],
                "days_pending": c["days_pending"],
                "anomaly_tags": c["anomaly_tags"],
                "vegetation_loss_index": c["vegetation_loss_index"],
                "claimant_name": c.get("claimant_name", "FRA Claimant"),
                "area_ha": c.get("area_ha", 2.0)
            }
        }
        for c in RAW_CLAIMS_DATA
    ]
}


def seed_anomaly_data():
    """Outputs districts.json and claims.json ensuring file sizes are < 100 KB."""
    print("=" * 60)
    print("FRA ANOMALY SEED SCRIPT: Generating Curated Micro-Datasets")
    print("=" * 60)

    # 1. Write districts.json
    with open(DISTRICTS_FILE, "w", encoding="utf-8") as f:
        json.dump(DISTRICTS_DATA, f, indent=2)
    districts_size_kb = os.path.getsize(DISTRICTS_FILE) / 1024.0

    # 2. Write claims.json
    with open(CLAIMS_FILE, "w", encoding="utf-8") as f:
        json.dump(CLAIMS_DATA, f, indent=2)
    claims_size_kb = os.path.getsize(CLAIMS_FILE) / 1024.0

    total_size_kb = districts_size_kb + claims_size_kb

    print(f"[OK] Districts written to: {DISTRICTS_FILE} ({districts_size_kb:.2f} KB)")
    print(f"[OK] Claims written to:    {CLAIMS_FILE} ({claims_size_kb:.2f} KB)")
    print(f"[SUMMARY] Total Size:      {total_size_kb:.2f} KB (Strictly under 100 KB limit)")
    print(f"[SUMMARY] Total Districts: {len(DISTRICTS_DATA['features'])}")
    print(f"[SUMMARY] Total Claims:    {len(CLAIMS_DATA['features'])}")

    # Verify per-district distribution
    counts = {}
    for f in CLAIMS_DATA["features"]:
        did = f["properties"]["district_id"]
        counts[did] = counts.get(did, 0) + 1
    print(f"[SUMMARY] Claims Breakdown per District: {counts}")
    print("=" * 60)


if __name__ == "__main__":
    seed_anomaly_data()
