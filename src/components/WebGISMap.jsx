import React, { useEffect, useRef, useState } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  GeoJSON, 
  CircleMarker, 
  Popup, 
  useMap 
} from 'react-leaflet';
import { 
  User, 
  Users, 
  AlertTriangle, 
  RotateCcw,
  Globe
} from 'lucide-react';
import MapLegend from './MapLegend';
import { 
  getEsriImageryUrl, 
  getEsriReferenceUrl, 
  ESRI_ATTRIBUTION 
} from '../config/esriConfig';

// Controller to smoothly animate map camera
function MapController({ selectedState, resetTrigger, activeClaim }) {
  const map = useMap();

  useEffect(() => {
    if (activeClaim && activeClaim.coordinates) {
      map.flyTo(activeClaim.coordinates, 10, {
        animate: true,
        duration: 1.2
      });
    } else if (selectedState && selectedState.center) {
      map.flyTo(selectedState.center, selectedState.zoom || 7, {
        animate: true,
        duration: 1.2
      });
    } else {
      // Pan-India Overview (Centered on India)
      map.flyTo([22.0, 79.5], 5, {
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
  // Default to pure daylight satellite view (NO dark mode)
  const [baseLayer, setBaseLayer] = useState('satellite'); // 'satellite' | 'topo' | 'osm'
  const geoJsonRef = useRef(null);

  // Basemap Tile Layers (Natural daylight colors - No dark filter on satellite)
  const basemapTiles = {
    satellite: {
      url: getEsriImageryUrl(),
      referenceUrl: getEsriReferenceUrl(),
      attribution: ESRI_ATTRIBUTION
    },
    topo: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
    },
    osm: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors'
    }
  };

  // Filter claims
  const filteredClaims = claimsData.filter(claim => {
    if (selectedState && claim.stateId !== selectedState.id) {
      return false;
    }
    if (statusFilter !== 'all' && claim.status !== statusFilter) {
      return false;
    }
    return true;
  });

  // Dynamic Polygon Styling (Clean borders without dark masks)
  // Dynamic Polygon Styling (Clean borders without dark masks)
  const getStateStyle = (feature) => {
    const isSelected = selectedState && (
      selectedState.id === feature.id || 
      selectedState.id === feature.properties?.id ||
      selectedState.code === feature.properties?.code
    );
    const isCritical = feature.properties?.aiAnalysis?.severity === 'critical';

    if (selectedState) {
      if (isSelected) {
        return {
          fillColor: '#2563eb',
          fillOpacity: 0.22,
          color: '#60a5fa',
          weight: 2.8,
          dashArray: '3, 3',
          opacity: 1,
        };
      }
      return {
        fillColor: '#000000',
        fillOpacity: 0,
        color: '#ffffff',
        weight: 0.5,
        opacity: 0.25,
      };
    }

    // Default Pan-India View (Clean transparent satellite viewing)
    return {
      fillColor: isCritical ? '#f43f5e' : '#10b981',
      fillOpacity: 0.03,
      color: '#ffffff',
      weight: 0.9,
      dashArray: '2, 2',
      opacity: 0.65,
    };
  };

  const onEachState = (feature, layer) => {
    layer.on({
      click: () => {
        onSelectState(feature.properties);
      },
      mouseover: (e) => {
        const target = e.target;
        target.setStyle({
          fillOpacity: 0.25,
          weight: 2.5,
          color: '#38bdf8'
        });
      },
      mouseout: (e) => {
        if (geoJsonRef.current) {
          geoJsonRef.current.resetStyle(e.target);
        }
      }
    });
  };

  const getMarkerColor = (status) => {
    switch (status) {
      case 'approved':
        return { fill: '#10b981', border: '#059669', pulse: false };
      case 'pending':
        return { fill: '#f59e0b', border: '#d97706', pulse: false };
      case 'delayed':
        return { fill: '#ef4444', border: '#b91c1c', pulse: true };
      default:
        return { fill: '#94a3b8', border: '#64748b', pulse: false };
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-900">
      <MapContainer
        center={[22.0, 79.5]}
        zoom={5}
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

        {/* Primary Basemap Tile Layer - Esri World Imagery (No Dark Mode!) */}
        <TileLayer
          key={baseLayer}
          attribution={basemapTiles[baseLayer].attribution}
          url={basemapTiles[baseLayer].url}
          maxZoom={19}
        />

        {/* Optional Esri Boundary and Places Reference Overlay for Satellite */}
        {baseLayer === 'satellite' && basemapTiles.satellite.referenceUrl && (
          <TileLayer
            key="ref-layer"
            url={basemapTiles.satellite.referenceUrl}
            opacity={0.8}
            maxZoom={19}
          />
        )}

        {/* State Boundaries GeoJSON Layer (State names permanently removed from map) */}
        <GeoJSON
          key={`states-geojson-${selectedState ? selectedState.id : 'all'}`}
          ref={geoJsonRef}
          data={statesGeoJson}
          style={getStateStyle}
          onEachFeature={onEachState}
        />

        {/* Plotted Claims Across India */}
        {filteredClaims.map((claim) => {
          const colors = getMarkerColor(claim.status);
          const isCurrentActive = activeClaim && activeClaim.id === claim.id;

          return (
            <React.Fragment key={claim.id}>
              {/* Outer pulsing ring for delayed claims or actively inspected claims */}
              {(colors.pulse || isCurrentActive) && (
                <CircleMarker
                  center={claim.coordinates}
                  radius={isCurrentActive ? 16 : 11}
                  pathOptions={{
                    color: colors.fill,
                    fillColor: colors.fill,
                    fillOpacity: 0.3,
                    weight: 1.5,
                    dashArray: '3, 3'
                  }}
                />
              )}

              {/* Main Claim Marker */}
              <CircleMarker
                center={claim.coordinates}
                radius={claim.type === 'community' ? 7.5 : 5.5}
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
                  <div className="w-60 text-slate-200">
                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800">
                      <div className="flex items-center gap-1.5">
                        {claim.type === 'community' ? (
                          <span className="p-1 rounded bg-indigo-500/20 text-indigo-300">
                            <Users className="w-3 h-3" />
                          </span>
                        ) : (
                          <span className="p-1 rounded bg-emerald-500/20 text-emerald-300">
                            <User className="w-3 h-3" />
                          </span>
                        )}
                        <div>
                          <p className="text-[10px] font-mono text-slate-400 leading-none">
                            {claim.id}
                          </p>
                          <span className="text-[9px] font-semibold text-slate-300 uppercase">
                            {claim.type === 'community' ? 'Community Right (CFR)' : 'Individual Right (IFR)'}
                          </span>
                        </div>
                      </div>

                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full capitalize ${
                        claim.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                        claim.status === 'pending' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                        'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}>
                        {claim.status}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-white mb-1">
                      {claim.claimantName}
                    </p>

                    <div className="grid grid-cols-2 gap-1 text-[10px] mb-1.5">
                      <div className="bg-slate-900/80 p-1 rounded border border-slate-800">
                        <span className="text-slate-400 block text-[9px]">Location</span>
                        <span className="font-medium text-slate-200">{claim.districtName}, {claim.stateName}</span>
                      </div>
                      <div className="bg-slate-900/80 p-1 rounded border border-slate-800">
                        <span className="text-slate-400 block text-[9px]">Area / Tribe</span>
                        <span className="font-bold text-emerald-400">{claim.areaHa} Ha ({claim.tribe})</span>
                      </div>
                    </div>

                    {claim.delayReason && (
                      <div className="bg-rose-950/40 border border-rose-500/30 rounded p-1.5 text-[10px] text-rose-200">
                        <span className="font-bold text-rose-400">⚠️ Anomaly: </span>
                        {claim.delayReason}
                      </div>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* Top-Right Basemap Switcher & Esri API Key Config */}
      <div className="absolute top-5 right-5 z-[1000] flex items-center gap-2">
        {/* Reset / All India */}
        <button
          onClick={onResetAllIndia}
          className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 hover:text-white flex items-center gap-1.5 shadow-lg transition"
          title="Fit All India"
        >
          <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
          <span>India View</span>
        </button>

        {/* Basemap Selection Chips (Daylight Natural Colors) */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-xl p-1 flex items-center gap-1 text-xs">
          <button
            onClick={() => setBaseLayer('satellite')}
            className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
              baseLayer === 'satellite' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
            title="Esri World Imagery (High-Resolution Satellite - Natural Color)"
          >
            <Globe className="w-3 h-3" />
            <span>Esri Satellite</span>
          </button>
          <button
            onClick={() => setBaseLayer('topo')}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              baseLayer === 'topo' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
            title="Esri World Topographic Map"
          >
            Topo
          </button>
          <button
            onClick={() => setBaseLayer('osm')}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              baseLayer === 'osm' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
            title="OpenStreetMap Street View"
          >
            Street
          </button>
        </div>
      </div>

      {/* Bottom-Left Simple Legend */}
      <MapLegend
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        claimsCount={filteredClaims.length}
        totalClaims={claimsData.length}
      />
    </div>
  );
}
