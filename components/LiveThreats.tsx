import React, { useState, useEffect } from 'react';
import { LiveThreat } from '../types';
import { subscribeToLiveThreats } from '../services/threatService';
import { Radio, MapPin, Filter, ShieldAlert, AlertTriangle, Info, X, ExternalLink, Clock, TrendingUp, Activity, CheckCircle2, XCircle } from 'lucide-react';

export const LiveThreats: React.FC = () => {
  const [threats, setThreats] = useState<LiveThreat[]>([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState('India');
  const [selectedThreat, setSelectedThreat] = useState<LiveThreat | null>(null);

  useEffect(() => {
    setLoading(true);
    // Subscribe to simulated real-time updates
    const unsubscribe = subscribeToLiveThreats(region, (data) => {
      setThreats(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [region]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-900';
      default: return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return ShieldAlert;
      case 'medium': return AlertTriangle;
      default: return Info;
    }
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col animate-fade-in relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Live Threat Radar
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Real-time tracking of emerging scams and misinformation.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
           <MapPin className="w-4 h-4 text-slate-400 ml-2" />
           <select 
             value={region} 
             onChange={(e) => setRegion(e.target.value)}
             className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-200 outline-none cursor-pointer pr-2"
           >
             <option value="India">India</option>
             <option value="Global">Global</option>
             <option value="All">All Regions</option>
           </select>
        </div>
      </div>

      {/* Main Feed */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
           <Activity className="w-10 h-10 text-blue-500 animate-pulse mb-4" />
           <p className="text-slate-500 dark:text-slate-400">Scanning for live threats...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 space-y-4">
              {threats.map((threat) => {
                const Icon = getSeverityIcon(threat.severity);
                return (
                  <div 
                    key={threat.id}
                    onClick={() => setSelectedThreat(threat)}
                    className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
                  >
                    {/* Left Border Indicator */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                      threat.severity === 'high' ? 'bg-red-500' : threat.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></div>

                    <div className="flex items-start gap-4">
                       <div className={`p-3 rounded-lg shrink-0 ${getSeverityColor(threat.severity)}`}>
                          <Icon className="w-6 h-6" />
                       </div>
                       <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                             <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${getSeverityColor(threat.severity)}`}>
                               {threat.category}
                             </span>
                             <span className="text-xs text-slate-400 flex items-center gap-1">
                               <Clock className="w-3 h-3" />
                               {formatTime(threat.timestamp)}
                             </span>
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                             {threat.title}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                             {threat.description}
                          </p>
                          <div className="mt-3 flex items-center gap-4 text-xs font-medium text-slate-400 dark:text-slate-500">
                             <span className="flex items-center gap-1">
                               <TrendingUp className={`w-3 h-3 ${threat.trendStatus === 'rising' ? 'text-red-500' : 'text-slate-400'}`} />
                               {threat.trendStatus === 'rising' ? 'Trending' : 'Stable'}
                             </span>
                             <span>•</span>
                             <span>Source: {threat.source}</span>
                             <span>•</span>
                             <span>{threat.region}</span>
                          </div>
                       </div>
                    </div>
                  </div>
                );
              })}
           </div>

           {/* Sidebar Info */}
           <div className="hidden lg:block space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                 <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                    <Radio className="w-5 h-5" />
                    About Live Radar
                 </h3>
                 <p className="text-sm text-blue-800/80 dark:text-blue-200/80 leading-relaxed mb-4">
                    This feed aggregates verified reports of scams, phishing campaigns, and viral misinformation from cyber-safety portals and user reports.
                 </p>
                 <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                    Disclaimer: Alerts are informational. Always verify specific claims with official authorities.
                 </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                 <h3 className="font-bold text-slate-900 dark:text-white mb-4">Legend</h3>
                 <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                       <span className="w-3 h-3 rounded-full bg-red-500"></span>
                       <span className="font-medium text-slate-700 dark:text-slate-300">High Severity</span>
                       <span className="text-slate-400 text-xs ml-auto">Immediate Risk</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                       <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                       <span className="font-medium text-slate-700 dark:text-slate-300">Medium Severity</span>
                       <span className="text-slate-400 text-xs ml-auto">Caution Advised</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                       <span className="w-3 h-3 rounded-full bg-green-500"></span>
                       <span className="font-medium text-slate-700 dark:text-slate-300">Low Severity</span>
                       <span className="text-slate-400 text-xs ml-auto">Informational</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedThreat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
           <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-800/50">
                 <div className="flex items-start gap-4 pr-8">
                    <div className={`p-3 rounded-xl shrink-0 ${getSeverityColor(selectedThreat.severity)}`}>
                       {React.createElement(getSeverityIcon(selectedThreat.severity), { className: "w-6 h-6" })}
                    </div>
                    <div>
                       <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${getSeverityColor(selectedThreat.severity)}`}>
                             {selectedThreat.category}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                             {formatTime(selectedThreat.timestamp)}
                          </span>
                       </div>
                       <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                          {selectedThreat.title}
                       </h2>
                    </div>
                 </div>
                 <button 
                   onClick={() => setSelectedThreat(null)}
                   className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 transition-colors"
                 >
                    <X className="w-5 h-5" />
                 </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
                 <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Description</h3>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                       {selectedThreat.description}
                    </p>
                 </div>

                 <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-xl border border-amber-100 dark:border-amber-800/30">
                       <h4 className="font-bold text-amber-900 dark:text-amber-200 mb-3 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" /> Warning Signs
                       </h4>
                       <ul className="space-y-2">
                          {selectedThreat.warningSigns.map((sign, i) => (
                             <li key={i} className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-200/80">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                                {sign}
                             </li>
                          ))}
                       </ul>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-xl border border-blue-100 dark:border-blue-800/30">
                       <h4 className="font-bold text-blue-900 dark:text-blue-200 mb-3 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" /> Safety Tips
                       </h4>
                       <ul className="space-y-2">
                          {selectedThreat.safetyTips.map((tip, i) => (
                             <li key={i} className="flex items-start gap-2 text-sm text-blue-800 dark:text-blue-200/80">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                                {tip}
                             </li>
                          ))}
                       </ul>
                    </div>
                 </div>

                 <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                       <XCircle className="w-4 h-4 text-red-500" /> Actions to Avoid
                    </h3>
                    <div className="flex flex-wrap gap-2">
                       {selectedThreat.actionsToAvoid.map((action, i) => (
                          <span key={i} className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm border border-red-100 dark:border-red-900/50">
                             {action}
                          </span>
                       ))}
                    </div>
                 </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end gap-3">
                 <button 
                   onClick={() => setSelectedThreat(null)}
                   className="px-5 py-2.5 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
                 >
                    Close
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
