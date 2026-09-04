import React, { useEffect, useRef, useState } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  GeoJSON, 
  CircleMarker, 
  Polygon,
  Popup, 
  useMap 
} from 'react-leaflet';
import { 
  User, 
  Users, 
  AlertTriangle, 
  RotateCcw,
  Globe,
  Flame,
  Clock,
  ShieldCheck,
  Ban,
  Layers
} from 'lucide-react';
import MapLegend from './MapLegend';
import { 
  getEsriImageryUrl, 
  getEsriReferenceUrl, 
  ESRI_ATTRIBUTION 
} from '../config/esriConfig';
import { fetchDistricts } from '../services/fraApi';

// Controller to smoothly animate map camera
function MapController({ selectedState, resetTrigger, activeClaim }) {
  const map = useMap();

  useEffect(() => {
    if (activeClaim && activeClaim.coordinates) {
      // Zoom directly into the cadastral plot parcel boundary
      map.flyTo(activeClaim.coordinates, 15, {
        animate: true,
        duration: 1.2
      });
    } else if (selectedState && selectedState.center) {
      map.flyTo(selectedState.center, selectedState.zoom || 7, {
        animate: true,
        duration: 1.2
      });
    } else {
      // Pan-India Overview (Entire country visible with all plotted claims)
      map.flyTo([22.5, 79.5], 5, {
        animate: true,
        duration: 1.2
      });
    }
  }, [selectedState, resetTrigger, activeClaim, map]);

  return null;
}

export default function WebGISMap({
  statesGeoJson = { type: 'FeatureCollection', features: [] },
  claimsData = [],
  selectedState = null,
  onSelectState = () => {},
  onResetAllIndia = () => {},
  resetTrigger = 0,
  activeClaim = null,
  onSelectClaim = () => {}
}) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [baseLayer, setBaseLayer] = useState('satellite'); // 'satellite' | 'topo' | 'osm'
  const [showParcels, setShowParcels] = useState(true);
  const [anomalyDistrictsGeoJson, setAnomalyDistrictsGeoJson] = useState(null);
  const geoJsonRef = useRef(null);
  const districtGeoJsonRef = useRef(null);

  // Basemap Tile Layers (Satellite and Street)
  const basemapTiles = {
    satellite: {
      url: getEsriImageryUrl(),
      referenceUrl: getEsriReferenceUrl(),
      attribution: ESRI_ATTRIBUTION
    },
    osm: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors'
    }
  };

  // Fetch live anomaly district boundaries from FastAPI backend on load
  useEffect(() => {
    fetchDistricts()
      .then((data) => {
        if (data && data.features && data.features.length > 0) {
          setAnomalyDistrictsGeoJson(data);
        }
      })
      .catch((err) => {
        console.warn('Backend districts offline or unreachable:', err);
      });
  }, [resetTrigger]);

  // Filter claims based on state and status
  const filteredClaims = claimsData.filter(claim => {
    if (selectedState && claim.stateId) {
      const match = claim.stateId === selectedState.id || 
                    claim.stateId.replace('IN', '') === selectedState.code ||
                    (claim.stateName && claim.stateName.toLowerCase() === (selectedState.name || '').toLowerCase());
      if (!match) return false;
    }
    if (statusFilter !== 'all') {
      if (statusFilter === 'delayed' && !(claim.status === 'delayed' || (claim.days_pending >= 300 || claim.daysPending >= 300))) {
        return false;
      }
      if (statusFilter !== 'delayed' && claim.status !== statusFilter) {
        return false;
      }
    }
    return true;
  });

  // State Boundary Styling
  const getStateStyle = (feature) => {
    const isSelected = selectedState && (
      selectedState.id === feature.id || 
      selectedState.id === feature.properties?.id ||
      selectedState.code === feature.properties?.code
    );

    if (selectedState) {
      if (isSelected) {
        return {
          fillColor: '#2563eb',
          fillOpacity: 0.15,
          color: '#60a5fa',
          weight: 2.2,
          dashArray: '3, 3',
          opacity: 0.9,
        };
      }
      return {
        fillColor: '#000000',
        fillOpacity: 0,
        color: '#ffffff',
        weight: 0.5,
        opacity: 0.2,
      };
    }

    return {
      fillColor: '#10b981',
      fillOpacity: 0.02,
      color: '#ffffff',
      weight: 0.8,
      dashArray: '2, 2',
      opacity: 0.5,
    };
  };

  // Anomaly District Boundary Styling (Distinct colors per anomaly flag)
  const getAnomalyDistrictStyle = (feature) => {
    const flag = feature.properties?.anomaly_flag;
    switch (flag) {
      case 'HIGH_PENDING_DELAY':
        // Red for administrative delay bottleneck
        return {
          fillColor: '#ef4444',
          fillOpacity: 0.20,
          color: '#ef4444',
          weight: 2.8,
          dashArray: '4, 4'
        };
      case 'ABNORMAL_REJECTION_SPIKE':
        // Orange / Amber for rejection spike
        return {
          fillColor: '#f97316',
          fillOpacity: 0.18,
          color: '#f97316',
          weight: 2.6
        };
      case 'FOREST_COVER_LOSS_ON_CLAIM':
        // Deep Crimson / Red for encroachment & deforestation
        return {
          fillColor: '#b91c1c',
          fillOpacity: 0.26,
          color: '#dc2626',
          weight: 3.0,
          dashArray: '2, 3'
        };
      case 'NORMAL':
      default:
        // Slate / Gray for benchmark control group
        return {
          fillColor: '#64748b',
          fillOpacity: 0.10,
          color: '#94a3b8',
          weight: 1.8
        };
    }
  };

  // State Event Listeners
  const onEachState = (feature, layer) => {
    layer.on({
      click: () => onSelectState(feature.properties),
      mouseover: (e) => {
        e.target.setStyle({ fillOpacity: 0.22, weight: 2.2, color: '#38bdf8' });
      },
      mouseout: (e) => {
        if (geoJsonRef.current) {
          geoJsonRef.current.resetStyle(e.target);
        }
      }
    });
  };

  // Anomaly District Layer Tooltips & Popups
  const onEachAnomalyDistrict = (feature, layer) => {
    const props = feature.properties;
    layer.bindTooltip(
      `<div class="font-sans text-xs">
        <strong>${props.name}</strong><br/>
        <span class="text-rose-400 font-semibold">${props.anomaly_flag}</span>
      </div>`,
      { sticky: true, opacity: 0.9 }
    );
  };

  // Claim Marker Color Mapping with Anomaly Logic
  // - Red for delays / encroachments
  // - Green for approved
  // - Gray for benchmark
  // - Orange/Amber for rejection spike & pending
  const getMarkerColor = (claim) => {
    const status = claim.status;
    const vegLoss = claim.vegetation_loss_index || claim.vegetationLossIndex || 0;
    const isHighLoss = vegLoss >= 0.20 || (claim.anomaly_tags && claim.anomaly_tags.includes('FOREST_COVER_LOSS_ON_CLAIM'));
    const days = claim.days_pending || claim.daysPending || 0;
    const isDelay = status === 'delayed' || days >= 300 || (claim.anomaly_tags && claim.anomaly_tags.includes('DELAY_EXCEEDS_STATE_AVG'));
    const isBenchmark = claim.district_id === 'dist_d' || (claim.anomaly_tags && claim.anomaly_tags.includes('NORMAL'));

    if (isHighLoss) {
      // Red / Crimson for Encroachment / Canopy Deforestation
      return { fill: '#dc2626', border: '#991b1b', pulse: true, label: 'Encroachment / Loss' };
    }
    if (isDelay) {
      // Red for Long Bureaucratic Delays
      return { fill: '#ef4444', border: '#b91c1c', pulse: true, label: 'Delay Bottleneck' };
    }
    if (status === 'approved') {
      // Green for Approved Claims
      return { fill: '#10b981', border: '#059669', pulse: false, label: 'Approved' };
    }
    if (status === 'rejected') {
      // Amber/Orange for Rejected / Rejection Spike
      return { fill: '#f97316', border: '#c2410c', pulse: false, label: 'Rejected' };
    }
    if (isBenchmark) {
      // Gray for Normal Benchmark Control
      return { fill: '#94a3b8', border: '#64748b', pulse: false, label: 'Benchmark' };
    }
    // Default Pending
    return { fill: '#f59e0b', border: '#d97706', pulse: false, label: 'Pending' };
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-900">
      <MapContainer
        center={[22.3, 81.2]}
        zoom={6}
        minZoom={4}
        maxZoom={18}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
        zoomControl={false}
      >
        <MapController 
          selectedState={selectedState} 
          resetTrigger={resetTrigger}
          activeClaim={activeClaim}
        />

        {/* Primary Basemap Tile Layer - Esri World Imagery */}
        <TileLayer
          key={baseLayer}
          attribution={basemapTiles[baseLayer].attribution}
          url={basemapTiles[baseLayer].url}
          maxZoom={19}
        />

        {/* Esri Places Overlay */}
        {baseLayer === 'satellite' && basemapTiles.satellite.referenceUrl && (
          <TileLayer
            key="ref-layer"
            url={basemapTiles.satellite.referenceUrl}
            opacity={0.8}
            maxZoom={19}
          />
        )}

        {/* India States Boundary Layer */}
        <GeoJSON
          key={`states-geojson-${selectedState ? selectedState.id : 'all'}`}
          ref={geoJsonRef}
          data={statesGeoJson}
          style={getStateStyle}
          onEachFeature={onEachState}
        />

        {/* 4 Targeted Anomaly District Boundary Polygons Layer */}
        {anomalyDistrictsGeoJson && (
          <GeoJSON
            key={`anomaly-districts-${anomalyDistrictsGeoJson.features?.length}`}
            ref={districtGeoJsonRef}
            data={anomalyDistrictsGeoJson}
            style={getAnomalyDistrictStyle}
            onEachFeature={onEachAnomalyDistrict}
          />
        )}

        {/* Claim Points Plotted on Map */}
        {filteredClaims.map((claim) => {
          const coords = claim.coordinates || (claim.lat && claim.lon ? [claim.lat, claim.lon] : null);
          if (!coords) return null;

          const colors = getMarkerColor(claim);
          const claimId = claim.claim_id || claim.id;
          const isCurrentActive = activeClaim && (activeClaim.id === claimId || activeClaim.claim_id === claimId);
          const isCommunity = (claim.claimant_type || claim.type || '').toLowerCase() === 'community';
          const vegLoss = claim.vegetation_loss_index || claim.vegetationLossIndex || 0;
          const daysPending = claim.days_pending || claim.daysPending || 0;

          return (
            <React.Fragment key={claimId}>
              {/* Authentic Cadastral Land Parcel Boundary Polygon */}
              {showParcels && claim.plot_polygon && (
                <Polygon
                  positions={claim.plot_polygon}
                  eventHandlers={{
                    click: () => onSelectClaim && onSelectClaim(claim)
                  }}
                  pathOptions={{
                    color: isCurrentActive ? '#38bdf8' : colors.fill,
                    weight: isCurrentActive ? 3.5 : 2,
                    fillColor: colors.fill,
                    fillOpacity: isCurrentActive ? 0.45 : 0.22,
                    dashArray: isCurrentActive ? undefined : '4, 4'
                  }}
                />
              )}

              {/* Outer pulsing ring for critical anomaly / actively inspected claims */}
              {(colors.pulse || isCurrentActive) && (
                <CircleMarker
                  center={coords}
                  radius={isCurrentActive ? 16 : 12}
                  pathOptions={{
                    color: colors.fill,
                    fillColor: colors.fill,
                    fillOpacity: 0.35,
                    weight: 2,
                    dashArray: '3, 3'
                  }}
                />
              )}

              {/* Main Claim Circle Marker */}
              <CircleMarker
                center={coords}
                radius={isCommunity ? 8 : 6}
                eventHandlers={{
                  click: () => onSelectClaim && onSelectClaim(claim)
                }}
                pathOptions={{
                  fillColor: colors.fill,
                  fillOpacity: 0.95,
                  color: isCurrentActive ? '#ffffff' : colors.border,
                  weight: isCurrentActive ? 3 : 1.5,
                }}
              >
                <Popup className="custom-leaflet-popup">
                  <div className="w-64 text-slate-200">
                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800">
                      <div className="flex items-center gap-1.5">
                        {isCommunity ? (
                          <span className="p-1 rounded bg-indigo-500/20 text-indigo-300">
                            <Users className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="p-1 rounded bg-emerald-500/20 text-emerald-300">
                            <User className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <div>
                          <p className="text-[10px] font-mono text-slate-400 leading-none">
                            {claimId}
                          </p>
                          <span className="text-[9px] font-semibold text-slate-300 uppercase">
                            {isCommunity ? 'Community Right (CFR)' : 'Individual Right (IFR)'}
                          </span>
                        </div>
                      </div>

                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded capitalize ${
                        claim.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                        claim.status === 'pending' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                        'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}>
                        {claim.status}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-white mb-1">
                      {claim.claimant_name || claim.claimantName || 'Tribal Claimant'}
                    </p>

                    {/* Cadastral Area & Georeference Badge */}
                    <div className="flex items-center justify-between text-[10px] text-slate-300 mb-1.5 px-2 py-1 rounded bg-slate-900/90 border border-slate-800">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Layers className="w-3 h-3 text-emerald-400" />
                        Cadastral Parcel:
                      </span>
                      <span className="font-bold text-emerald-300 font-mono">
                        {claim.area_ha || claim.areaHa || 2.0} Ha <span className="text-slate-500 font-normal">({Math.round((claim.area_ha || claim.areaHa || 2.0) * 10000).toLocaleString()} m²)</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[10px] mb-1.5">
                      <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                        <span className="text-slate-400 block text-[9px]">District</span>
                        <span className="font-semibold text-slate-200 uppercase">{claim.district_id || claim.districtName}</span>
                      </div>
                      <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                        <span className="text-slate-400 block text-[9px]">Days Waiting</span>
                        <span className={`font-bold ${daysPending > 300 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {daysPending} days
                        </span>
                      </div>
                    </div>

                    {/* Vegetation Loss Alert if present */}
                    {vegLoss > 0 && (
                      <div className={`p-1.5 rounded text-[10px] mb-1.5 flex items-center justify-between border ${
                        vegLoss >= 0.20 
                          ? 'bg-rose-950/40 border-rose-500/40 text-rose-200' 
                          : 'bg-slate-900/80 border-slate-800 text-slate-300'
                      }`}>
                        <span className="flex items-center gap-1 font-semibold">
                          <Flame className="w-3 h-3 text-rose-400" />
                          Vegetation Loss:
                        </span>
                        <span className="font-bold text-rose-300 font-mono">
                          {(vegLoss * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}

                    {/* Anomaly tags */}
                    {claim.anomaly_tags && claim.anomaly_tags.length > 0 && (
                      <div className="pt-1 border-t border-slate-800/80 flex flex-wrap gap-1">
                        {claim.anomaly_tags.map((tag, idx) => (
                          <span 
                            key={idx} 
                            className="text-[8px] font-mono font-semibold px-1 py-0.2 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* Top-Left: Central View & Cadastral Parcels Toggle */}
      <div className="absolute top-5 left-5 z-[1000] flex items-center gap-2">
        <button
          onClick={onResetAllIndia}
          className="bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md border border-slate-700/80 hover:border-slate-600 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 shadow-xl transition"
          title="Reset to Central View"
        >
          <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
          <span>Central View</span>
        </button>

        <button
          onClick={() => setShowParcels(prev => !prev)}
          className={`backdrop-blur-md border rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 shadow-xl transition ${
            showParcels
              ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
              : 'bg-slate-900/90 border-slate-700/80 text-slate-400 hover:text-white'
          }`}
          title="Toggle Cadastral Land Parcel Boundaries"
        >
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span>Cadastral Parcels</span>
          <span className={`w-1.5 h-1.5 rounded-full ${showParcels ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
        </button>
      </div>

      {/* Top-Right: Basemap Switcher (Satellite & Street - Topo removed) */}
      <div className="absolute top-5 right-5 z-[1000] flex items-center gap-2">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-xl p-1 flex items-center gap-1 text-xs">
          <button
            onClick={() => setBaseLayer('satellite')}
            className={`px-3 py-1 rounded-lg font-medium transition flex items-center gap-1.5 ${
              baseLayer === 'satellite' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Satellite</span>
          </button>
          <button
            onClick={() => setBaseLayer('osm')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              baseLayer === 'osm' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Street
          </button>
        </div>
      </div>

      {/* Bottom-Left Anomaly Color Map Legend */}
      <MapLegend
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        claimsCount={filteredClaims.length}
        totalClaims={claimsData.length}
      />
    </div>
  );
}
