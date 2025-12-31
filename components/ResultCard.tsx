import React from 'react';
import { AnalysisResult } from '../types';
import { ShieldCheck, ShieldAlert, AlertTriangle, Info, ThumbsUp, ThumbsDown, Eye, CheckCircle2, Globe, TrendingUp, AlertOctagon } from 'lucide-react';

interface ResultCardProps {
  result: AnalysisResult | null;
  loading: boolean;
}

const getStatusColor = (label: string) => {
  const safeLabels = ['Safe', 'Real', 'Legit', 'Genuine', 'Verified', 'Reliable', 'Human-written', 'Buy', 'Human'];
  const suspiciousLabels = ['Suspicious', 'Unverified', 'Mixed', 'Misleading', 'Be Careful', 'Biased'];
  
  const normalizedLabel = label.trim();
  
  if (safeLabels.includes(normalizedLabel)) {
    return {
       bg: 'bg-emerald-50 dark:bg-emerald-900/20',
       border: 'border-emerald-200 dark:border-emerald-800',
       text: 'text-emerald-900 dark:text-emerald-100',
       icon: 'text-emerald-600 dark:text-emerald-400'
    };
  }
  if (suspiciousLabels.includes(normalizedLabel)) {
     return {
       bg: 'bg-amber-50 dark:bg-amber-900/20',
       border: 'border-amber-200 dark:border-amber-800',
       text: 'text-amber-900 dark:text-amber-100',
       icon: 'text-amber-600 dark:text-amber-400'
     };
  }
  // Default to High Risk/Danger
  return {
     bg: 'bg-rose-50 dark:bg-rose-900/20',
     border: 'border-rose-200 dark:border-rose-800',
     text: 'text-rose-900 dark:text-rose-100',
     icon: 'text-rose-600 dark:text-rose-400'
  };
};

const getStatusIcon = (label: string) => {
  const safeLabels = ['Safe', 'Real', 'Legit', 'Genuine', 'Verified', 'Reliable', 'Human-written', 'Buy', 'Human'];
  const suspiciousLabels = ['Suspicious', 'Unverified', 'Mixed', 'Misleading', 'Be Careful', 'Biased'];
  
  if (label === 'Buy') return ThumbsUp;
  if (label === 'Avoid') return ThumbsDown;
  if (label === 'AI-Generated' || label === 'Deepfake') return Eye;
  if (label === 'High Risk') return AlertOctagon;

  const normalizedLabel = label.trim();

  if (safeLabels.includes(normalizedLabel)) return ShieldCheck;
  if (suspiciousLabels.includes(normalizedLabel)) return AlertTriangle;
  return ShieldAlert;
};

const ResultCard: React.FC<ResultCardProps> = ({ result, loading }) => {
  if (loading) {
    return (
      <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm animate-pulse transition-colors duration-200">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 dark:text-slate-300 font-medium">Analyzing content patterns...</p>
        <p className="text-xs text-slate-400 mt-2">Checking reliability and bias sources</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 text-center transition-colors duration-200">
        <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-full mb-4">
            <Info className="w-10 h-10 text-slate-400 dark:text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Ready to Analyze</h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm">
          Enter text or upload media in the input field and click "Analyze" to detect fake news, political bias, or deepfakes.
        </p>
      </div>
    );
  }

  const colors = getStatusColor(result.label);
  const Icon = getStatusIcon(result.label);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden h-full flex flex-col transition-colors duration-200">
       {/* Verdict Header */}
       <div className={`p-8 border-b ${colors.bg} ${colors.border}`}>
          <div className="flex items-start justify-between">
             <div className="flex items-center gap-4">
                 <div className={`p-3 rounded-full bg-white dark:bg-slate-900 shadow-sm ${colors.icon}`}>
                    <Icon className="w-10 h-10" />
                 </div>
                 <div>
                    <span className="text-xs font-bold uppercase tracking-widest opacity-60 text-slate-900 dark:text-slate-100">Analysis Verdict</span>
                    <h2 className={`text-3xl font-black uppercase tracking-tight ${colors.text}`}>
                      {result.label}
                    </h2>
                 </div>
             </div>
             
             {/* Confidence Badge */}
             <div className="flex flex-col items-end">
                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                   {result.confidence}%
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Confidence Score</span>
             </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full mt-6 overflow-hidden">
             <div 
               className={`h-full rounded-full transition-all duration-1000 ease-out ${
                 result.confidence > 80 ? 'bg-green-500' : result.confidence > 50 ? 'bg-yellow-500' : 'bg-red-500'
               }`}
               style={{ width: `${result.confidence}%` }}
             ></div>
          </div>
       </div>
       
       {/* Body Content */}
       <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
           {/* Domain/Source if available */}
           {result.domain && (
             <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
               <Globe className="w-4 h-4 text-blue-500" />
               <span className="text-sm text-slate-500 dark:text-slate-400">Source detected:</span>
               <span className="font-semibold text-slate-700 dark:text-slate-200">{result.domain}</span>
             </div>
           )}

           <div>
              <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                 <TrendingUp className="w-4 h-4" />
                 Key Findings
              </h3>
              <ul className="space-y-3">
                 {result.reason.map((r, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                       <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" /> 
                       <span>{r}</span>
                    </li>
                 ))}
              </ul>
           </div>
       </div>
       
       {/* Footer */}
       <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
             AI Generated Analysis • Verify with official sources before sharing
          </p>
       </div>
    </div>
  );
};

export default ResultCard;