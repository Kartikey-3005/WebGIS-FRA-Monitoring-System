import React, { useState } from 'react';
import { Search, ChevronRight, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function StateInspectionSidebar({
  selectedState,
  statesList = [],
  onSelectState = () => {},
  claims = [],
  onViewClaims = () => {},
  theme
}) {
  const [searchQuery, setSearchQuery] = useState('');

  // Fallback to Manipur or first state if nothing is selected yet
  const activeState = selectedState || statesList.find(s => s.code === 'MN') || statesList[0] || {
    id: 'INMN',
    code: 'MN',
    name: 'Manipur',
    districtsCount: 16,
    activeVillages: 14,
    titledLandHa: 131.7,
    totalClaims: 16,
    approvedClaims: 6,
    pendingClaims: 10,
    delayedClaims: 3,
    scheduledReviews: 3,
    fieldSurveys: 3,
    tenureTypes: { ifr: 15, cfr: 1 },
    forestCoverKm2: '16,598 km²',
    tribalPopulationPct: '35.1%',
    description: 'Hill areas customary tribal land management systems.',
    alertMessage: '3 cadastral units scheduled for field boundary verification. 10 claims under administrative review across 16 districts.'
  };

  // State claims count
  const stateClaimsCount = claims.filter(c => c.stateId === activeState.id || (c.stateName && c.stateName.toLowerCase() === activeState.name.toLowerCase())).length || activeState.totalClaims || 16;

  // Filter states list for Quick State Jump
  const filteredStates = statesList.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
  });

  return (
    <div className="w-full h-full flex flex-col gap-4 p-4 md:p-6 overflow-y-auto select-none font-sans">
      {/* =========================================================================
          CARD 1: SELECTED STATE INSPECTION PANEL
         ========================================================================= */}
      <div 
        className="rounded-2xl p-5 border shadow-2xl transition-all duration-300 flex flex-col gap-4"
        style={{
          backgroundColor: theme.surface,
          borderColor: theme.surfaceBorder
        }}
      >
        {/* Top Header: Tag & Code Badge */}
        <div className="flex items-center justify-between">
          <span 
            className="text-[10px] font-mono tracking-widest uppercase font-bold"
            style={{ color: theme.textSecondary, opacity: 0.7 }}
          >
            SELECTED STATE
          </span>

          <span 
            className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border"
            style={{ 
              backgroundColor: theme.surfaceMuted,
              borderColor: theme.borderLight,
              color: theme.textSecondary 
            }}
          >
            {activeState.code} • {activeState.districtsCount || 16} Districts
          </span>
        </div>

        {/* State Title & Subtitle */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-1">
            {activeState.name}
          </h2>
          <p 
            className="text-xs leading-relaxed"
            style={{ color: theme.textSecondary, opacity: 0.85 }}
          >
            {activeState.description || 'Hill areas customary tribal land management systems and community tenure.'}
          </p>
        </div>

        {/* 3 Metrics Cards in a Row */}
        <div className="grid grid-cols-3 gap-2">
          {/* Box 1: Total Forest Area */}
          <div 
            className="p-3 rounded-xl border flex flex-col justify-between"
            style={{ 
              backgroundColor: theme.surfaceMuted, 
              borderColor: theme.surfaceBorder 
            }}
          >
            <span className="text-[9px] font-mono uppercase tracking-wider font-semibold" style={{ color: theme.textSecondary, opacity: 0.7 }}>
              TOTAL FOREST AREA
            </span>
            <div className="my-0.5">
              <span className="text-sm font-bold text-white">
                {activeState.titledLandHa || 131.7}
              </span>
              <span className="text-xs font-normal text-white/70 ml-1">ha</span>
            </div>
            <span className="text-[9px]" style={{ color: theme.textMuted }}>
              Claimed forest land
            </span>
          </div>

          {/* Box 2: Districts */}
          <div 
            className="p-3 rounded-xl border flex flex-col justify-between"
            style={{ 
              backgroundColor: theme.surfaceMuted, 
              borderColor: theme.surfaceBorder 
            }}
          >
            <span className="text-[9px] font-mono uppercase tracking-wider font-semibold" style={{ color: theme.textSecondary, opacity: 0.7 }}>
              DISTRICTS
            </span>
            <div className="my-0.5">
              <span className="text-sm font-bold text-white">
                {activeState.districtsCount || 16}
              </span>
              <span className="text-xs font-normal text-white/70 ml-1">active</span>
            </div>
            <span className="text-[9px]" style={{ color: theme.textMuted }}>
              {activeState.activeVillages || 14} villages
            </span>
          </div>

          {/* Box 3: Tenure Types */}
          <div 
            className="p-3 rounded-xl border flex flex-col justify-between"
            style={{ 
              backgroundColor: theme.surfaceMuted, 
              borderColor: theme.surfaceBorder 
            }}
          >
            <span className="text-[9px] font-mono uppercase tracking-wider font-semibold" style={{ color: theme.textSecondary, opacity: 0.7 }}>
              TENURE TYPES
            </span>
            <div className="my-0.5">
              <span className="text-sm font-bold text-white">
                {activeState.tenureTypes?.ifr || 15}
              </span>
              <span className="text-xs font-normal text-white/70 ml-1">IFR</span>
            </div>
            <span className="text-[9px]" style={{ color: theme.textMuted }}>
              {activeState.tenureTypes?.cfr || 1} CFR
            </span>
          </div>
        </div>

        {/* Key Statistics Table / Rows */}
        <div className="flex flex-col gap-2 pt-1 border-t" style={{ borderColor: theme.surfaceBorder }}>
          {/* Total Monitored Claims */}
          <div className="flex items-center justify-between text-xs font-mono">
            <span style={{ color: theme.textSecondary, opacity: 0.85 }}>Total Monitored Claims:</span>
            <span className="font-bold text-white">{activeState.totalClaims || 16}</span>
          </div>

          {/* Title Granted / Approved */}
          <div className="flex items-center justify-between text-xs font-mono">
            <span style={{ color: theme.textSecondary, opacity: 0.85 }}>Title Granted / Approved:</span>
            <span className="font-bold text-emerald-400">{activeState.approvedClaims || 6}</span>
          </div>

          {/* Pending Verification */}
          <div className="flex items-center justify-between text-xs font-mono">
            <span style={{ color: theme.textSecondary, opacity: 0.85 }}>Pending Verification:</span>
            <span className="font-bold text-white">{activeState.pendingClaims || 10}</span>
          </div>

          {/* Field Verification Pending */}
          <div className="flex items-center justify-between text-xs font-mono">
            <span style={{ color: theme.textSecondary, opacity: 0.85 }}>Field Verification Pending:</span>
            <span className="font-bold text-white">{activeState.fieldSurveys ?? activeState.delayedClaims ?? 3}</span>
          </div>

          {/* Scheduled DLC Reviews */}
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="flex items-center gap-1.5 font-medium" style={{ color: theme.textSecondary }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.accent }} />
              Scheduled DLC Reviews:
            </span>
            <span className="font-bold text-white">{activeState.scheduledReviews ?? activeState.criticalAlerts ?? 3}</span>
          </div>
        </div>

        {/* 2-Column Mini Metrics Box */}
        <div 
          className="grid grid-cols-2 gap-4 p-3 rounded-xl border"
          style={{ 
            backgroundColor: theme.surfaceMuted, 
            borderColor: theme.surfaceBorder 
          }}
        >
          <div>
            <span className="text-[9px] font-mono block" style={{ color: theme.textMuted }}>
              Forest Cover (FSI)
            </span>
            <span className="text-xs font-bold text-white">
              {activeState.forestCoverKm2 || '16,598 km²'}
            </span>
          </div>
          <div>
            <span className="text-[9px] font-mono block" style={{ color: theme.textMuted }}>
              Tribal Population
            </span>
            <span className="text-xs font-bold text-white">
              {activeState.tribalPopulationPct || '35.1%'}
            </span>
          </div>
        </div>

        {/* Administrative Summary Banner */}
        <div 
          className="p-3 rounded-xl border text-[11px] leading-relaxed font-sans"
          style={{ 
            backgroundColor: theme.surfaceMuted, 
            borderColor: theme.surfaceBorder,
            color: theme.textSecondary,
            opacity: 0.95
          }}
        >
          {activeState.alertMessage 
            ? activeState.alertMessage.replace(/⚠️|Critical Anomaly:|Anomaly Flagged:|Anomaly Detected:|flagged by ML/gi, '').trim()
            : `${activeState.name} cadastral surveys and community forest resource recognition active across ${activeState.districtsCount || 16} districts.`}
        </div>

        {/* Big Orange / Theme Action Button */}
        <button
          onClick={() => onViewClaims && onViewClaims(activeState)}
          className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-2 shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          style={{ 
            backgroundColor: theme.buttonColor,
            boxShadow: `0 10px 25px -5px ${theme.buttonColor}40`
          }}
        >
          <span>View {activeState.name} Monitoring ({stateClaimsCount} Claims)</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* =========================================================================
          CARD 2: QUICK STATE JUMP
         ========================================================================= */}
      <div 
        className="rounded-2xl p-5 border shadow-2xl flex-1 flex flex-col min-h-[300px]"
        style={{
          backgroundColor: theme.surface,
          borderColor: theme.surfaceBorder
        }}
      >
        {/* Header with Search */}
        <div className="flex items-center justify-between gap-2 pb-3 mb-2 border-b" style={{ borderColor: theme.surfaceBorder }}>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              QUICK STATE JUMP
            </span>
            <span 
              className="px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold"
              style={{
                backgroundColor: `${theme.accent}25`,
                color: theme.accent,
                border: `1px solid ${theme.accent}40`
              }}
            >
              36 States & UTs
            </span>
          </div>

          {/* Search Bar */}
          <div 
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs w-36 sm:w-44 transition focus-within:border-amber-500"
            style={{ 
              backgroundColor: theme.surfaceMuted,
              borderColor: theme.borderLight
            }}
          >
            <Search className="w-3.5 h-3.5 shrink-0" style={{ color: theme.textMuted }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="bg-transparent border-none outline-none text-xs text-white placeholder:text-stone-500 w-full font-mono"
            />
          </div>
        </div>

        {/* Scrollable State List */}
        <div className="flex-1 overflow-y-auto flex flex-col divide-y" style={{ borderColor: `${theme.surfaceBorder}60` }}>
          {filteredStates.map((state) => {
            const isSelected = activeState.id === state.id || activeState.code === state.code;
            const hasAlert = (state.criticalAlerts && state.criticalAlerts > 0) || state.code === 'MN' || state.code === 'AS' || state.code === 'AP' || state.code === 'BR';
            const alertCount = state.criticalAlerts || (state.code === 'MN' ? 3 : 1);
            const claimCount = state.totalClaims || 16;

            return (
              <button
                key={state.id || state.code}
                onClick={() => onSelectState(state)}
                className={`w-full py-2.5 px-2 flex items-center justify-between text-left transition group rounded-lg ${
                  isSelected ? 'bg-white/5' : 'hover:bg-white/[0.03]'
                }`}
              >
                {/* State Name with Dot */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <span 
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      hasAlert ? 'bg-rose-500' : 'bg-emerald-400'
                    }`}
                  />
                  <span 
                    className={`text-xs font-medium truncate font-sans transition ${
                      isSelected ? 'text-white font-bold' : 'text-stone-300 group-hover:text-white'
                    }`}
                  >
                    {state.name}
                  </span>
                </div>

                {/* Right Badges */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {hasAlert && (
                    <span 
                      className="px-1.5 py-0.2 rounded text-[9px] font-mono font-medium border"
                      style={{
                        backgroundColor: 'rgba(244, 63, 94, 0.12)',
                        borderColor: 'rgba(244, 63, 94, 0.35)',
                        color: '#fb7185'
                      }}
                    >
                      {alertCount} alert{alertCount > 1 ? 's' : ''}
                    </span>
                  )}
                  <span 
                    className="px-1.5 py-0.2 rounded text-[9px] font-mono"
                    style={{
                      backgroundColor: theme.surfaceMuted,
                      color: theme.textMuted
                    }}
                  >
                    {claimCount} claims
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
