import { LiveThreat } from '../types';

// Mock Data simulating a Firestore collection
const MOCK_THREATS: LiveThreat[] = [
  {
    id: 't1',
    title: 'Fake "Electricity Bill Unpaid" SMS',
    description: 'Scammers are sending SMS claiming electricity will be cut off tonight due to unpaid bills. They ask users to call a fake number or download an APK.',
    category: 'Scam',
    severity: 'high',
    region: 'India',
    timestamp: Date.now() - 1000 * 60 * 30, // 30 mins ago
    source: 'Cyber Crime Portal',
    sourceType: 'verified',
    warningSigns: [
      'Urgency: "Tonight" or "Immediately"',
      'Personal mobile number used for sending SMS',
      'Request to download "QuickSupport" or similar remote access apps'
    ],
    safetyTips: [
      'Verify bill status on official electricity board app',
      'Never call the number in the SMS'
    ],
    actionsToAvoid: [
      'Downloading any APK sent via link',
      'Sharing OTPs'
    ],
    trendStatus: 'rising'
  },
  {
    id: 't2',
    title: 'Deepfake Stock Trading Videos',
    description: 'AI-generated videos of famous industrialists (e.g., Mukesh Ambani, Ratan Tata) promoting fake trading apps or telegram groups.',
    category: 'Cyber Fraud',
    severity: 'high',
    region: 'Global',
    timestamp: Date.now() - 1000 * 60 * 60 * 4, // 4 hours ago
    source: 'Trend Analysis',
    sourceType: 'aggregated',
    warningSigns: [
      'Lip sync looks slightly off',
      'Promises of guaranteed returns (e.g., double money in 1 day)',
      'Links redirect to WhatsApp/Telegram groups'
    ],
    safetyTips: [
      'Only trade on SEBI registered platforms',
      'Report the video immediately'
    ],
    actionsToAvoid: [
      'Joining random investment Telegram groups',
      'Transferring money to individual bank accounts'
    ],
    trendStatus: 'rising'
  },
  {
    id: 't3',
    title: 'Fake Election Schedule Forwards',
    description: 'Viral WhatsApp forwards circulating fake voting dates for upcoming state elections.',
    category: 'Misinformation',
    severity: 'medium',
    region: 'India',
    timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    source: 'Fact Check Unit',
    sourceType: 'verified',
    warningSigns: [
      'No link to official Election Commission website',
      'Dates do not match news reports',
      'Formatting issues in the document image'
    ],
    safetyTips: [
      'Check eci.gov.in for official schedule',
      'Do not forward without verification'
    ],
    actionsToAvoid: [
      'Forwarding to family groups',
      'Planning travel based on unverified dates'
    ],
    trendStatus: 'stable'
  },
  {
    id: 't4',
    title: 'Part-time "Review Task" Job Scam',
    description: 'Messages offering money for liking YouTube videos or reviewing hotels on Google Maps.',
    category: 'Scam',
    severity: 'medium',
    region: 'India',
    timestamp: Date.now() - 1000 * 60 * 60 * 48, // 2 days ago
    source: 'User Reports',
    sourceType: 'public_trend',
    warningSigns: [
      'Easy money offers (e.g., ₹5000/day for 1 hour)',
      'Added to Telegram group after initial contact',
      'Asked to invest money to withdraw earnings (Prepaid Task)'
    ],
    safetyTips: [
      'Legitimate jobs do not ask you to pay to work',
      'Block and report the sender'
    ],
    actionsToAvoid: [
      'Paying any "security deposit"',
      'Sharing bank details'
    ],
    trendStatus: 'declining'
  }
];

// Simulated Firestore "onSnapshot" listener
export const subscribeToLiveThreats = (
  regionFilter: string,
  callback: (threats: LiveThreat[]) => void
) => {
  console.log(`📡 Subscribing to Live Threats (Region: ${regionFilter})...`);
  
  // 1. Initial Data Load (Simulating Firestore cache/first fetch)
  const filteredData = regionFilter === 'All' 
    ? MOCK_THREATS 
    : MOCK_THREATS.filter(t => t.region === regionFilter || t.region === 'Global');
    
  // Sort by timestamp desc
  filteredData.sort((a, b) => b.timestamp - a.timestamp);
  
  callback(filteredData);

  // 2. Simulate Real-time update (Pushing a new threat after 10 seconds)
  const intervalId = setInterval(() => {
    const newThreat: LiveThreat = {
      id: `new_${Date.now()}`,
      title: 'New: Digital Arrest Scam Alert',
      description: 'Callers posing as Police/CBI claiming your parcel contains drugs and you are under "Digital Arrest".',
      category: 'Cyber Fraud',
      severity: 'high',
      region: 'India',
      timestamp: Date.now(),
      source: 'Real-time Monitor',
      sourceType: 'verified',
      warningSigns: ['Video call with fake police station background', 'Threats of immediate arrest', 'Demand to transfer money for verification'],
      safetyTips: ['Disconnect immediately', 'Call 1930'],
      actionsToAvoid: ['Staying on video call', 'Transferring funds'],
      trendStatus: 'rising'
    };

    // Only add if not already present (simple check for demo)
    if (!filteredData.find(t => t.title === newThreat.title)) {
        filteredData.unshift(newThreat);
        callback([...filteredData]);
    }
  }, 15000); // Trigger update after 15 seconds

  // Return unsubscribe function
  return () => {
    console.log('Unsubscribing from Live Threats');
    clearInterval(intervalId);
  };
};