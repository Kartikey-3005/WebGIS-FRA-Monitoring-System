"""
Mock GeoJSON Data Generator for FRA Monitoring System
Generates:
1. backend/data/districts.geojson (3 Central India districts)
2. backend/data/claims.geojson (30 FRA claim points scattered across the districts)
"""

import os
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

# 1. District Boundaries (Central India Tribal Belt - Madhya Pradesh)
DISTRICTS_DATA = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": {
                "district_id": "DIST_001",
                "name": "Dindori",
                "state": "Madhya Pradesh",
                "tribal_population_pct": 64.7,
                "headquarters": "Dindori",
                "total_forest_area_ha": 312000,
                "anomaly_flag": True,
                "sentinel_vegetation_loss_pct": 41.8,
                "sentinel_alert_summary": "Sentinel-2 NDVI anomaly detected 41.8% forest canopy degradation in northern sal forest blocks over the past 24 months."
            },
            "geometry": {
                "type": "Polygon",
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
            }
        },
        {
            "type": "Feature",
            "properties": {
                "district_id": "DIST_002",
                "name": "Mandla",
                "state": "Madhya Pradesh",
                "tribal_population_pct": 57.9,
                "headquarters": "Mandla",
                "total_forest_area_ha": 425000,
                "anomaly_flag": False,
                "sentinel_vegetation_loss_pct": 4.2,
                "sentinel_alert_summary": "Sentinel-2 satellite imagery confirms nominal canopy stability (<4.5% natural phenological variance) with healthy dense sal/teak forest cover."
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
                "district_id": "DIST_003",
                "name": "Balaghat",
                "state": "Madhya Pradesh",
                "tribal_population_pct": 53.2,
                "headquarters": "Balaghat",
                "total_forest_area_ha": 498000,
                "anomaly_flag": False,
                "sentinel_vegetation_loss_pct": 12.5,
                "sentinel_alert_summary": "Sentinel-2 multi-temporal analysis indicates moderate fringe thinning (12.5% loss) along southern bamboo plantation corridors."
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

# 2. 30 Mock FRA Claims (GeoJSON FeatureCollection)
# DIST_001 (Dindori) is intentionally skewed with 80% pending claims & high days_pending (>300 days)
CLAIMS_DATA = {
    "type": "FeatureCollection",
    "features": [
        # --- Dindori (DIST_001) - 10 Claims (High backlog anomaly) ---
        {
            "type": "Feature",
            "properties": {
                "claim_id": "CLM-DIN-001",
                "district_id": "DIST_001",
                "district_name": "Dindori",
                "claimant_name": "Budhram Maravi",
                "status": "pending",
                "days_pending": 342,
                "type": "individual",
                "area_ha": 2.4,
                "tribe": "Baiga (PVTG)",
                "vegetation_loss_flag": True
            },
            "geometry": {"type": "Point", "coordinates": [81.02, 22.92]}
        },
        {
            "type": "Feature",
            "properties": {
                "claim_id": "CLM-DIN-002",
                "district_id": "DIST_001",
                "district_name": "Dindori",
                "claimant_name": "Mohgaon Baiga CFR Collective",
                "status": "pending",
                "days_pending": 298,
                "type": "community",
                "area_ha": 18.5,
                "tribe": "Baiga (PVTG)",
                "vegetation_loss_flag": True
            },
            "geometry": {"type": "Point", "coordinates": [81.15, 23.05]}
        },
        {
            "type": "Feature",
            "properties": {
                "claim_id": "CLM-DIN-003",
                "district_id": "DIST_001",
                "district_name": "Dindori",
                "claimant_name": "Ramsingh Markam",
                "status": "pending",
                "days_pending": 410,
                "type": "individual",
                "area_ha": 1.8,
                "tribe": "Gond",
                "vegetation_loss_flag": False
            },
            "geometry": {"type": "Point", "coordinates": [80.88, 22.84]}
        },
        {
            "type": "Feature",
            "properties": {
                "claim_id": "CLM-DIN-004",
                "district_id": "DIST_001",
                "district_name": "Dindori",
                "claimant_name": "Kamla Bai Dhurve",
                "status": "pending",
                "days_pending": 265,
                "type": "individual",
                "area_ha": 3.1,
                "tribe": "Gond",
                "vegetation_loss_flag": True
            },
            "geometry": {"type": "Point", "coordinates": [81.25, 22.98]}
        },
        {
            "type": "Feature",
            "properties": {
                "claim_id": "CLM-DIN-005",
                "district_id": "DIST_001",
                "district_name": "Dindori",
                "claimant_name": "Sukhdev Parte",
                "status": "approved",
                "days_pending": 45,
                "type": "individual",
                "area_ha": 2.0,
                "tribe": "Gond",
                "vegetation_loss_flag": False
            },
            "geometry": {"type": "Point", "coordinates": [80.75, 22.78]}
        },
        {
            "type": "Feature",
            "properties": {
                "claim_id": "CLM-DIN-006",
                "district_id": "DIST_001",
                "district_name": "Dindori",
                "claimant_name": "Samnapur Forest Protection Committee",
                "status": "pending",
                "days_pending": 380,
                "type": "community",
                "area_ha": 24.0,
                "tribe": "Baiga (PVTG)",
                "vegetation_loss_flag": True
            },
            "geometry": {"type": "Point", "coordinates": [81.30, 23.12]}
        },
        {
            "type": "Feature",
            "properties": {
                "claim_id": "CLM-DIN-007",
                "district_id": "DIST_001",
                "district_name": "Dindori",
                "claimant_name": "Chhotu Lal Baiga",
                "status": "pending",
                "days_pending": 315,
                "type": "individual",
                "area_ha": 1.5,
                "tribe": "Baiga (PVTG)",
                "vegetation_loss_flag": True
            },
            "geometry": {"type": "Point", "coordinates": [80.95, 23.18]}
        },
        {
            "type": "Feature",
            "properties": {
                "claim_id": "CLM-DIN-008",
                "district_id": "DIST_001",
                "district_name": "Dindori",
                "claimant_name": "Ghanshyam Netam",
                "status": "pending",
                "days_pending": 290,
                "type": "individual",
                "area_ha": 2.7,
                "tribe": "Gond",
                "vegetation_loss_flag": False
            },
            "geometry": {"type": "Point", "coordinates": [81.08, 22.80]}
        },
        {
            "type": "Feature",
            "properties": {
                "claim_id": "CLM-DIN-009",
                "district_id": "DIST_001",
                "district_name": "Dindori",
                "claimant_name": "Phoolwati Bai",
                "status": "rejected",
                "days_pending": 180,
                "type": "individual",
                "area_ha": 1.2,
                "tribe": "Gond",
                "vegetation_loss_flag": False
            },
            "geometry": {"type": "Point", "coordinates": [80.82, 23.02]}
        },
        {
            "type": "Feature",
            "properties": {
                "claim_id": "CLM-DIN-010",
                "district_id": "DIST_001",
                "district_name": "Dindori",
                "claimant_name": "Karanjia Gram Van Samiti",
                "status": "pending",
                "days_pending": 365,
                "type": "community",
                "area_ha": 15.0,
                "tribe": "Baiga (PVTG)",
                "vegetation_loss_flag": True
            },
            "geometry": {"type": "Point", "coordinates": [81.38, 22.89]}
        },

        # --- Mandla (DIST_002) - 10 Claims (Healthy benchmark: 70% approved) ---
        {
            "type": "Feature",
            "properties": {
                "claim_id": "CLM-MAN-001",
                "district_id": "DIST_002",
                "district_name": "Mandla",
                "claimant_name": "Brijesh Uikey",
                "status": "approved",
                "days_pending": 28,
                "type": "individual",
                "area_ha": 2.1,
                "tribe": "Gond",
                "vegetation_loss_flag": False
            },
            "geometry": {"type": "Point", "coordinates": [80.35, 22.60]}
        },
        {
            "type": "Feature",
            "properties": {
                "claim_id": "CLM-MAN-002",
                "district_id": "DIST_002",
                "district_name": "Mandla",
                "claimant_name": "Bichhiya Gram Sabha",
                "status": "approved",
                "days_pending": 35,
                "type": "community",
                "area_ha": 22.0,
                "tribe": "Gond",
                "vegetation_loss_flag": False
            },
            "geometry": {"type": "Point", "coordinates": [80.48, 22.72]}
        },
        {
            "type": "Feature",
            "properties": {
                "claim_id": "CLM-MAN-003",
                "district_id": "DIST_002",
                "district_name": "Mandla",
                "claimant_name": "Anita Bai Kol",
                "status": "pending",
                "days_pending": 54,
                "type": "individual",
                "area_ha": 1.9,
                "tribe": "Kol",
                "vegetation_loss_flag": False
            },
            "geometry": {"type": "Point", "coordinates": [80.20, 22.48]}
        },
        {
            "type": "Feature",
            "properties": {
                "claim_id": "CLM-MAN-004",
                "district_id": "DIST_002",
                "district_name": "Mandla",
                "claimant_name": "Dashrath Tekam",
                "status": "approved",
                "days_pending": 40,
                "type": "individual",
                "area_ha": 2.8,
                "tribe": "Gond",
                "vegetation_loss_flag": False
            },
            "geometry": {"type": "Point", "coordinates": [80.60, 22.55]}
        },
        {
            "type": "Feature",
            "properties": {
                "claim_id": "CLM-MAN-005",
                "district_id": "DIST_002",
                "district_name": "Mandla",
                "claimant_name": "Santosh Markam",
                "status": "approved",
                "days_pending": 22,
                "type": "individual",
                "area_ha": 1.4,
                "tribe": "Gond",
                "vegetation_loss_flag": False
            },
            "geometry": {"type": "Point", "coordinates": [80.10, 22.75]}
        },
        {
            "type": "Feature",
            "properties": {
                "claim_id": "CLM-MAN-006",
                "district_id": "DIST_002",
                "district_name": "Mandla",
                "claimant_name": "Jitendra Dhurve",
                "status": "rejected",
                "days_pending": 60,
                "type": "individual",
                "area_ha": 3.0,
                "tribe": "Gond",
                "vegetation_loss_flag": False
            },
            "geometry": {"type": "Point", "coordinates": [80.52, 22.80]}
        },
        {
            "type": "Feature",
            "properties": {
                "claim_id": "CLM-MAN-007",
                "district_id": "DIST_002",
                "district_name": "Mandla",
                "claimant_name": "Nainpur Forest Rights Council",
                "status": "approved",
                "days_pending": 31,
                "type": "community",
                "area_ha": 30.5,
                "tribe": "Gond",
                "vegetation_loss_flag": False
            },
            "geometry": {"type": "Point", "coordinates": [80.25, 22.90]}
        },
        {
            "type": "Feature",
            "properties": {
                "claim_id": "CLM-MAN-008",
                "district_id": "DIST_002",
                "district_name": "Mandla",
                "claimant_name": "Geeta Bai Maravi",
                "status": "approved",
                "days_pending": 48,
                "type": "individual",
                "area_ha": 2.3,
                "tribe": "Gond",
                "vegetation_loss_flag": False
            },
            "geometry": {"type": "Point", "coordinates": [80.68, 22.40]}
        },
        {
            "type": "Feature",
            "properties": {
                "claim_id": "CLM-MAN-009",
                "district_id": "DIST_002",
                "district_name": "Mandla",
                "claimant_name": "Madan Lal Baiga",
                "status": "pending",
                "days_pending": 62,
                "type": "individual",
                "area_ha": 1.7,
                "tribe": "Baiga (PVTG)",
                "vegetation_loss_flag": False
            },
            "geometry": {"type": "Point", "coordinates": [80.40, 22.68]}
        },
        {
            "type": "Feature",
            "properties": {
                "claim_id": "CLM-MAN-010",
                "district_id": "DIST_002",
                "district_name": "Mandla",
                "claimant_name": "Rukmani Bai",
                "status": "approved",
                "days_pending": 19,
                "type": "individual",
                "area_ha": 2.5,
                "tribe": "Gond",
                "vegetation_loss_flag": False
            },
            "geometry": {"type": "Point", "coordinates": [80.15, 22.58]}
        },

        # --- Balaghat (DIST_003) - 10 Claims (Balanced implementation) ---
        {
            "type": "Feature",
            "properties": {
                "claim_id": "CLM-BAL-001",
                "district_id": "DIST_003",
                "district_name": "Balaghat",
                "claimant_name": "Govind Netam",
                "status": "approved",
                "days_pending": 45,
                "type": "individual",
                "area_ha": 2.2,
                "tribe": "Gond",
                "vegetation_loss_flag": False
            },
            "geometry": {"type": "Point", "coordinates": [80.18, 21.82]}
        },
        {
            "type": "Feature",
            "properties": {
                "claim_id": "CLM-BAL-002",
                "district_id": "DIST_003",
                "district_name": "Balaghat",
                "claimant_name": "Shivram Maravi",
                "status": "pending",
                "days_pending": 95,
                "type": "individual",
                "area_ha": 1.6,
                "tribe": "Gond",
                "vegetation_loss_flag": True
            },
            "geometry": {"type": "Point", "coordinates": [80.32, 21.95]}
        },
        {
            "type": "Feature",
            "properties": {
                "claim_id": "CLM-BAL-003",
                "district_id": "DIST_003",
                "district_name": "Balaghat",
                "claimant_name": "Baihar Tribal Forest Council",
                "status": "approved",
                "days_pending": 50,
                "type": "community",
                "area_ha": 16.0,
                "tribe": "Baiga (PVTG)",
                "vegetation_loss_flag": False
            },
            "geometry": {"type": "Point", "coordinates": [80.45, 21.75]}
        },
        {
            "type": "Feature",
            "properties": {
                "claim_id": "CLM-BAL-004",
                "district_id": "DIST_003",
                "district_name": "Balaghat",
                "claimant_name": "Sunita Bai Dhurve",
                "status": "rejected",
                "days_pending": 110,
                "type": "individual",
                "area_ha": 1.1,
                "tribe": "Gond",
                "vegetation_loss_flag": False
            },
            "geometry": {"type": "Point", "coordinates": [79.95, 21.65]}
        },
        {
            "type": "Feature",
            "properties": {
                "claim_id": "CLM-BAL-005",
                "district_id": "DIST_003",
                "district_name": "Balaghat",
                "claimant_name": "Hemraj Uikey",
                "status": "approved",
                "days_pending": 38,
                "type": "individual",
                "area_ha": 3.4,
                "tribe": "Gond",
                "vegetation_loss_flag": False
            },
            "geometry": {"type": "Point", "coordinates": [80.25, 22.05]}
        },
        {
            "type": "Feature",
            "properties": {
                "claim_id": "CLM-BAL-006",
                "district_id": "DIST_003",
                "district_name": "Balaghat",
                "claimant_name": "Paraswada Gram Van Samiti",
                "status": "pending",
                "days_pending": 85,
                "type": "community",
                "area_ha": 20.2,
                "tribe": "Gond",
                "vegetation_loss_flag": False
            },
            "geometry": {"type": "Point", "coordinates": [80.55, 21.88]}
        },
        {
            "type": "Feature",
            "properties": {
                "claim_id": "CLM-BAL-007",
                "district_id": "DIST_003",
                "district_name": "Balaghat",
                "claimant_name": "Laxman Koram",
                "status": "rejected",
                "days_pending": 125,
                "type": "individual",
                "area_ha": 1.5,
                "tribe": "Gond",
                "vegetation_loss_flag": False
            },
            "geometry": {"type": "Point", "coordinates": [79.85, 21.90]}
        },
        {
            "type": "Feature",
            "properties": {
                "claim_id": "CLM-BAL-008",
                "district_id": "DIST_003",
                "district_name": "Balaghat",
                "claimant_name": "Radha Bai Parte",
                "status": "approved",
                "days_pending": 42,
                "type": "individual",
                "area_ha": 2.0,
                "tribe": "Gond",
                "vegetation_loss_flag": False
            },
            "geometry": {"type": "Point", "coordinates": [80.10, 21.70]}
        },
        {
            "type": "Feature",
            "properties": {
                "claim_id": "CLM-BAL-009",
                "district_id": "DIST_003",
                "district_name": "Balaghat",
                "claimant_name": "Manohar Tekam",
                "status": "pending",
                "days_pending": 78,
                "type": "individual",
                "area_ha": 1.8,
                "tribe": "Gond",
                "vegetation_loss_flag": False
            },
            "geometry": {"type": "Point", "coordinates": [80.38, 22.10]}
        },
        {
            "type": "Feature",
            "properties": {
                "claim_id": "CLM-BAL-010",
                "district_id": "DIST_003",
                "district_name": "Balaghat",
                "claimant_name": "Champa Bai Kol",
                "status": "approved",
                "days_pending": 55,
                "type": "individual",
                "area_ha": 2.6,
                "tribe": "Kol",
                "vegetation_loss_flag": False
            },
            "geometry": {"type": "Point", "coordinates": [80.02, 21.98]}
        }
    ]
}

def generate_files():
    districts_file = os.path.join(DATA_DIR, "districts.geojson")
    with open(districts_file, "w", encoding="utf-8") as f:
        json.dump(DISTRICTS_DATA, f, indent=2)
    print(f"[OK] Generated {districts_file} ({len(DISTRICTS_DATA['features'])} districts)")

    claims_file = os.path.join(DATA_DIR, "claims.geojson")
    with open(claims_file, "w", encoding="utf-8") as f:
        json.dump(CLAIMS_DATA, f, indent=2)
    print(f"[OK] Generated {claims_file} ({len(CLAIMS_DATA['features'])} claims)")

if __name__ == "__main__":
    generate_files()
