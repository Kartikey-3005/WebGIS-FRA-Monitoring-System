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
  Layers,
  Plus,
  Minus,
  Maximize2
} from 'lucide-react';
import MapLegend from './MapLegend';
import indiaMaskGeoJson from '../data/indiaMaskGeoJson.json';
import { 
  getEsriImageryUrl, 
  getEsriReferenceUrl, 
  ESRI_ATTRIBUTION 
} from '../config/esriConfig';
import { fetchDistricts } from '../services/fraApi';

// Controller to smoothly animate map camera and expose map instance & zoom level
function MapController({ selectedState, resetTrigger, activeClaim, onMapReady, onZoomChange }) {
  const map = useMap();

  useEffect(() => {
    if (onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);

  useEffect(() => {
    const handleZoom = () => {
      if (onZoomChange) {
        onZoomChange(map.getZoom());
      }
    };
    map.on('zoomend', handleZoom);
    handleZoom();
    return () => {
      map.off('zoomend', handleZoom);
    };
  }, [map, onZoomChange]);

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
  onSelectClaim = () => {},
  theme = {}
}) {
  const t = {
    maskColor: theme?.maskColor || '#080402',
    stateStroke: theme?.stateStroke || '#dfcca9',
    stateHover: theme?.stateHover || '#fef08a',
    surface: theme?.surface || '#120a06',
    surfaceMuted: theme?.surfaceMuted || '#1a0e08',
    surfaceBorder: theme?.surfaceBorder || '#452615',
    borderLight: theme?.borderLight || '#55341e',
    textPrimary: theme?.textPrimary || '#ffffff',
    textSecondary: theme?.textSecondary || '#dfcca9',
    textMuted: theme?.textMuted || '#9c7d61',
    accent: theme?.accent || '#ea580c',
    pillBg: theme?.pillBg || 'rgba(20, 11, 6, 0.90)',
    pillBorder: theme?.pillBorder || '#452615',
    buttonColor: theme?.buttonColor || '#ea580c'
  };

  const [statusFilter, setStatusFilter] = useState('all');
  const [baseLayer, setBaseLayer] = useState('satellite'); // 'satellite' | 'topo' | 'osm'
  const [showParcels, setShowParcels] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [hoveredState, setHoveredState] = useState(null);
  const [anomalyDistrictsGeoJson, setAnomalyDistrictsGeoJson] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [currentZoom, setCurrentZoom] = useState(5);
  const geoJsonRef = useRef(null);
  const districtGeoJsonRef = useRef(null);

  const handleZoomIn = () => {
    if (mapInstance) {
      mapInstance.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstance) {
      mapInstance.zoomOut();
    }
  };

  const handleFitIndia = () => {
    if (mapInstance) {
      mapInstance.flyTo([22.5, 79.5], 5, { animate: true, duration: 1.0 });
    }
    onResetAllIndia();
  };

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

  // State Boundary Styling matching user's reference image and active theme
  const getStateStyle = (feature) => {
    const isSelected = selectedState && (
      selectedState.id === feature.id || 
      selectedState.id === feature.properties?.id ||
      selectedState.code === feature.properties?.code
    );
    const isHovered = hoveredState && (
      hoveredState.id === feature.id ||
      hoveredState.id === feature.properties?.id ||
      hoveredState.code === feature.properties?.code
    );

    if (isSelected) {
      return {
        fillColor: t.accent,
        fillOpacity: 0.16,
        color: '#ffffff',
        weight: 2.2,
        opacity: 1.0,
      };
    }

    if (isHovered) {
      return {
        fillColor: t.stateHover,
        fillOpacity: 0.12,
        color: t.stateHover,
        weight: 2.0,
        opacity: 1.0,
      };
    }

    // Delicate state border matching user reference image & theme
    return {
      fillColor: '#000000',
      fillOpacity: 0.001,
      color: t.stateStroke,
      weight: 1.15,
      opacity: 0.88,
    };
  };

  // Anomaly District Boundary Styling (Distinct colors per anomaly flag)
  const getAnomalyDistrictStyle = (feature) => {
    const flag = feature.properties?.anomaly_flag;
    switch (flag) {
      case 'HIGH_PENDING_DELAY':
        return {
          fillColor: '#ef4444',
          fillOpacity: 0.20,
          color: '#ef4444',
          weight: 2.8,
          dashArray: '4, 4'
        };
      case 'ABNORMAL_REJECTION_SPIKE':
        return {
          fillColor: '#f97316',
          fillOpacity: 0.18,
          color: '#f97316',
          weight: 2.6
        };
      case 'FOREST_COVER_LOSS_ON_CLAIM':
        return {
          fillColor: '#b91c1c',
          fillOpacity: 0.26,
          color: '#dc2626',
          weight: 3.0,
          dashArray: '2, 3'
        };
      case 'NORMAL':
      default:
        return {
          fillColor: '#64748b',
          fillOpacity: 0.10,
          color: '#94a3b8',
          weight: 1.8
        };
    }
  };

  // State Event Listeners: smooth hover and click to enter state view
  const onEachState = (feature, layer) => {
    layer.on({
      click: () => {
        const props = feature.properties;
        if (selectedState && (selectedState.id === props.id || selectedState.code === props.code)) {
          onResetAllIndia();
        } else {
          onSelectState(props);
        }
      },
      mouseover: (e) => {
        setHoveredState(feature.properties);
        e.target.setStyle({ fillOpacity: 0.12, weight: 2.0, color: '#fef08a' });
      },
      mouseout: (e) => {
        setHoveredState(null);
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
    <div className="relative w-full h-full overflow-hidden bg-[#0a0604]">
      <MapContainer
        center={[22.5, 79.5]}
        zoom={5}
        minZoom={4}
        maxZoom={19}
        scrollWheelZoom={true}
        className="w-full h-full z-10 bg-[#0a0604]"
        zoomControl={false}
      >
        <MapController 
          selectedState={selectedState} 
          resetTrigger={resetTrigger}
          activeClaim={activeClaim}
          onMapReady={setMapInstance}
          onZoomChange={setCurrentZoom}
        />

        {/* Primary Basemap Tile Layer - Esri World Imagery Satellite */}
        <TileLayer
          key={baseLayer}
          attribution={basemapTiles[baseLayer].attribution}
          url={basemapTiles[baseLayer].url}
          maxZoom={19}
        />

        {/* World Inverted Mask: Mask non-India territories with theme background */}
        <GeoJSON
          key={`india-inverted-mask-${t.maskColor}`}
          data={indiaMaskGeoJson}
          style={{
            fillColor: t.maskColor,
            fillOpacity: 1.0,
            color: t.maskColor,
            weight: 0.5,
            opacity: 1.0
          }}
          interactive={false}
        />

        {/* India States Boundary Layer: Delicate tan/beige outlines */}
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

      {/* Top-Left: Navigation & Controls */}
      <div className="absolute top-5 left-5 z-[1000] flex items-center gap-2">
        {selectedState && (
          <button
            onClick={onResetAllIndia}
            className="bg-[#180e08]/90 hover:bg-[#2c1a10] text-[#dfcca9] hover:text-white border border-[#4a2e1b] hover:border-[#7c4d2d] rounded-xl px-3.5 py-1.5 text-xs font-mono font-medium flex items-center gap-2 shadow-2xl transition"
            title="Return to full India overview"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Return to All-India</span>
          </button>
        )}

        <button
          onClick={() => setShowParcels(prev => !prev)}
          className={`backdrop-blur-md border rounded-xl px-3 py-1.5 text-xs font-mono font-medium flex items-center gap-1.5 shadow-xl transition ${
            showParcels
              ? 'bg-[#22130b]/90 border-[#85532f] text-amber-300'
              : 'bg-[#180e08]/80 border-[#382012] text-[#9c7d61] hover:text-[#dfcca9]'
          }`}
          title="Toggle Cadastral Land Parcel Boundaries"
        >
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span>Cadastral Parcels</span>
          <span className={`w-1.5 h-1.5 rounded-full ${showParcels ? 'bg-amber-400 animate-pulse' : 'bg-[#55341e]'}`} />
        </button>

        <button
          onClick={() => setShowLegend(prev => !prev)}
          className={`backdrop-blur-md border rounded-xl px-3 py-1.5 text-xs font-mono font-medium flex items-center gap-1.5 shadow-xl transition ${
            showLegend
              ? 'bg-[#22130b]/90 border-[#85532f] text-amber-300'
              : 'bg-[#180e08]/80 border-[#382012] text-[#9c7d61] hover:text-[#dfcca9]'
          }`}
          title="Toggle Anomaly & Status Legend"
        >
          <span>Legend</span>
        </button>
      </div>

      {/* Front-end Zoom Controls (Top-Left matching user reference screenshot) */}
      <div 
        className="absolute top-6 left-6 z-[1000] flex flex-col rounded-lg shadow-2xl overflow-hidden border backdrop-blur-md"
        style={{
          backgroundColor: t.pillBg,
          borderColor: t.pillBorder
        }}
      >
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 flex items-center justify-center text-white/90 hover:text-white hover:bg-white/10 transition border-b"
          style={{ borderColor: t.surfaceBorder }}
          title="Zoom In (+)"
          aria-label="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>

        <button
          onClick={handleZoomOut}
          className="w-8 h-8 flex items-center justify-center text-white/90 hover:text-white hover:bg-white/10 transition"
          style={{ borderColor: t.surfaceBorder }}
          title="Zoom Out (-)"
          aria-label="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* Top-Right: Basemap Switcher */}
      <div className="absolute top-6 right-6 z-[1000] flex items-center gap-2">
        <div 
          className="backdrop-blur-md border rounded-xl shadow-xl p-1 flex items-center gap-1 text-xs"
          style={{
            backgroundColor: t.pillBg,
            borderColor: t.pillBorder
          }}
        >
          <button
            onClick={() => setBaseLayer('satellite')}
            className="px-2.5 py-1 rounded-lg font-mono text-[11px] transition flex items-center gap-1.5"
            style={{
              backgroundColor: baseLayer === 'satellite' ? t.surfaceMuted : 'transparent',
              color: baseLayer === 'satellite' ? '#ffffff' : t.textMuted,
              border: baseLayer === 'satellite' ? `1px solid ${t.borderLight}` : '1px solid transparent'
            }}
          >
            <Globe className="w-3 h-3" />
            <span>Satellite</span>
          </button>
          <button
            onClick={() => setBaseLayer('osm')}
            className="px-2.5 py-1 rounded-lg font-mono text-[11px] transition"
            style={{
              backgroundColor: baseLayer === 'osm' ? t.surfaceMuted : 'transparent',
              color: baseLayer === 'osm' ? '#ffffff' : t.textMuted,
              border: baseLayer === 'osm' ? `1px solid ${t.borderLight}` : '1px solid transparent'
            }}
          >
            Street
          </button>
        </div>
      </div>

      {/* Bottom-Left Information Pill matching user's image EXACTLY */}
      <div className="absolute bottom-6 left-6 z-[1000] pointer-events-none select-none">
        <div 
          className="rounded-full px-4 py-1.5 text-xs font-mono shadow-2xl tracking-wide flex items-center gap-2 border backdrop-blur-md"
          style={{
            backgroundColor: t.pillBg,
            borderColor: t.pillBorder,
            color: t.textSecondary
          }}
        >
          {hoveredState ? (
            <>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: t.accent }} />
              <span className="font-semibold text-white">{hoveredState.name}</span>
              <span style={{ color: t.textMuted }}>•</span>
              <span>Click to enter state view</span>
            </>
          ) : selectedState ? (
            <>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.accent }} />
              <span className="font-semibold text-white">{selectedState.name}</span>
              <span style={{ color: t.textMuted }}>•</span>
              <span>Click to enter state view</span>
            </>
          ) : (
            <>
              <span>Hover a state to view details</span>
              <span style={{ color: t.textMuted }}>•</span>
              <span>Click to enter state view</span>
            </>
          )}
        </div>
      </div>

      {/* Optional Anomaly Color Map Legend */}
      {showLegend && (
        <MapLegend
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          claimsCount={filteredClaims.length}
          totalClaims={claimsData.length}
        />
      )}
    </div>
  );
}
