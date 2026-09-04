import React, { useState } from 'react';
import Header from './components/Header';
import IndiaVectorMap from './components/IndiaVectorMap';
import WebGISMap from './components/WebGISMap';
import DecisionSidebar from './components/DecisionSidebar';
import DistrictAIModal from './components/DistrictAIModal';
import { ALL_INDIA_STATES, NATIONAL_SUMMARY, MOCK_CLAIMS, INDIA_STATES_GEOJSON } from './data/mockData';
import { Map, Globe } from 'lucide-react';

export default function App() {
  const [selectedState, setSelectedState] = useState(null);
  const [activeClaim, setActiveClaim] = useState(null);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [mapMode, setMapMode] = useState('vector'); // 'vector' (matches user's image) | 'satellite' (Leaflet)
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const handleSelectState = (stateProps) => {
    // Match by code or id if needed
    const found = ALL_INDIA_STATES.find(s => s.id === stateProps.id || s.code === stateProps.code);
    setSelectedState(found || stateProps);
    setActiveClaim(null);
  };

  const handleResetAllIndia = () => {
    setSelectedState(null);
    setActiveClaim(null);
    setResetTrigger(prev => prev + 1);
  };

  const handleSelectClaim = (claim) => {
    setActiveClaim(claim);
    const parentState = ALL_INDIA_STATES.find(s => s.id === claim.stateId || s.code === claim.stateId.replace('IN', ''));
    if (parentState) {
      setSelectedState(parentState);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 overflow-hidden font-sans">
      {/* Top Header */}
      <Header
        selectedState={selectedState}
        statesList={ALL_INDIA_STATES}
        onSelectState={handleSelectState}
        onResetAllIndia={handleResetAllIndia}
        onOpenAiModal={() => setIsAiModalOpen(true)}
      />

      {/* Main Workspace (Map on Left ~68%, Sidebar on Right ~32%) */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left Map Area */}
        <div className="flex-1 lg:w-[68%] h-full relative">
          {/* Map View Switcher Floating Button */}
          <div className="absolute top-4 right-52 z-30 flex items-center bg-slate-950/80 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-lg text-xs">
            <button
              onClick={() => setMapMode('vector')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition ${
                mapMode === 'vector' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>State Vector Map</span>
            </button>
            <button
              onClick={() => setMapMode('satellite')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition ${
                mapMode === 'satellite' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Satellite WebGIS</span>
            </button>
          </div>

          {/* Render Vector Map (Default, matching image) or Satellite WebGIS */}
          {mapMode === 'vector' ? (
            <IndiaVectorMap
              statesList={ALL_INDIA_STATES}
              selectedState={selectedState}
              onSelectState={handleSelectState}
              onResetAllIndia={handleResetAllIndia}
              claims={MOCK_CLAIMS}
              activeClaim={activeClaim}
              onSelectClaim={handleSelectClaim}
            />
          ) : (
            <WebGISMap
              statesGeoJson={INDIA_STATES_GEOJSON}
              claimsData={MOCK_CLAIMS}
              selectedState={selectedState}
              onSelectState={handleSelectState}
              onResetAllIndia={handleResetAllIndia}
              resetTrigger={resetTrigger}
              activeClaim={activeClaim}
              onSelectClaim={handleSelectClaim}
            />
          )}
        </div>

        {/* Right Decision Support Sidebar */}
        <div className="w-full lg:w-[32%] h-full shrink-0">
          <DecisionSidebar
            selectedState={selectedState}
            statesList={ALL_INDIA_STATES}
            onSelectState={handleSelectState}
            onResetAllIndia={handleResetAllIndia}
            nationalSummary={NATIONAL_SUMMARY}
            claims={MOCK_CLAIMS}
            activeClaim={activeClaim}
            onSelectClaim={handleSelectClaim}
          />
        </div>
      </main>

      {/* District Gemini AI FastApi Decision Support Modal */}
      <DistrictAIModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />
    </div>
  );
}
