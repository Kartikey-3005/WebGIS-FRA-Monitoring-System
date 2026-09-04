import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Bot, 
  AlertTriangle, 
  CheckCircle2, 
  Server, 
  RefreshCw, 
  FileText, 
  Layers,
  Terminal,
  ExternalLink
} from 'lucide-react';
import { analyzeDistrict, fetchClaimsByDistrict, API_BASE_URL } from '../services/fraApi';

export default function DistrictAIModal({ isOpen, onClose }) {
  const [selectedDistrictId, setSelectedDistrictId] = useState('DIST_001');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [claimsGeoJson, setClaimsGeoJson] = useState(null);
  const [backendOnline, setBackendOnline] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const districts = [
    { id: 'DIST_001', name: 'Dindori', anomaly: true, desc: 'High SDLC Pending Backlog (Anomaly)' },
    { id: 'DIST_002', name: 'Mandla', anomaly: false, desc: 'High Titling Rate (70% Approved)' },
    { id: 'DIST_003', name: 'Balaghat', anomaly: false, desc: 'Balanced Implementation Circle' }
  ];

  // Test backend connection on open
  useEffect(() => {
    if (isOpen) {
      checkBackend();
    }
  }, [isOpen]);

  const checkBackend = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/`);
      if (res.ok) {
        setBackendOnline(true);
      } else {
        setBackendOnline(false);
      }
    } catch {
      setBackendOnline(false);
    }
  };

  const handleRunAnalysis = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      // Call POST /api/analyze/{district_id}
      const data = await analyzeDistrict(selectedDistrictId);
      setAnalysisResult(data);

      // Also fetch claims GeoJSON
      const claims = await fetchClaimsByDistrict(selectedDistrictId);
      setClaimsGeoJson(claims);
      setBackendOnline(true);
    } catch (err) {
      console.error(err);
      setErrorMessage(
        `Could not reach backend at ${API_BASE_URL}. Ensure you ran: uvicorn main:app --reload`
      );
      setBackendOnline(false);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-700 text-white shadow-lg shadow-indigo-950/50">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                FastAPI + Gemini AI Decision Support
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Backend API v1.0
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Live endpoint testing: POST /api/analyze/{'{district_id}'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
              backendOnline 
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
            }`}>
              <Server className="w-3 h-3" />
              <span>{backendOnline ? 'Backend Online (Port 8000)' : 'Backend Standby'}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* District Selection Bar */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Select District for AI Anomaly Detection:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {districts.map((dist) => (
                <button
                  key={dist.id}
                  onClick={() => {
                    setSelectedDistrictId(dist.id);
                    setAnalysisResult(null);
                  }}
                  className={`p-3 rounded-xl border text-left transition ${
                    selectedDistrictId === dist.id
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm">{dist.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900/80 text-slate-400">
                      {dist.id}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1 leading-snug">
                    {dist.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Action Trigger */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={handleRunAnalysis}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-950/60 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Prompting Gemini API (Ministry of Tribal Affairs Context)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Gemini AI Decision Report for {districts.find(d => d.id === selectedDistrictId)?.name}</span>
                </>
              )}
            </button>
          </div>

          {/* Error / Instructions Banner if Backend is offline */}
          {errorMessage && (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3.5 text-xs text-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Backend Server Needs to be Running:</span>
              </div>
              <p className="text-[11px] text-slate-300">
                In your terminal, start the FastAPI server with:
              </p>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-emerald-400 text-[11px] flex items-center justify-between">
                <span>uvicorn main:app --reload --port 8000</span>
                <Terminal className="w-3.5 h-3.5 text-slate-500" />
              </div>
            </div>
          )}

          {/* Analysis Results Display */}
          {analysisResult && (
            <div className="space-y-3 animate-in fade-in duration-300">
              {/* Executive Summary */}
              <div className="rounded-xl bg-gradient-to-br from-indigo-950/50 to-slate-900 border border-indigo-500/40 p-4 shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Ministry Executive Decision-Support Report
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {analysisResult.ai_engine}
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-sans bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                  {analysisResult.ai_anomaly_report}
                </p>
              </div>

              {/* District Summary Statistics Table */}
              <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3.5">
                <h4 className="text-[11px] font-semibold text-slate-400 mb-2.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Computed District Metrics:</span>
                </h4>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Total Claims</span>
                    <span className="text-sm font-bold text-white">{analysisResult.statistics.total_claims}</span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Pending</span>
                    <span className="text-sm font-bold text-amber-400">
                      {analysisResult.statistics.pending_percentage}%
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Approved</span>
                    <span className="text-sm font-bold text-emerald-400">
                      {analysisResult.statistics.approved_percentage}%
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Avg Backlog</span>
                    <span className="text-sm font-bold text-rose-400">
                      {analysisResult.statistics.avg_days_pending}d
                    </span>
                  </div>
                </div>
              </div>

              {/* GeoJSON Data Verification */}
              {claimsGeoJson && (
                <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3 text-xs flex items-center justify-between text-slate-400">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span>GeoJSON Point Features retrieved: <strong className="text-white">{claimsGeoJson.total_features} claims</strong></span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">FeatureCollection ready</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between text-xs text-slate-400">
          <span>Documentation: <a href={`${API_BASE_URL}/docs`} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline inline-flex items-center gap-0.5">FastAPI Swagger <ExternalLink className="w-3 h-3" /></a></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
