import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, Menu, X, ChevronRight, ArrowRight, ArrowLeft, Upload, Trash2, Moon, Sun, AlertCircle, Flame, Server, Code, Database, Shield, ChevronLeft, History, Clock, Phone, Plus, ExternalLink, LifeBuoy, FileVideo, FileImage, Loader2, Link as LinkIcon, ImagePlus, RotateCcw, FileWarning, MapPin, Send, Radio } from 'lucide-react';
import { DETECTORS } from './constants';
import { DetectorType, AnalysisResult, HistoryItem } from './types';
import { analyzeContent } from './services/geminiService';
import { saveResultToFirebase, saveMediaMetadataToFirebase } from './services/firebaseService';
import ResultCard from './components/ResultCard';
import { LiveThreats } from './components/LiveThreats';

interface Contact {
  id: string;
  name: string;
  phone: string;
}

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  preview: string;
  base64: string;
  file?: File;
  source: 'upload' | 'url';
  size: number;
  status: 'uploading' | 'ready' | 'error';
  errorMessage?: string;
}

function App() {
  const [activeTab, setActiveTab] = useState<DetectorType | 'HOME' | 'HISTORY' | 'LIVE_ALERTS'>('HOME');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  // Analysis state
  const [inputText, setInputText] = useState('');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // File Upload State
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // History State
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('trustlens_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load history", e);
      return [];
    }
  });

  // Emergency Contacts State
  const [contacts, setContacts] = useState<Contact[]>(() => {
    try {
      const saved = localStorage.getItem('trustlens_contacts');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  const activeDetector = DETECTORS.find(d => d.id === activeTab);
  const ActiveIcon = activeDetector?.icon;
  
  // Filter out SOS from general detectors list as it is now a main nav item
  const regularDetectors = DETECTORS.filter(d => d.id !== DetectorType.SOS);

  useEffect(() => {
    try {
      localStorage.setItem('trustlens_history', JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save history", e);
    }
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem('trustlens_contacts', JSON.stringify(contacts));
    } catch (e) {
      console.error("Failed to save contacts", e);
    }
  }, [contacts]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const addToHistory = (res: AnalysisResult, fullText: string, type: 'text' | 'image') => {
    const previewText = fullText.trim() || (type === 'image' ? 'Media Analysis' : 'Analysis');
    
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      detectorId: activeTab as DetectorType,
      result: res,
      preview: type === 'text' ? (previewText.length > 60 ? previewText.substring(0, 60) + '...' : previewText) : `${mediaItems.length} media file(s)`,
      fullContent: fullText,
      type: type
    };
    setHistory(prev => [newItem, ...prev]);
  };

  const handleAnalyze = async () => {
    if (activeTab === 'HOME' || activeTab === 'HISTORY' || activeTab === 'SOS' || activeTab === 'LIVE_ALERTS') return;
    
    const validMediaItems = mediaItems.filter(item => item.status === 'ready');
    if (!inputText.trim() && validMediaItems.length === 0) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const mediaData = validMediaItems.map(item => ({
        mimeType: item.type === 'image' ? 'image/jpeg' : 'video/mp4', // Simplification, normally mapped from file type
        data: item.base64
      }));

      const data = await analyzeContent(activeTab, inputText, mediaData);
      setResult(data);
      
      // Add to history
      addToHistory(
        data, 
        inputText, 
        validMediaItems.length > 0 ? 'image' : 'text'
      );

      // Store in Firebase (Simulated)
      saveResultToFirebase(
        activeTab,
        data,
        inputText.substring(0, 100),
        validMediaItems.length > 0
      );

      // If Media detector, store specific metadata
      if (activeTab === DetectorType.MEDIA && validMediaItems.length > 0) {
        saveMediaMetadataToFirebase(
          validMediaItems.map(item => ({ type: item.type, size: item.size })),
          data
        );
      }

    } catch (err) {
      console.error(err);
      setError("Failed to analyze content. Please try again later. Ensure uploaded files are valid.");
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (tab: DetectorType | 'HOME' | 'HISTORY' | 'LIVE_ALERTS') => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    
    if (tab !== activeTab) {
      handleReset();
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setInputText('');
    setMediaItems([]);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleAddTextUrl = () => {
    const url = prompt("Enter URL to analyze:");
    if (url) {
        setInputText(prev => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed}\n${url}` : url;
        });
    }
  };

  const restoreHistorySession = (item: HistoryItem) => {
    setActiveTab(item.detectorId);
    setResult(item.result);
    setInputText(item.fullContent || '');
    setMediaItems([]); // Clear previous media as we can't fully restore file objects
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear all history?')) {
      setHistory([]);
    }
  };

  // SOS Functions
  const addContact = () => {
    if (newContactName.trim() && newContactPhone.trim()) {
      setContacts([...contacts, { id: Date.now().toString(), name: newContactName, phone: newContactPhone }]);
      setNewContactName('');
      setNewContactPhone('');
    }
  };

  const deleteContact = (id: string) => {
    setContacts(contacts.filter(c => c.id !== id));
  };
  
  const shareLocation = (phone: string) => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    
    // Simple visual feedback could be added here
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;
      const message = `SOS! I need help. My current location: https://www.google.com/maps?q=${latitude},${longitude}`;
      const cleanPhone = phone.replace(/\D/g, '');
      // WhatsApp link
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    }, (error) => {
      console.error(error);
      alert("Unable to retrieve location. Please allow location access.");
    });
  };

  const processFile = (file: File): Promise<{preview: string, base64: string, type: 'image' | 'video'}> => {
    return new Promise((resolve, reject) => {
       // Validate type
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        reject("Invalid file type. Please upload an image or video.");
        return;
      }

      // Validate size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        reject(`File ${file.name} is too large. Maximum size is 10MB.`);
        return;
      }

      const reader = new FileReader();

      reader.onload = (event) => {
        const result = event.target?.result as string;
        const base64Data = result.split(',')[1];
        
        resolve({
          preview: file.type.startsWith('image/') ? result : '',
          base64: base64Data,
          type: file.type.startsWith('image/') ? 'image' : 'video',
        });
      };

      reader.onerror = () => {
        reject("Failed to read file.");
      };

      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (files: FileList | File[]) => {
    setError(null);

    const fileArray = Array.from(files);
    
    // Create optimistic items
    const newItems: MediaItem[] = fileArray.map(file => ({
      id: Math.random().toString(36).substring(7) + Date.now().toString(),
      type: file.type.startsWith('image/') ? 'image' : 'video',
      preview: '',
      base64: '',
      file,
      source: 'upload',
      size: file.size,
      status: 'uploading'
    }));

    setMediaItems(prev => [...prev, ...newItems]);

    // Process each file
    newItems.forEach(async (item) => {
      if (!item.file) return;
      try {
        const data = await processFile(item.file);
        setMediaItems(prev => prev.map(p => 
          p.id === item.id 
            ? { ...p, ...data, status: 'ready' } 
            : p
        ));
      } catch (err: any) {
        setMediaItems(prev => prev.map(p => 
          p.id === item.id 
            ? { ...p, status: 'error', errorMessage: err.toString() } 
            : p
        ));
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
    // Reset value so same files can be selected again if needed
    if (e.target) e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleUrlUpload = async () => {
    const url = prompt("Enter Image/Video URL to detect:");
    if (!url) return;

    // Check if it's a URL
    try {
       new URL(url);
    } catch {
       setError("Please enter a valid URL.");
       return;
    }

    const tempId = Math.random().toString(36).substring(7) + Date.now().toString();
    const newItem: MediaItem = {
       id: tempId,
       type: 'image', // default assumed
       preview: '',
       base64: '',
       source: 'url',
       size: 0,
       status: 'uploading'
    };
    
    setMediaItems(prev => [...prev, newItem]);

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch media.");
      
      const blob = await response.blob();
      const mimeType = blob.type;
      
      if (!mimeType.startsWith('image/') && !mimeType.startsWith('video/')) {
        throw new Error("URL does not point to a supported image or video.");
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const base64 = result.split(',')[1];
        
        setMediaItems(prev => prev.map(p => 
            p.id === tempId 
            ? { 
                ...p, 
                status: 'ready',
                type: mimeType.startsWith('image/') ? 'image' : 'video',
                preview: mimeType.startsWith('image/') ? result : '',
                base64: base64,
                size: blob.size
              } 
            : p
        ));
      };
      reader.onerror = () => { 
          throw new Error("Failed to process URL media."); 
      };
      reader.readAsDataURL(blob);

    } catch (err: any) {
      console.error(err);
      setMediaItems(prev => prev.map(p => 
        p.id === tempId 
        ? { ...p, status: 'error', errorMessage: "Failed to load URL. CORS protection or invalid file." } 
        : p
      ));
    }
  };

  const removeMediaItem = (id: string) => {
    setMediaItems(prev => prev.filter(item => item.id !== id));
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // Derived state to check if processing is active for disabling buttons
  const isProcessingFile = mediaItems.some(item => item.status === 'uploading');

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">
        {/* Mobile Header */}
        <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center gap-2" onClick={() => switchTab('HOME')}>
            {activeTab !== 'HOME' && (
               <ChevronLeft className="w-6 h-6 text-slate-500 dark:text-slate-300" />
            )}
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <span className="font-bold text-lg tracking-tight dark:text-white">TruthGuard</span>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={toggleDarkMode} className="text-slate-600 dark:text-slate-300 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
             </button>
             {/* Mobile Menu Button */}
             <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-600 dark:text-slate-300">
               {mobileMenuOpen ? <X /> : <Menu />}
             </button>
          </div>
        </div>

        {/* Sidebar Navigation - Desktop */}
        <aside className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out
          hidden md:block md:relative md:translate-x-0
        `}>
          <div className="p-6 flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => switchTab('HOME')}>
               <div className="bg-blue-600 p-1.5 rounded-lg">
                <ShieldCheck className="text-white w-6 h-6" />
              </div>
              <span className="font-bold text-xl tracking-tight dark:text-white">TruthGuard</span>
            </div>
          </div>
          
           {/* Desktop Dark Toggle */}
          <div className="px-6 mb-6">
             <button 
                onClick={toggleDarkMode}
                className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white w-full px-4 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
             >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {darkMode ? 'Light Mode' : 'Dark Mode'}
             </button>
          </div>

          <nav className="px-3 space-y-1 h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar">
            <button
              onClick={() => switchTab('HOME')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium
                ${activeTab === 'HOME' 
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'}`}
            >
              <ShieldCheck className="w-5 h-5" />
              Dashboard
            </button>

            <button
              onClick={() => switchTab('LIVE_ALERTS')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium relative overflow-hidden
                ${activeTab === 'LIVE_ALERTS' 
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'}`}
            >
              <div className="relative">
                <Radio className="w-5 h-5" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse border-2 border-white dark:border-slate-900"></span>
              </div>
              Live Alerts
            </button>
            
            <button
              onClick={() => switchTab('HISTORY')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium
                ${activeTab === 'HISTORY' 
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'}`}
            >
              <History className="w-5 h-5" />
              History
            </button>

            <button
              onClick={() => switchTab(DetectorType.SOS)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium
                ${activeTab === DetectorType.SOS 
                  ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'}`}
            >
              <LifeBuoy className="w-5 h-5" />
              Emergency
            </button>

            <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Detectors
            </div>

            {regularDetectors.map((detector) => {
              const Icon = detector.icon;
              const isActive = activeTab === detector.id;
              return (
                <button
                  key={detector.id}
                  onClick={() => switchTab(detector.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium group
                    ${isActive 
                      ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-md' 
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'}`}
                >
                  <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                  <span className="flex-1 text-left">{detector.title}</span>
                  {isActive && <ChevronRight className="w-4 h-4 text-slate-400" />}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Slide-over Menu */}
        <div className={`
          md:hidden fixed inset-0 z-40 transform transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
           <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)}></div>
           <aside className="relative w-64 h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                 <span className="font-bold text-lg dark:text-white">Menu</span>
                 <button onClick={() => setMobileMenuOpen(false)} className="p-2"><X className="w-5 h-5 dark:text-slate-300" /></button>
              </div>
              <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                 <button
                  onClick={() => switchTab('HOME')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                    ${activeTab === 'HOME' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-300'}`}
                >
                  <ShieldCheck className="w-5 h-5" />
                  Dashboard
                </button>
                <button
                  onClick={() => switchTab('LIVE_ALERTS')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                    ${activeTab === 'LIVE_ALERTS' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-300'}`}
                >
                  <Radio className="w-5 h-5" />
                  Live Alerts
                </button>
                <button
                  onClick={() => switchTab('HISTORY')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                    ${activeTab === 'HISTORY' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-300'}`}
                >
                  <History className="w-5 h-5" />
                  History
                </button>
                <button
                  onClick={() => switchTab(DetectorType.SOS)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                    ${activeTab === DetectorType.SOS ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300' : 'text-slate-600 dark:text-slate-300'}`}
                >
                  <LifeBuoy className="w-5 h-5" />
                  Emergency
                </button>

                 <div className="pt-2 pb-1 px-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Detectors
                 </div>

                 {regularDetectors.map((detector) => {
                    const Icon = detector.icon;
                    return (
                      <button
                        key={detector.id}
                        onClick={() => switchTab(detector.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                          ${activeTab === detector.id ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}
                      >
                        <Icon className="w-5 h-5" />
                        {detector.title}
                      </button>
                    );
                  })}
              </nav>
           </aside>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen scroll-smooth pb-28 md:pb-8 relative">
          
          {/* Back to Home Button */}
          {activeTab !== 'HOME' && (
            <div className={`mx-auto mb-6 animate-fade-in ${(activeTab === 'HISTORY' || activeTab === DetectorType.SOS || activeTab === 'LIVE_ALERTS') ? 'max-w-4xl' : 'max-w-6xl'}`}>
               <button 
                  onClick={() => switchTab('HOME')}
                  className="group flex items-center gap-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors px-1"
               >
                  <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                  <span className="font-medium text-sm">Back to Home</span>
               </button>
            </div>
          )}

          {activeTab === 'HOME' ? (
            <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
                <div className="relative z-10 max-w-2xl">
                  <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">Verify information.<br/>Combat Misinformation.</h1>
                  <p className="text-blue-100 text-lg mb-8 leading-relaxed">
                    Our advanced AI engine analyzes patterns in text and URLs to protect you from misinformation, scams, and fraudulent activities in real-time.
                  </p>
                  <button 
                    onClick={() => switchTab(DETECTORS[0].id)}
                    className="bg-white text-blue-600 px-6 py-3 rounded-full font-semibold hover:bg-blue-50 transition-colors inline-flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-200"
                  >
                    Start Fact-Checking <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Select a Detector</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {regularDetectors.map((detector) => {
                    const Icon = detector.icon;
                    return (
                      <div 
                        key={detector.id}
                        onClick={() => switchTab(detector.id)}
                        className="group bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col items-start"
                      >
                        <div className={`p-3 rounded-xl bg-slate-50 dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors mb-4 ${detector.color} dark:text-current`}>
                          <Icon className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{detector.title}</h3>
                        <p className="text-slate-500 dark:text-slate-300 text-sm leading-relaxed mb-4 flex-1">
                          {detector.description}
                        </p>
                        <div className="text-sm font-semibold text-slate-400 dark:text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 flex items-center gap-1 transition-colors">
                          Try Detector <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
               {/* Powered By Google Section */}
              <div className="mt-16 pt-10 border-t border-slate-200 dark:border-slate-800">
                 <div className="text-center">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">Powered by Google Technologies</p>
                    <div className="flex flex-wrap justify-center gap-4 md:gap-8">
                       <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-full shadow-sm border border-slate-100 dark:border-slate-800">
                          <Flame className="w-5 h-5 text-orange-500" />
                          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Firebase</span>
                          <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline">(Auth, Firestore, Hosting)</span>
                       </div>
                       <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-full shadow-sm border border-slate-100 dark:border-slate-800">
                          <Shield className="w-5 h-5 text-green-500" />
                          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Safe Browsing API</span>
                       </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-full shadow-sm border border-slate-100 dark:border-slate-800">
                          <Code className="w-5 h-5 text-yellow-500" />
                          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">TensorFlow.js</span>
                       </div>
                    </div>
                 </div>
              </div>

            </div>
          ) : activeTab === 'LIVE_ALERTS' ? (
             <LiveThreats />
          ) : activeTab === 'HISTORY' ? (
             <div className="max-w-4xl mx-auto h-full flex flex-col gap-6 animate-fade-in">
                <div className="flex items-center justify-between">
                   <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                     <History className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                     Analysis History
                   </h1>
                   {history.length > 0 && (
                     <button 
                       onClick={clearHistory}
                       className="text-red-600 dark:text-red-400 text-sm font-medium hover:underline flex items-center gap-1"
                     >
                       <Trash2 className="w-4 h-4" /> Clear All
                     </button>
                   )}
                </div>

                {history.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <History className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No history yet</h3>
                    <p className="text-slate-500 dark:text-slate-400">Your recent analysis results will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((item) => {
                       const DetectorIcon = DETECTORS.find(d => d.id === item.detectorId)?.icon || Shield;
                       return (
                         <div 
                           key={item.id}
                           className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer group shadow-sm"
                           onClick={() => restoreHistorySession(item)}
                         >
                           <div className="flex flex-col md:flex-row md:items-center gap-4">
                             <div className="flex items-center gap-4 flex-1">
                               <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300">
                                 <DetectorIcon className="w-6 h-6" />
                               </div>
                               <div className="flex-1 min-w-0">
                                 <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                                      {DETECTORS.find(d => d.id === item.detectorId)?.title}
                                    </span>
                                    <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                      <Clock className="w-3 h-3" /> {formatDate(item.timestamp)}
                                    </span>
                                 </div>
                                 <p className="text-slate-600 dark:text-slate-300 text-sm truncate">
                                   {item.preview}
                                 </p>
                               </div>
                             </div>
                             
                             <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-slate-100 dark:border-slate-800 pt-3 md:pt-0">
                                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                  item.result.label === 'Safe' || item.result.label === 'Legit' || item.result.label === 'Real'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' 
                                    : item.result.label === 'Suspicious' || item.result.label === 'Unverified' || item.result.label === 'Biased'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                                }`}>
                                  {item.result.label}
                                </div>
                                <button 
                                  onClick={(e) => deleteHistoryItem(e, item.id)}
                                  className="p-2 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 hidden md:block" />
                             </div>
                           </div>
                         </div>
                       );
                    })}
                  </div>
                )}
             </div>
          ) : activeTab === DetectorType.SOS ? (
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
              <div className="bg-rose-50 dark:bg-rose-950 border border-rose-100 dark:border-rose-900 p-8 rounded-3xl mb-8">
                <div className="flex items-start gap-6">
                  <div className="p-4 bg-rose-100 dark:bg-rose-900/60 rounded-2xl text-rose-600 dark:text-rose-300 shrink-0 hidden md:block">
                     <LifeBuoy className="w-10 h-10" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-rose-900 dark:text-rose-200 mb-2">Safety Center</h1>
                    <p className="text-rose-700 dark:text-rose-300 leading-relaxed">
                      Access critical tools instantly. Store emergency contacts, report scams to authorities, and share your location if you feel unsafe.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Emergency Contacts Section */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-blue-500" />
                    Emergency Contacts
                  </h2>
                  
                  <div className="space-y-4 mb-6">
                    {contacts.length === 0 ? (
                      <div className="text-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 border-dashed">
                        <p className="text-slate-400 dark:text-slate-400 text-sm">No contacts saved yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {contacts.map((contact) => (
                          <div key={contact.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 gap-3">
                             <div>
                               <div className="font-bold text-slate-900 dark:text-white">{contact.name}</div>
                               <div className="text-sm text-slate-500 dark:text-slate-400">{contact.phone}</div>
                             </div>
                             <div className="flex items-center gap-2 self-end sm:self-auto">
                               <a 
                                 href={`tel:${contact.phone}`} 
                                 className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                 title="Call"
                               >
                                 <Phone className="w-4 h-4" />
                               </a>
                               <button 
                                 onClick={() => shareLocation(contact.phone)} 
                                 className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                 title="Send Location via WhatsApp"
                               >
                                  <MapPin className="w-4 h-4" />
                               </button>
                               <button onClick={() => deleteContact(contact.id)} className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                                 <Trash2 className="w-4 h-4" />
                               </button>
                             </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Add New Contact</p>
                    <div className="flex flex-col gap-3">
                      <input 
                        type="text" 
                        placeholder="Name (e.g., Mom, Police)" 
                        value={newContactName}
                        onChange={(e) => setNewContactName(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors"
                      />
                      <div className="flex gap-2">
                        <input 
                          type="tel" 
                          placeholder="Phone Number" 
                          value={newContactPhone}
                          onChange={(e) => setNewContactPhone(e.target.value)}
                          className="flex-1 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors"
                        />
                        <button 
                          onClick={addContact}
                          disabled={!newContactName || !newContactPhone}
                          className="bg-blue-600 disabled:bg-slate-300 disabled:dark:bg-slate-700 text-white p-2.5 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reporting & Quick Actions */}
                <div className="space-y-6">
                   {/* Quick Report */}
                   <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-orange-500" />
                        Quick Report
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        Immediately report cyber fraud or suspicious activities to official authorities.
                      </p>
                      <div className="grid gap-3">
                         <a 
                           href="https://cybercrime.gov.in/" 
                           target="_blank" 
                           rel="noreferrer"
                           className="flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 border border-blue-100 dark:border-blue-800 rounded-xl group transition-all"
                         >
                           <div className="flex items-center gap-3">
                              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              <span className="font-bold text-blue-900 dark:text-blue-100">Report Cyber Crime</span>
                           </div>
                           <ExternalLink className="w-4 h-4 text-blue-400 group-hover:text-blue-600" />
                         </a>
                         
                         <a 
                           href="https://safebrowsing.google.com/safebrowsing/report_phish/" 
                           target="_blank" 
                           rel="noreferrer"
                           className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700 rounded-xl group transition-all"
                         >
                            <div className="flex items-center gap-3">
                              <ShieldCheck className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                              <span className="font-bold text-slate-700 dark:text-slate-200">Report Phishing (Google)</span>
                           </div>
                           <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                         </a>
                      </div>
                   </div>

                    {/* Quick Tips */}
                   <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800/30 p-6">
                      <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-2 flex items-center gap-2">
                         <LifeBuoy className="w-5 h-5" />
                         Immediate Action Steps
                      </h3>
                      <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-200/80 list-disc pl-4">
                         <li>Do not delete suspicious messages; take screenshots.</li>
                         <li>Disconnect your device from the internet if you suspect malware.</li>
                         <li>Contact your bank immediately if financial data is compromised.</li>
                      </ul>
                   </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto h-full flex flex-col lg:flex-row gap-6 animate-fade-in">
               {/* Left Column: Input */}
              <div className="flex-1 flex flex-col gap-6">
                 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 md:p-8 shadow-sm transition-colors duration-200">
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`p-3 rounded-xl bg-slate-100 dark:bg-slate-800 ${activeDetector?.color} dark:text-current`}>
                        {ActiveIcon && <ActiveIcon className="w-8 h-8" />}
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{activeDetector?.title}</h1>
                        <p className="text-slate-500 dark:text-slate-400">{activeDetector?.description}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Media Upload Area with Drag and Drop */}
                      {activeDetector?.allowedInputs.some(type => type === 'image' || type === 'video') && (
                        <div className="mb-4">
                          {mediaItems.length === 0 ? (
                            <div 
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                              onDrop={handleDrop}
                              className={`
                                border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all group relative overflow-hidden
                                ${isDragging 
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]' 
                                  : 'border-slate-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}
                              `}
                            >
                              <div className={`p-3 rounded-full mb-3 transition-colors ${isDragging ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>
                                  <Upload className={`w-6 h-6 ${isDragging ? 'animate-bounce' : ''}`} />
                              </div>
                              <p className={`font-medium transition-colors mb-2 ${isDragging ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'}`}>
                                {isDragging ? 'Drop file here' : 'Drag & drop files here'}
                              </p>
                              
                              <div className="flex gap-2">
                                <button
                                  onClick={() => fileInputRef.current?.click()}
                                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                  Browse Files
                                </button>
                                {/* URL Button Removed from here */}
                              </div>

                              <p className="text-slate-400 dark:text-slate-500 text-xs mt-3">
                                Supports Multiple Images/Videos (Max 10MB each)
                              </p>
                              <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileChange} 
                                accept="image/*,video/*"
                                className="hidden" 
                                multiple
                              />
                            </div>
                          ) : (
                            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-800/50">
                               <div className="flex items-center justify-between mb-3">
                                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                     Selected Media ({mediaItems.length})
                                  </span>
                                  <button onClick={() => setMediaItems([])} className="text-xs text-red-500 hover:text-red-600 font-medium">Clear All</button>
                                </div>
                               
                               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                  {mediaItems.map((item) => (
                                     <div key={item.id} className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 aspect-square">
                                        {item.status === 'uploading' ? (
                                           <div className="w-full h-full flex flex-col items-center justify-center animate-pulse">
                                               <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                                               <span className="text-xs text-slate-500 font-medium">Loading...</span>
                                           </div>
                                        ) : item.status === 'error' ? (
                                            <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/20 p-2 text-center">
                                                <FileWarning className="w-8 h-8 text-red-500 mb-2" />
                                                <span className="text-[10px] text-red-600 dark:text-red-400 font-medium leading-tight line-clamp-3">{item.errorMessage || 'Error'}</span>
                                            </div>
                                        ) : item.type === 'image' ? (
                                           <img src={item.preview} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                           <div className="w-full h-full flex items-center justify-center text-slate-400">
                                              <FileVideo className="w-8 h-8" />
                                           </div>
                                        )}
                                        
                                        <button 
                                          onClick={() => removeMediaItem(item.id)}
                                          className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white p-1 rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                           <X className="w-3 h-3" />
                                        </button>
                                        
                                        {item.source === 'url' && item.status === 'ready' && (
                                           <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                              <LinkIcon className="w-2 h-2" /> URL
                                           </div>
                                        )}
                                     </div>
                                  ))}
                                  
                                  {/* Add more button tile */}
                                  <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-slate-400 hover:text-blue-500 aspect-square"
                                  >
                                      <Plus className="w-6 h-6 mb-1" />
                                      <span className="text-[10px] font-medium">Add File</span>
                                  </div>
                               </div>
                               <input 
                                  type="file" 
                                  ref={fileInputRef} 
                                  onChange={handleFileChange} 
                                  accept="image/*,video/*"
                                  className="hidden" 
                                  multiple
                                />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Text Input Area */}
                      {(activeDetector?.allowedInputs.includes('text')) && (
                         <div className="relative">
                            <textarea
                              value={inputText}
                              onChange={(e) => setInputText(e.target.value)}
                              placeholder={activeDetector?.placeholder}
                              className="w-full h-48 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none font-medium"
                            />
                            <div className="absolute top-3 right-3 flex gap-2">
                                <button
                                    onClick={handleAddTextUrl}
                                    className="p-2 bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 transition-all"
                                    title="Add URL to analyze"
                                >
                                    <LinkIcon className="w-4 h-4" />
                                </button>
                                {inputText && (
                                    <button 
                                        onClick={() => setInputText('')}
                                        className="p-2 bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 transition-all"
                                        title="Clear Text"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                         </div>
                      )}
                     
                      
                      {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm flex items-center gap-2 animate-pulse">
                          <AlertCircle className="w-5 h-5 shrink-0" />
                          {error}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-2">
                         <button
                            onClick={handleReset}
                            disabled={loading || (!inputText && mediaItems.length === 0 && !result)}
                            className={`
                                px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2
                                ${(!inputText && mediaItems.length === 0 && !result)
                                  ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}
                            `}
                        >
                            <RotateCcw className="w-4 h-4" />
                            <span className="hidden sm:inline">Reset</span>
                        </button>
                        
                        <div className="flex items-center gap-4">
                             <p className="text-xs text-slate-400 dark:text-slate-500 hidden xl:block">
                               Your data is processed securely and is not stored permanently.
                            </p>
                            <button
                              onClick={handleAnalyze}
                              disabled={loading || isProcessingFile || (!inputText.trim() && mediaItems.every(i => i.status !== 'ready'))}
                              className={`
                                px-8 py-3 rounded-xl font-semibold text-white shadow-lg transition-all duration-200 flex items-center gap-2
                                ${loading || isProcessingFile || (!inputText.trim() && mediaItems.every(i => i.status !== 'ready'))
                                  ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed shadow-none' 
                                  : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-blue-600/30'}
                              `}
                            >
                              {loading ? 'Analyzing...' : 'Analyze Content'}
                              {!loading && <ArrowRight className="w-4 h-4" />}
                            </button>
                        </div>
                      </div>
                    </div>
                 </div>
                 
                 {/* Tips Section */}
                 <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-2xl p-6">
                    <h3 className="text-blue-900 dark:text-blue-300 font-bold mb-2 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5" />
                      Safety Tip
                    </h3>
                    <p className="text-blue-800/80 dark:text-blue-200/80 text-sm leading-relaxed">
                      Always cross-check information with official sources. Legitimate organizations will never ask for sensitive passwords or immediate payments through unofficial channels.
                    </p>
                 </div>
              </div>

              {/* Right Column: Result */}
              <div className="w-full lg:w-[450px] xl:w-[500px] shrink-0">
                 <ResultCard result={result} loading={loading} />
              </div>
            </div>
          )}
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-50">
          <div className="flex items-center overflow-x-auto gap-2 px-4 py-2 custom-scrollbar no-scrollbar">
             <button
              onClick={() => switchTab('HOME')}
              className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all ${
                activeTab === 'HOME' 
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium">Home</span>
            </button>
            <button
              onClick={() => switchTab('LIVE_ALERTS')}
              className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all relative ${
                activeTab === 'LIVE_ALERTS' 
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="relative">
                <Radio className="w-5 h-5 mb-1" />
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse border border-white dark:border-slate-900"></span>
              </div>
              <span className="text-[10px] font-medium">Alerts</span>
            </button>
            <button
              onClick={() => switchTab('HISTORY')}
              className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all ${
                activeTab === 'HISTORY' 
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <History className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium">History</span>
            </button>
            <button
              onClick={() => switchTab(DetectorType.SOS)}
              className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all ${
                activeTab === DetectorType.SOS 
                  ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <LifeBuoy className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium">SOS</span>
            </button>
            
            {regularDetectors.map((detector) => {
              const Icon = detector.icon;
              const isActive = activeTab === detector.id;
              return (
                <button
                  key={detector.id}
                  onClick={() => switchTab(detector.id)}
                  className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all ${
                    isActive 
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-medium truncate max-w-full px-1">{detector.title.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;