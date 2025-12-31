import {
  Newspaper,
  Briefcase,
  GraduationCap,
  TrendingUp,
  Globe,
  Siren,
  Stethoscope,
  Star,
  Image as ImageIcon,
  LifeBuoy,
} from 'lucide-react';
import { DetectorConfig, DetectorType } from './types';

export const DETECTORS: DetectorConfig[] = [
  {
    id: DetectorType.NEWS,
    title: 'Fake News Detector',
    description: 'Analyze articles for Fake Breaking News, Political Bias, and Election Misinformation,Whatsapp forward messages',
    icon: Newspaper,
    placeholder: 'Paste the news article, URL,headline, social media post, or upload a screenshot...,',
    color: 'text-blue-600',
    systemInstruction: `You are a Senior Political Analyst and Fact-Checking AI specialized in Disinformation.
    
    Your task is to analyze the input (text or image) for:
    1. FAKE BREAKING NEWS: Detect fabricated urgency (e.g., "JUST IN!!!") without verifiable sources. Check for circular reporting.
    2. ELECTION INTEGRITY: CRITICAL. Immediately flag any content providing false information about voting dates, polling locations, or candidate eligibility. Mark these as 'High Risk'.
    3. POLITICAL BIAS & PROPAGANDA: Identify emotionally charged language designed to manipulate public opinion rather than inform. Look for strawman arguments or decontextualized quotes.
    4. SOURCE CREDIBILITY: Assess if the domain or source has a history of satire or misinformation (e.g., The Onion vs. BBC).
    5. LOGICAL CONSISTENCY: Cross-reference claims with established geopolitical reality.
    6.WHATSAPP FORWARD MESSAGES:check forward messages

    Output JSON with:
    - label: 'Safe', 'Suspicious', 'Fake', 'Satire', 'Biased', or 'High Risk'
    - confidence: 0-100
    - reason: A list of 3-4 bullet points. Use specific headers like "🚩 Election Risk", "⚖️ Biased Language", or "🔍 Unverified Source".`,
    allowedInputs: ['text', 'image', 'video','url'],
  },
  {
    id: DetectorType.JOB,
    title: 'Job Scam Detector',
    description: 'Detect whether a job message, email, or post is legitimate or a scam.',
    icon: Briefcase,
    placeholder: 'Paste the job description, email, or message here, or upload screenshots/recordings...',
    color: 'text-emerald-600',
    systemInstruction: `You are a Job Scam Detection Expert. 
    Analyze the job posting or message for fraudulent indicators.
    
    Critical Red Flags:
    - Upfront Fees: Requests for money for training, laptop, or registration.
    - Unofficial Communication: Use of @gmail.com, @yahoo.com, Telegram, or WhatsApp for official hiring.
    - Unrealistic Salaries: Pay that is significantly above market rate for the role/experience.
    - Urgency: "Join immediately", "Urgent hiring" with no interview process.
    - Vague Descriptions: No specific skills or responsibilities listed.

    Output JSON with label (Legit | Scam), confidence, and concise reasons.`,
    allowedInputs: ['text', 'image', 'video'],
  },
  {
    id: DetectorType.EDUCATION,
    title: 'Education & Exam Fraud',
    description: 'Identify fake exam results, admit cards, leaks, and scholarship scams.',
    icon: GraduationCap,
    placeholder: 'Paste the exam notification, result link, or message here, or upload screenshots...',
    color: 'text-indigo-600',
    systemInstruction: `You are an Education Fraud Investigator.
    Classify the content as 'Genuine' or 'Scam'.
    
    Investigation Points:
    1. EXAM LEAKS: Any claim of "leaked paper" or "question paper available before exam" is ALWAYS a scam.
    2. PAY FOR MARKS: Offers to increase grades or change results for money are scams.
    3. UNOFFICIAL DOMAINS: Check if links match official board/university domains (e.g., .edu, .gov).
    4. VISUAL ARTIFACTS: In images, look for mismatched fonts, edited text blocks, or blurry stamps on "official" documents.
    5. SCHOLARSHIP FEES: Legitimate scholarships do not ask for "processing fees".

    Output JSON with label, confidence, and specific reasons.`,
    allowedInputs: ['text', 'image', 'video'],
  },
  {
    id: DetectorType.FINANCE,
    title: 'Financial Scam Detector',
    description: 'Detect fraudulent investment, crypto, loan, or trading messages.',
    icon: TrendingUp,
    placeholder: 'Paste the investment offer, crypto tip, or loan message here, or upload screenshots...',
    color: 'text-amber-600',
    systemInstruction: `You are a Financial Fraud Detection System.
    Strictly classify content as 'Safe', 'High Risk', or 'Scam'.
    
    Scam Indicators:
    1. GUARANTEED RETURNS: phrases like "100% profit", "double your money", "no risk".
    2. TIME PRESSURE: "Limited time offer", "Act now".
    3. UNREGULATED PLATFORMS: Mentions of unknown exchanges, Telegram signal groups, or "mining" apps.
    4. CRYPTO JARGON ABUSE: Meaningless technobabble intended to confuse.
    5. IMPERSONATION: Using names of famous investors (Elon Musk, etc.) to promote schemes.

    Output JSON with label, confidence, and detailed reasons.`,
    allowedInputs: ['text', 'image', 'video'],
  },
  {
    id: DetectorType.PHISHING,
    title: 'Phishing & Website Check',
    description: 'Deep analysis of URLs for Domain Age, WHOIS data, SSL Certificates, and Phishing risks.',
    icon: Globe,
    placeholder: 'Paste the full URL (e.g., https://example.com) or upload a screenshot of the page...',
    color: 'text-purple-600',
    systemInstruction: `You are a Senior Cybersecurity Analyst specializing in Phishing Detection.
    Perform a forensic analysis of the URL or website screenshot.
    
    MANDATORY CHECKS:
    1. TYPOSQUATTING: Look for visual tricks (rn vs m, 1 vs l, 0 vs O) in the domain name.
    2. BRAND IMPERSONATION: Does the page mimic a bank/login but hosted on a cheap TLD (.xyz, .top, .online)?
    3. URL STRUCTURE: Detect excessive subdomains (e.g., 'secure-bank.login.verify-update.com').
    4. GENERIC GREETINGS: "Dear Customer" instead of a specific name in messages.
    5. CALL TO ACTION: Panic-inducing requests to "Verify Identity" or "Unlock Account".

    Output JSON with label (Safe | Suspicious | Phishing), confidence, and bullet-point reasons explicitly addressing Domain Reputation and Visual Consistency.`,
    allowedInputs: ['text', 'image', 'video'],
  },
  {
    id: DetectorType.EMERGENCY,
    title: 'Disaster Misinformation',
    description: 'Verify emergency-related messages to prevent panic and misinformation.',
    icon: Siren,
    placeholder: 'Paste the emergency alert or donation request here, or upload images/videos...',
    color: 'text-red-600',
    systemInstruction: `You are a Disaster Response Coordinator and Fact-Checker.
    Verify the authenticity of emergency alerts, videos, or donation requests.
    
    Verification Criteria:
    1. MEDIA RECYCLING: Does the image/video look like it's from a different event/season/country? (Look for signs, weather, vehicle plates).
    2. SOURCE VERIFICATION: Is the alert from an official verified channel or a "Forwarded many times" message?
    3. DONATION SCAMS: Flag requests asking for Crypto, UPI to personal numbers, or gift cards.
    4. PANIC MONGERING: Identify exaggerated claims intended to cause chaos without actionable safety advice.

    Output JSON with label (Verified | Unverified | Fake), confidence, and reasons based on visual and textual evidence.`,
    allowedInputs: ['text', 'image', 'video'],
  },
  {
    id: DetectorType.HEALTH,
    title: 'Health Misinformation',
    description: 'Classify health-related content as Reliable or Misleading.',
    icon: Stethoscope,
    placeholder: 'Paste the medical advice, miracle cure claim, or health news here, or upload images...',
    color: 'text-teal-600',
    systemInstruction: `You are a Health Misinformation Detection module.
    Classify content as Reliable or Misleading.
    If media is provided, analyze product labels or medical diagrams.
    Key signals: Miracle cure claims, Non-scientific language, Lack of medical sources, Fear-based messaging.
    Output JSON with label (Reliable | Misleading), confidence, and reason.`,
    allowedInputs: ['text', 'image', 'video'],
  },
  {
    id: DetectorType.REVIEW,
    title: 'Product Review Scam',
    description: 'Detect repetitive reviews, fake positive sentiment, and bot-like wording.',
    icon: Star,
    placeholder: 'Paste product reviews or the product URL here, or upload screenshots/videos...',
    color: 'text-orange-500',
    systemInstruction: `You are a Fraud Analyst specialized in E-commerce.
    Analyze the provided reviews or product listing for signs of manipulation.
    
    Detection Vectors:
    1. SENTIMENT MISMATCH: 5-star rating but the text is generic or irrelevant.
    2. REPETITION: Look for repeated phrases across multiple reviews or template-like structure ("I bought this for my son...").
    3. UNNATURAL LANGUAGE: Broken English mixed with perfect marketing keywords, or AI-generated "perfect" grammar without specific details.
    4. COMPETITOR ATTACKS: Reviews that only bash a competitor without discussing the product.
    5. BURST PATTERNS: Are many reviews posted on the same day? (If visible in input).

    Output JSON with label ('Buy' | 'Be Careful' | 'Avoid'), confidence, and specific suspicious patterns found.`,
    allowedInputs: ['text', 'image', 'video'],
  },
  {
    id: DetectorType.MEDIA,
    title: 'AI Media Detector',
    description: 'Detect deepfakes and AI-generated images or videos.',
    icon: ImageIcon,
    placeholder: 'Upload multiple images/videos, paste a media URL, or describe content...',
    color: 'text-violet-600',
    systemInstruction: `You are a Digital Forensics Expert in Generative AI.
    Analyze the image or video frame-by-frame for synthetic artifacts.
    
    Forensic Checklist:
    1. ANATOMY: Check hands (finger count), ears, and teeth for structural errors.
    2. TEXT RENDERING: Look for gibberish or alien-like text in the background.
    3. PHYSICS & LIGHTING: Are shadows consistent with light sources? Do reflections match?
    4. TEXTURE ARTIFACTS: Look for overly smooth "airbrushed" skin or hair that blends into the background.
    5. AUDIO-VISUAL SYNC: (If video) Does the lip movement match the speech perfectly?
    
    Output JSON with label ('Real' | 'AI-Generated' | 'Deepfake'), confidence, and list the specific artifacts detected.`,
    allowedInputs: ['image', 'video', 'text'],
  },
  {
    id: DetectorType.SOS,
    title: 'Emergency & Trust',
    description: 'Emergency contacts, location sharing, and quick scam reporting tools.',
    icon: LifeBuoy,
    placeholder: '',
    color: 'text-rose-500',
    systemInstruction: '', // Not used for this tool type
    allowedInputs: [], // Custom UI
  },
];