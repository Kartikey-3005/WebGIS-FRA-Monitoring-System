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
  ExternalLink,
  Flame,
  Clock,
  Ban,
  ShieldCheck
} from 'lucide-react';
import { analyzeDistrict, fetchClaimsByDistrict, fetchDistricts, API_BASE_URL } from '../services/fraApi';

export default function DistrictAIModal({ isOpen, onClose }) {
  const [selectedDistrictId, setSelectedDistrictId] = useState('dist_a');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [claimsGeoJson, setClaimsGeoJson] = useState(null);
  const [backendOnline, setBackendOnline] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Default curated 4 districts
  const [districtsList, setDistrictsList] = useState([
    { 
      id: 'dist_a', 
      name: 'District A (Dindori)', 
      flag: 'HIGH_PENDING_DELAY', 
      desc: '78% Pending Delay (620 Days Backlog)',
      severity: 'critical'
    },
    { 
      id: 'dist_b', 
      name: 'District B (Mandla)', 
      flag: 'ABNORMAL_REJECTION_SPIKE', 
      desc: '82% Rejection Spike within 14 Days',
      severity: 'critical'
    },
    { 
      id: 'dist_c', 
      name: 'District C (Korba)', 
      flag: 'FOREST_COVER_LOSS_ON_CLAIM', 
      desc: '42.5% Deforestation on Pending CFR',
      severity: 'critical'
    },
    { 
      id: 'dist_d', 
      name: 'District D (Balaghat)', 
      flag: 'NORMAL', 
      desc: 'Benchmark Control Group (65 Days Turnaround)',
      severity: 'nominal'
    }
  ]);

  // Test backend connection & fetch live districts on open
  useEffect(() => {
    if (isOpen) {
      checkBackendAndLoadDistricts();
    }
  }, [isOpen]);

  const checkBackendAndLoadDistricts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/`);
      if (res.ok) {
        setBackendOnline(true);
        // Also fetch live districts
        try {
          const distData = await fetchDistricts();
          if (distData && distData.features && distData.features.length > 0) {
            const mapped = distData.features.map(f => ({
              id: f.properties.district_id,
              name: f.properties.name,
              flag: f.properties.anomaly_flag,
              desc: f.properties.description || `${f.properties.pending_rate_pct}% pending, flag: ${f.properties.anomaly_flag}`,
              severity: f.properties.anomaly_flag === 'NORMAL' ? 'nominal' : 'critical'
            }));
            setDistrictsList(mapped);
          }
        } catch (e) {
          console.warn('Could not load districts from API, using fallback:', e);
        }
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
        `Could not reach backend at ${API_BASE_URL}. Ensure you ran: uvicorn backend.main:app --reload`
      );
      setBackendOnline(false);
    } finally {
      setLoading(false);
    }
  };

  const getFlagBadge = (flag) => {
    switch (flag) {
      case 'HIGH_PENDING_DELAY':
        return {
          icon: <Clock className="w-3.5 h-3.5 text-rose-400" />,
          label: 'Bureaucratic Delay',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40'
        };
      case 'ABNORMAL_REJECTION_SPIKE':
        return {
          icon: <Ban className="w-3.5 h-3.5 text-amber-400" />,
          label: 'Rejection Spike',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
        };
      case 'FOREST_COVER_LOSS_ON_CLAIM':
        return {
          icon: <Flame className="w-3.5 h-3.5 text-red-400" />,
          label: 'Canopy Loss & Encroachment',
          badge: 'bg-red-500/20 text-red-300 border-red-500/40'
        };
      case 'NORMAL':
      default:
        return {
          icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
          label: 'Benchmark Control',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
        };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-700 text-white shadow-lg shadow-indigo-950/50">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                FastAPI + Gemini AI Anomaly Intelligence
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Backend API v2.0
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Targeted Anomaly Decision Support • 4 Monitored Districts
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
          {/* District Selection Bar (4 Districts) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Select Targeted Anomaly District to Analyze:
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {districtsList.map((dist) => {
                const flagMeta = getFlagBadge(dist.flag);
                const isSelected = selectedDistrictId.toLowerCase() === dist.id.toLowerCase();
                return (
                  <button
                    key={dist.id}
                    onClick={() => {
                      setSelectedDistrictId(dist.id);
                      setAnalysisResult(null);
                    }}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-md ring-1 ring-indigo-500'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs truncate" title={dist.name}>{dist.name}</span>
                        <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-slate-900/80 text-slate-400">
                          {dist.id}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-snug line-clamp-2 mb-2">
                        {dist.desc}
                      </p>
                    </div>
                    <div className="pt-1">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border inline-flex items-center gap-1 ${flagMeta.badge}`}>
                        {flagMeta.icon}
                        <span>{dist.flag}</span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Trigger */}
          <div className="pt-1">
            <button
              onClick={handleRunAnalysis}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-950/60 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Prompting Gemini API with Exact Anomaly Evidence...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>
                    Generate Executive Anomaly Briefing for {districtsList.find(d => d.id.toLowerCase() === selectedDistrictId.toLowerCase())?.name || selectedDistrictId}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Error / Instructions Banner if Backend is offline */}
          {errorMessage && (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3.5 text-xs text-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Backend Server Offline or Unreachable:</span>
              </div>
              <p className="text-[11px] text-slate-300">
                In your terminal, start the FastAPI server with:
              </p>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-emerald-400 text-[11px] flex items-center justify-between">
                <span>uvicorn backend.main:app --reload --port 8000</span>
                <Terminal className="w-3.5 h-3.5 text-slate-500" />
              </div>
            </div>
          )}

          {/* Analysis Results Display */}
          {analysisResult && (
            <div className="space-y-3 animate-in fade-in duration-300">
              {/* Executive Summary Card */}
              <div className="rounded-xl bg-gradient-to-br from-indigo-950/50 to-slate-900 border border-indigo-500/40 p-4 shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Ministry Executive Decision-Support Briefing (2-Sentence Analysis)
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {analysisResult.ai_engine}
                  </span>
                </div>
                <div className="text-xs text-slate-200 leading-relaxed font-sans bg-slate-950/70 p-3.5 rounded-lg border border-slate-800/80">
                  <p>{analysisResult.ai_anomaly_report}</p>
                </div>
              </div>

              {/* Exact Numerical Evidence Table */}
              <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3.5">
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Exact Statistical Evidence Driving Alert:</span>
                  </h4>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    Flag: {analysisResult.anomaly_flag}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Total Claims</span>
                    <span className="text-sm font-bold text-white">{analysisResult.statistics.total_claims}</span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Pending Ratio</span>
                    <span className="text-sm font-bold text-amber-400">
                      {analysisResult.statistics.pending_percentage}%
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Rejection Ratio</span>
                    <span className="text-sm font-bold text-rose-400">
                      {analysisResult.statistics.rejected_percentage}%
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Max Delay</span>
                    <span className="text-sm font-bold text-rose-300">
                      {analysisResult.statistics.max_delay_days}d
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Veg Loss Index</span>
                    <span className="text-sm font-bold text-emerald-400">
                      {analysisResult.statistics.avg_pending_vegetation_loss_pct || analysisResult.statistics.avg_vegetation_loss_pct}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Claims Layer GeoJSON Feed */}
              {claimsGeoJson && (
                <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-400" />
                      <span>Curated Claim Points Retrieved: <strong className="text-white">{claimsGeoJson.total_features} Points</strong></span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400">GeoJSON FeatureCollection</span>
                  </div>

                  {/* Micro list of claims with anomaly tags */}
                  <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1 font-mono text-[11px]">
                    {claimsGeoJson.features.map((feat) => {
                      const p = feat.properties;
                      const isHighLoss = p.vegetation_loss_index >= 0.20;
                      const isDelayed = p.days_pending >= 300;
                      const isRejected = p.status === 'rejected';

                      return (
                        <div 
                          key={p.claim_id}
                          className="p-2 rounded bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                              p.status === 'approved' ? 'bg-emerald-400' :
                              (isDelayed || isHighLoss || isRejected) ? 'bg-rose-500' :
                              'bg-amber-400'
                            }`} />
                            <span className="text-slate-200 font-bold">{p.claim_id}</span>
                            <span className="text-[10px] text-slate-400">({p.claimant_type})</span>
                          </div>

                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="text-slate-300">{p.days_pending} days</span>
                            {p.vegetation_loss_index > 0 && (
                              <span className={isHighLoss ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                                loss: {(p.vegetation_loss_index * 100).toFixed(0)}%
                              </span>
                            )}
                            <span className={`px-1.5 py-0.2 rounded uppercase text-[9px] font-bold ${
                              p.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300' :
                              p.status === 'rejected' ? 'bg-rose-500/20 text-rose-300' :
                              'bg-amber-500/20 text-amber-300'
                            }`}>
                              {p.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between text-xs text-slate-400">
          <span>Documentation: <a href={`${API_BASE_URL}/docs`} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline inline-flex items-center gap-0.5">FastAPI Swagger Docs <ExternalLink className="w-3 h-3" /></a></span>
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
