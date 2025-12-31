import { LucideIcon } from 'lucide-react';

export interface AnalysisResult {
  domain: string;
  label: 'Safe' | 'Suspicious' | 'Fake' | 'Scam' | 'High Risk' | 'Phishing' | 'Misleading' | 'Legit' | 'Genuine' | 'Verified' | 'Reliable' | 'Unverified' | 'Buy' | 'Be Careful' | 'Avoid' | 'AI-Generated' | 'Human' | 'Deepfake' | 'Real' | 'Biased' | 'Satire';
  confidence: number;
  reason: string[];
}

export enum DetectorType {
  NEWS = 'NEWS',
  JOB = 'JOB',
  EDUCATION = 'EDUCATION',
  FINANCE = 'FINANCE',
  PHISHING = 'PHISHING',
  EMERGENCY = 'EMERGENCY',
  HEALTH = 'HEALTH',
  REVIEW = 'REVIEW',
  MEDIA = 'MEDIA',
  SOS = 'SOS',
}

export type InputType = 'text' | 'image' | 'video'|'url';

export interface DetectorConfig {
  id: DetectorType;
  title: string;
  description: string;
  icon: LucideIcon;
  placeholder: string;
  color: string;
  systemInstruction: string;
  allowedInputs: InputType[];
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  detectorId: DetectorType;
  result: AnalysisResult;
  preview: string;
  fullContent?: string;
  type: 'text' | 'image';
}

export type ThreatSeverity = 'low' | 'medium' | 'high';
export type ThreatCategory = 'Scam' | 'Misinformation' | 'Cyber Fraud' | 'Public Safety';
export type ThreatTrend = 'rising' | 'stable' | 'declining';

export interface LiveThreat {
  id: string;
  title: string;
  description: string;
  category: ThreatCategory;
  severity: ThreatSeverity;
  region: string;
  timestamp: number; // Unix timestamp
  source: string;
  sourceType: 'verified' | 'aggregated' | 'public_trend';
  warningSigns: string[];
  safetyTips: string[];
  actionsToAvoid: string[];
  trendStatus: ThreatTrend;
}