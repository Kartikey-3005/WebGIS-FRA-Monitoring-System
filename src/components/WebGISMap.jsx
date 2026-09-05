import React, { useEffect, useRef, useState, useMemo } from 'react';
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
import indiaMaskGeoJson from '../data/indiaMaskGeoJson.json';
import indiaDistrictsGeoJson from '../data/indiaDistrictsGeoJson.json';
import { 
  getEsriImageryUrl, 
  getEsriReferenceUrl, 
  ESRI_ATTRIBUTION 
} from '../config/esriConfig';

const LAKSHADWEEP_ISLANDS = [
  { name: 'Kavaratti', coords: [10.566, 72.641], isCapital: true },
  { name: 'Agatti', coords: [10.853, 72.190] },
  { name: 'Andrott', coords: [10.817, 73.680] },
  { name: 'Minicoy', coords: [8.283, 73.048] },
  { name: 'Amini', coords: [11.124, 72.731] },
  { name: 'Kadmat', coords: [11.233, 72.780] },
  { name: 'Kalpeni', coords: [10.083, 73.633] }
];

// Helper to calculate exact bounding box of any state feature for perfect auto-framing
function getFeatureBounds(feature) {
  if (!feature || !feature.geometry || !feature.geometry.coordinates) return null;
  const geom = feature.geometry;
  const allCoords = [];
  if (geom.type === 'Polygon') {
    allCoords.push(...geom.coordinates[0]);
  } else if (geom.type === 'MultiPolygon') {
    for (const poly of geom.coordinates) {
      if (poly && poly[0]) {
        allCoords.push(...poly[0]);
      }
    }
  }
  if (allCoords.length === 0) return null;
  const lons = allCoords.map(c => c[0]);
  const lats = allCoords.map(c => c[1]);
  return [
    [Math.min(...lats), Math.min(...lons)],
    [Math.max(...lats), Math.max(...lons)]
  ];
}

// Controller to smoothly animate map camera and expose map instance & zoom level
function MapController({ selectedState, resetTrigger, activeClaim, onMapReady, onZoomChange, statesGeoJson }) {
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
    } else if (selectedState) {
      // Find the state's exact polygon feature in statesGeoJson for perfect framing
      const feat = statesGeoJson?.features?.find(f =>
        f.id === selectedState.id ||
        f.properties?.id === selectedState.id ||
        f.properties?.code === selectedState.code ||
        f.properties?.name?.toLowerCase() === (selectedState.name || '').toLowerCase()
      );

      const bounds = getFeatureBounds(feat);
      if (bounds) {
        const isSmallTerritory = selectedState.code === 'LD' || selectedState.code === 'GA' || selectedState.code === 'PY';
        map.fitBounds(bounds, {
          padding: [45, 45],
          maxZoom: isSmallTerritory ? 10.5 : 9.5,
          animate: true,
          duration: 1.2
        });
      } else if (selectedState.center) {
        map.flyTo(selectedState.center, selectedState.zoom || 8, {
          animate: true,
          duration: 1.2
        });
      }
    } else {
      // Pan-India Overview: instantly zoom out with zero animation, no effects
      map.setView([22.5, 79.5], 5, { animate: false });
    }
  }, [selectedState, resetTrigger, activeClaim, map, statesGeoJson]);

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
  const [hoveredDistrict, setHoveredDistrict] = useState(null);
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
      mapInstance.zoomOut(1, { animate: false });
    }
  };

  const handleFitIndia = () => {
    if (mapInstance) {
      mapInstance.setView([22.5, 79.5], 5, { animate: false });
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

  // Detailed Realistic Districts: Shown for the selected state
  const activeDistrictsGeoJson = useMemo(() => {
    if (!indiaDistrictsGeoJson || !indiaDistrictsGeoJson.features || !selectedState) return null;

    const stateCode = selectedState.code || (selectedState.id ? selectedState.id.replace('IN', '') : null);
    const stateName = (selectedState.name || '').toLowerCase();
    const matching = indiaDistrictsGeoJson.features.filter(f => {
      const p = f.properties || {};
      return (stateCode && p.state_code === stateCode) ||
             (p.state && p.state.toLowerCase() === stateName);
    });
    if (matching.length === 0) return null;
    return {
      type: 'FeatureCollection',
      features: matching
    };
  }, [selectedState]);

  // Filter claims: ONLY show dots when a state is clicked / selected
  const filteredClaims = useMemo(() => {
    if (!selectedState) return [];

    const stateId = selectedState.id || (selectedState.code ? `IN${selectedState.code}` : null);
    const stateCode = selectedState.code || (selectedState.id ? selectedState.id.replace('IN', '') : null);
    const stateName = (selectedState.name || '').toLowerCase();

    return claimsData.filter(claim => {
      const claimStateId = claim.stateId || '';
      const claimStateCode = claimStateId.replace('IN', '');
      const claimStateName = (claim.stateName || '').toLowerCase();

      const matchesState = 
        (stateId && claimStateId === stateId) ||
        (stateCode && claimStateCode === stateCode) ||
        (stateName && claimStateName === stateName);

      if (!matchesState) return false;

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
  }, [claimsData, selectedState, statusFilter]);

  // Dynamic Mask: When a state is selected, mask out everything except that state
  const activeMaskGeoJson = useMemo(() => {
    if (!selectedState) {
      return indiaMaskGeoJson;
    }

    const stateFeature = statesGeoJson?.features?.find(f => 
      f.id === selectedState.id || 
      f.properties?.id === selectedState.id || 
      f.properties?.code === selectedState.code ||
      (selectedState.name && f.properties?.name && selectedState.name.toLowerCase() === f.properties.name.toLowerCase())
    );

    if (!stateFeature || !stateFeature.geometry) {
      return indiaMaskGeoJson;
    }

    const worldRing = [
      [-180.0, 85.0],
      [180.0, 85.0],
      [180.0, -85.0],
      [-180.0, -85.0],
      [-180.0, 85.0]
    ];

    let stateHoles = [];
    if (stateFeature.geometry.type === 'Polygon') {
      stateHoles = [stateFeature.geometry.coordinates[0]];
    } else if (stateFeature.geometry.type === 'MultiPolygon') {
      stateHoles = stateFeature.geometry.coordinates.map(p => p[0]);
    }

    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { name: `Mask outside ${selectedState.name}` },
          geometry: {
            type: "Polygon",
            coordinates: [worldRing, ...stateHoles]
          }
        }
      ]
    };
  }, [selectedState, statesGeoJson]);

  // State Boundary Styling: only the selected state is outlined when active
  const getStateStyle = (feature) => {
    const isSelected = selectedState && (
      selectedState.id === feature.id || 
      selectedState.id === feature.properties?.id ||
      selectedState.code === feature.properties?.code ||
      (selectedState.name && feature.properties?.name && selectedState.name.toLowerCase() === feature.properties.name.toLowerCase())
    );

    // If a state is selected, completely hide other state borders so only the chosen state is on screen
    if (selectedState && !isSelected) {
      return {
        fillColor: 'transparent',
        fillOpacity: 0,
        color: 'transparent',
        weight: 0,
        opacity: 0,
      };
    }

    if (isSelected) {
      return {
        fillColor: 'transparent',
        fillOpacity: 0,
        color: t.accent,
        weight: 2.8,
        opacity: 1.0,
      };
    }

    const isHovered = hoveredState && (
      hoveredState.id === feature.id ||
      hoveredState.id === feature.properties?.id ||
      hoveredState.code === feature.properties?.code
    );

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

  // Detailed Administrative District Boundary Styling (Clean, delicate lines)
  const getDistrictStyle = (feature) => {
    return {
      fillColor: t.accent,
      fillOpacity: 0.04,
      color: t.borderLight || '#9c7d61',
      weight: 1.2,
      opacity: 0.85,
      dashArray: '3, 4'
    };
  };

  // District Hover & Information Tooltip
  const onEachDistrict = (feature, layer) => {
    const p = feature.properties || {};
    layer.on({
      mouseover: (e) => {
        setHoveredDistrict(p);
        e.target.setStyle({
          fillOpacity: 0.20,
          weight: 2.0,
          color: t.stateHover || '#fef08a'
        });
      },
      mouseout: (e) => {
        setHoveredDistrict(null);
        if (districtGeoJsonRef.current) {
          districtGeoJsonRef.current.resetStyle(e.target);
        }
      }
    });

    const areaKm2 = p.total_area_ha ? Math.round(p.total_area_ha / 100).toLocaleString() : null;
    layer.bindTooltip(
      `<div style="font-family: ui-sans-serif, system-ui; font-size: 11px; line-height: 1.4;">
        <div style="font-weight: 700; color: #ffffff; font-size: 12px; margin-bottom: 2px;">${p.name || 'District'} District</div>
        <div style="color: #cbd5e1; font-size: 10px; margin-bottom: 4px;">State: ${p.state || 'India'}</div>
        <div style="display: flex; flex-direction: column; gap: 2px; color: #94a3b8; font-size: 10px;">
          <span>Forest Cover: <strong style="color: #34d399;">${p.forest_cover_pct || 65}%</strong></span>
          <span>Tribal Population: <strong style="color: #60a5fa;">${p.tribal_population_pct || 40}%</strong></span>
          ${areaKm2 ? `<span>Area: <strong style="color: #f1f5f9;">${areaKm2} km²</strong></span>` : ''}
          ${p.claims_count ? `<span>Monitored Units: <strong style="color: #f59e0b;">${p.claims_count}</strong></span>` : ''}
        </div>
      </div>`,
      { sticky: true, opacity: 0.95, className: 'district-leaflet-tooltip' }
    );
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

  // Clean Administrative Marker Colors (No anomaly alarms or pulsing rings)
  // - Green: Approved Titles
  // - Indigo: Community Forest Resource (CFR)
  // - Rose: Disputed / In Review
  // - Amber: Pending Field Verification
  const getMarkerColor = (claim) => {
    const status = claim.status;
    const isCommunity = (claim.claimant_type || claim.type || '').toLowerCase() === 'community';

    if (status === 'approved') {
      return { fill: '#10b981', border: '#059669', label: 'Approved' };
    }
    if (isCommunity) {
      return { fill: '#6366f1', border: '#4338ca', label: 'Community CFR' };
    }
    if (status === 'rejected') {
      return { fill: '#f43f5e', border: '#be123c', label: 'Rejected' };
    }
    return { fill: '#f59e0b', border: '#d97706', label: 'Pending Verification' };
  };

  return (
    <div 
      className="relative w-full h-full overflow-hidden"
      style={{ backgroundColor: t.maskColor }}
    >
      <MapContainer
        center={[22.5, 79.5]}
        zoom={5}
        minZoom={4.2}
        maxZoom={19}
        maxBounds={[ [2.0, 60.0], [39.0, 102.0] ]}
        maxBoundsViscosity={1.0}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
        style={{ backgroundColor: t.maskColor }}
        zoomControl={false}
      >
        <MapController 
          selectedState={selectedState} 
          resetTrigger={resetTrigger}
          activeClaim={activeClaim}
          onMapReady={setMapInstance}
          onZoomChange={setCurrentZoom}
          statesGeoJson={statesGeoJson}
        />
        {/* Primary Basemap Tile Layer - Esri World Imagery Satellite (Smooth zoom, zero glitches) */}
        <TileLayer
          key={baseLayer}
          attribution={basemapTiles[baseLayer].attribution}
          url={basemapTiles[baseLayer].url}
          maxZoom={19}
          noWrap={true}
        />

        {/* Esri Reference Overlay: High-detail place names, district boundaries, topography, and roads on satellite */}
        {baseLayer === 'satellite' && (
          <TileLayer
            key="esri-reference-overlay"
            url={getEsriReferenceUrl()}
            attribution=""
            maxZoom={19}
            opacity={0.82}
            zIndex={400}
          />
        )}

        {/* Dynamic Inverted Mask: Smoothly isolates selected state or entire India */}
        <GeoJSON
          key={`mask-${selectedState ? (selectedState.id || selectedState.code || selectedState.name) : 'all-india'}-${t.maskColor}`}
          data={activeMaskGeoJson}
          style={{
            fillColor: t.maskColor,
            fillOpacity: 1.0,
            color: t.maskColor,
            weight: 0.5,
            opacity: 1.0
          }}
          interactive={false}
        />

        {/* India States Boundary Layer */}
        <GeoJSON
          key={`states-geojson-${selectedState ? (selectedState.id || selectedState.code) : 'all'}-${t.maskColor}`}
          ref={geoJsonRef}
          data={statesGeoJson}
          style={getStateStyle}
          onEachFeature={onEachState}
        />

        {/* Detailed Administrative District Boundaries Layer */}
        {activeDistrictsGeoJson && (
          <GeoJSON
            key={`districts-${selectedState ? (selectedState.code || selectedState.id) : 'all'}-${activeDistrictsGeoJson.features?.length}-${t.maskColor}`}
            ref={districtGeoJsonRef}
            data={activeDistrictsGeoJson}
            style={getDistrictStyle}
            onEachFeature={onEachDistrict}
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

              {/* Selection Halo for Active Selected Claim */}
              {isCurrentActive && (
                <CircleMarker
                  center={coords}
                  radius={14}
                  pathOptions={{
                    color: '#38bdf8',
                    fillColor: '#38bdf8',
                    fillOpacity: 0.25,
                    weight: 2,
                    dashArray: '3, 3'
                  }}
                />
              )}

              {/* Main Claim Circle Marker */}
              <CircleMarker
                center={coords}
                radius={isCommunity ? 7.5 : 5.5}
                eventHandlers={{
                  click: () => onSelectClaim && onSelectClaim(claim)
                }}
                pathOptions={{
                  fillColor: colors.fill,
                  fillOpacity: 0.95,
                  color: isCurrentActive ? '#ffffff' : colors.border,
                  weight: isCurrentActive ? 2.8 : 1.2,
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
                        'bg-slate-700/50 text-slate-300 border border-slate-600'
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

                    <div className="grid grid-cols-2 gap-1 text-[10px] mb-0.5">
                      <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                        <span className="text-slate-400 block text-[9px]">District</span>
                        <span className="font-semibold text-slate-200 uppercase">{claim.district_id || claim.districtName || 'Territory'}</span>
                      </div>
                      <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                        <span className="text-slate-400 block text-[9px]">Verification Age</span>
                        <span className="font-bold text-slate-200">
                          {daysPending} days
                        </span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            </React.Fragment>
          );
        })}

        {/* Lakshadweep Islands Archipelago Markers (Visible ONLY when Lakshadweep is selected) */}
        {selectedState && (selectedState.code === 'LD' || selectedState.id === 'INLD') && LAKSHADWEEP_ISLANDS.map((isl) => {
          const isLdSelected = true;
          return (
            <React.Fragment key={isl.name}>
              {/* Subtle outer halo for islands */}
              <CircleMarker
                center={isl.coords}
                radius={currentZoom >= 7 ? 12 : (isl.isCapital || isLdSelected ? 8 : 6)}
                pathOptions={{
                  color: isLdSelected ? t.accent : t.stateStroke,
                  fillColor: t.accent,
                  fillOpacity: isLdSelected ? 0.35 : 0.15,
                  weight: 1,
                  dashArray: '2, 2'
                }}
                interactive={false}
              />
              {/* Island Point Marker */}
              <CircleMarker
                center={isl.coords}
                radius={currentZoom >= 7 ? 6 : (isl.isCapital ? 4.5 : 3.5)}
                eventHandlers={{
                  click: () => {
                    const ld = {
                      id: 'INLD',
                      code: 'LD',
                      name: 'Lakshadweep',
                      center: [10.56, 72.64],
                      zoom: 9
                    };
                    onSelectState(ld);
                  },
                  mouseover: () => setHoveredState({ id: 'INLD', code: 'LD', name: 'Lakshadweep' }),
                  mouseout: () => setHoveredState(null)
                }}
                pathOptions={{
                  fillColor: isLdSelected ? t.accent : '#ffffff',
                  fillOpacity: 0.95,
                  color: isLdSelected ? '#ffffff' : t.stateStroke,
                  weight: 2
                }}
              >
                <Popup className="custom-leaflet-popup">
                  <div className="text-slate-200 text-xs font-mono">
                    <div className="font-bold text-white mb-0.5">{isl.name} Island</div>
                    <div className="text-[10px]" style={{ color: t.textSecondary }}>Lakshadweep Union Territory</div>
                  </div>
                </Popup>
              </CircleMarker>
            </React.Fragment>
          );
        })}
      </MapContainer>

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

      {/* Bottom-Left Information Pill */}
      <div className="absolute bottom-6 left-6 z-[1000] select-none">
        <div 
          onClick={selectedState ? onResetAllIndia : undefined}
          className={`rounded-full px-4 py-1.5 text-xs font-mono shadow-2xl tracking-wide flex items-center gap-2 border backdrop-blur-md transition ${
            selectedState ? 'cursor-pointer hover:bg-white/10' : 'pointer-events-none'
          }`}
          style={{
            backgroundColor: t.pillBg,
            borderColor: t.pillBorder,
            color: t.textSecondary
          }}
          title={selectedState ? "Click to return to All-India overview" : undefined}
        >
          {hoveredDistrict ? (
            <>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: t.accent }} />
              <span className="font-semibold text-white">{hoveredDistrict.name} District</span>
              <span style={{ color: t.textMuted }}>•</span>
              <span style={{ color: '#34d399' }}>Forest: {hoveredDistrict.forest_cover_pct}%</span>
              <span style={{ color: t.textMuted }}>•</span>
              <span style={{ color: '#60a5fa' }}>Tribal: {hoveredDistrict.tribal_population_pct}%</span>
            </>
          ) : hoveredState ? (
            <>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: t.accent }} />
              <span className="font-semibold text-white">{hoveredState.name}</span>
              <span style={{ color: t.textMuted }}>•</span>
              <span>Click to view state</span>
            </>
          ) : selectedState ? (
            <>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.accent }} />
              <span className="font-semibold text-white">{selectedState.name}</span>
              <span style={{ color: t.textMuted }}>•</span>
              <span className="underline decoration-dotted">Click to return to All-India view</span>
            </>
          ) : (
            <>
              <span>Hover a state to view details</span>
              <span style={{ color: t.textMuted }}>•</span>
              <span>Click to view state</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
