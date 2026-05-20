import { useState, useRef, useEffect } from 'react';
import { 
  Send, Loader2, Cloud, Layers, Cpu, Sparkles, 
  Settings, ChevronLeft, SkipForward, RotateCcw, 
  X, Check, AlertTriangle 
} from 'lucide-react';
import ChatBubble from './ChatBubble';
import api from '../../utils/api';
import { generateLocalChatResponse, fetchLocalModels } from '../../utils/localOllama';

const PLATFORM_QUESTIONS = {
  AWS: [
    "What is the expected scale or active user base of your system? (e.g. thousands of monthly active users, or daily peaks, to help us size your resources properly?)",
    "How would you like to host and deliver your frontend client? (e.g. static S3 + CloudFront CDN for super-fast global delivery, or server-side rendered on AWS Amplify/App Runner?)",
    "What compute tier fits your backend business logic best? (e.g. Serverless AWS Lambda for zero-idle scaling, containerized Amazon ECS/EKS for constant loads, or EC2 VMs?)",
    "What kind of database fits your data model? (e.g. Relational Postgres/MySQL via Amazon RDS/Aurora, or high-throughput NoSQL via DynamoDB?)",
    "How will clients communicate with your backend? (e.g. REST API via Amazon API Gateway, or GraphQL via AWS AppSync?)",
    "How would you like to handle user registration, logins, and JWT token validation? (e.g. Serverless AWS Cognito user pools, or custom OAuth/Auth0?)",
    "Does your application require persistent object storage for files, media, or backups? (e.g. Amazon S3 buckets, or shared Elastic File System?)",
    "Do you need a low-latency caching layer to speed up database read operations? (e.g. ElastiCache Redis/Memcached, or standard DB read replicas?)",
    "What level of network security do you require? (e.g. placing resources in private subnets, enabling AWS WAF firewall, or KMS key encryption?)",
    "How do you plan to manage deployment and Infrastructure as Code? (e.g. Terraform, AWS CloudFormation/CDK, or standard GitHub Actions pipelines?)"
  ],
  GCP: [
    "What is the expected scale or active user base of your system? (e.g. thousands of monthly active users, or daily peaks, to help us size your resources properly?)",
    "How would you like to host and deliver your frontend client? (e.g. Firebase Hosting + Cloud CDN, or server-side rendered on Cloud Run?)",
    "What compute tier fits your backend business logic best? (e.g. Serverless Cloud Run / Cloud Functions, containerized Google Kubernetes Engine (GKE), or Compute Engine VMs?)",
    "What kind of database fits your data model? (e.g. Relational Postgres/MySQL via Cloud SQL/Spanner, or high-throughput NoSQL via Firestore/Bigtable?)",
    "How will clients communicate with your backend? (e.g. Google Cloud API Gateway, or direct Cloud Run URLs?)",
    "How would you like to handle user registration, logins, and JWT token validation? (e.g. Google Identity Platform / Firebase Auth, or custom OAuth?)",
    "Does your application require persistent object storage for files, media, or backups? (e.g. Cloud Storage buckets?)",
    "Do you need a low-latency caching layer to speed up database read operations? (e.g. Memorystore Redis/Memcached?)",
    "What level of network security do you require? (e.g. Cloud Armor WAF firewall, VPC Service Controls, or Cloud KMS encryption?)",
    "How do you plan to manage deployment and Infrastructure as Code? (e.g. Terraform, Cloud Build, or standard GitHub Actions?)"
  ],
  Azure: [
    "What is the expected scale or active user base of your system? (e.g. thousands of monthly active users, or daily peaks, to help us size your resources properly?)",
    "How would you like to host and deliver your frontend client? (e.g. Azure Static Web Apps + Front Door CDN, or App Service?)",
    "What compute tier fits your backend business logic best? (e.g. Serverless Azure Functions, containerized Azure Container Apps / Azure Kubernetes Service (AKS), or App Service?)",
    "What kind of database fits your data model? (e.g. Relational Azure SQL / Database for PostgreSQL, or high-throughput NoSQL via Cosmos DB?)",
    "How will clients communicate with your backend? (e.g. Azure API Management (APIM), or Application Gateway?)",
    "How would you like to handle user registration, logins, and JWT token validation? (e.g. Microsoft Entra ID / B2C, or custom OAuth?)",
    "Does your application require persistent object storage for files, media, or backups? (e.g. Azure Blob Storage?)",
    "Do you need a low-latency caching layer to speed up database read operations? (e.g. Azure Cache for Redis?)",
    "What level of network security do you require? (e.g. Azure WAF firewall, Key Vault, or private endpoints?)",
    "How do you plan to manage deployment and Infrastructure as Code? (e.g. Terraform, Azure Bicep/ARM, or Azure Pipelines/GitHub Actions?)"
  ]
};

const STEP_TITLES = [
  "Scale & Audience",
  "Frontend Delivery",
  "Backend Compute",
  "Database Tier",
  "API & Gateway",
  "User Authentication",
  "Object Storage",
  "Caching Layer",
  "Network Security",
  "DevOps & IaC"
];

const DEFAULT_SETTINGS = {
  routingMode: 'cloud',
  localUrl: 'http://localhost:11434',
  localApiKey: '',
  localModel: 'gemma3'
};

const ChatInterface = ({ onGenerate }) => {
  // Onboarding tracking
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPlatform, setSelectedPlatform] = useState('AWS');

  const [messages, setMessages] = useState([
    { 
      text: `Hi! I'm Cloudy, your expert Cloud Architect assistant. Let's design your AWS system together!\n\n**Question 1: ${PLATFORM_QUESTIONS.AWS[0]}**`, 
      isBot: true 
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endOfMessagesRef = useRef(null);

  // Settings Panel State
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('clouddaddy_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Settings testing state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [availableModels, setAvailableModels] = useState(['gemma3']);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Load models on settings modal open
  useEffect(() => {
    if (showSettings && settings.routingMode === 'local') {
      loadModelsList();
    }
  }, [showSettings, settings.routingMode]);

  const loadModelsList = async () => {
    try {
      const models = await fetchLocalModels(settings.localUrl, settings.localApiKey);
      if (models && models.length > 0) {
        setAvailableModels(models);
      }
    } catch (e) {
      console.warn("Could not retrieve models list dynamically", e);
    }
  };

  const saveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('clouddaddy_settings', JSON.stringify(newSettings));
  };

  const handlePlatformChange = (plat) => {
    setSelectedPlatform(plat);
    setCurrentStep(0);
    const questions = PLATFORM_QUESTIONS[plat] || PLATFORM_QUESTIONS.AWS;
    setMessages([
      {
        text: `Hi! I'm Cloudy, your expert Cloud Architect assistant. Let's design your ${plat} system together!\n\n**Question 1: ${questions[0]}**`,
        isBot: true
      }
    ]);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const models = await fetchLocalModels(settings.localUrl, settings.localApiKey);
      if (models && models.length > 0) {
        setAvailableModels(models);
        setTestResult({
          success: true,
          message: `Connected successfully! Found ${models.length} model(s).`
        });
      } else {
        setTestResult({
          success: false,
          message: "Connected, but no models were found."
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: "Failed to connect. Ensure Ollama is running and OLLAMA_ORIGINS='*' is set."
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSend = async (e, customMessage = null) => {
    if (e) e.preventDefault();
    const userMessage = customMessage || input.trim();
    if (!userMessage || isTyping) return;

    // Append user message
    const newMessages = [...messages, { text: userMessage, isBot: false }];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);

    try {
      let botReply = '';

      if (settings.routingMode === 'local') {
        // Direct local browser-to-Ollama connection
        const response = await generateLocalChatResponse({
          url: settings.localUrl,
          apiKey: settings.localApiKey,
          model: settings.localModel,
          message: userMessage,
          history: messages,
          platform: selectedPlatform,
          questionIndex: nextStep
        });
        botReply = response.reply;
      } else {
        // Cloud API endpoint gateway
        const response = await api.post('/generate/chat', {
          message: userMessage,
          history: messages,
          platform: selectedPlatform,
          question_index: nextStep
        });
        botReply = response.data?.reply || response.data?.message;
      }

      if (botReply) {
        setMessages(prev => [...prev, { text: botReply, isBot: true }]);
      } else {
        throw new Error("No response content from model");
      }
    } catch (err) {
      console.error("Chat error:", err);
      const fallbackQuestions = PLATFORM_QUESTIONS[selectedPlatform] || PLATFORM_QUESTIONS.AWS;
      const nextQuestion = nextStep < 10 ? fallbackQuestions[nextStep] : null;

      let fallbackText = '';
      if (nextQuestion) {
        fallbackText = `Got it! Let's proceed. **Question ${nextStep + 1}: ${nextQuestion}**`;
      } else {
        fallbackText = "Splendid! We've gathered all required configurations. Please review your setup and click 'Generate Architecture' when you are ready!";
      }

      setMessages(prev => [...prev, { text: fallbackText, isBot: true }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 0) return;
    const prevStep = currentStep - 1;
    setCurrentStep(prevStep);
    
    // Find the last message sent by user and roll back history to before that message
    setMessages(prev => {
      const lastUserIdx = prev.map(m => !m.isBot).lastIndexOf(true);
      if (lastUserIdx !== -1) {
        return prev.slice(0, lastUserIdx);
      }
      return prev;
    });
  };

  const handleSkip = () => {
    if (currentStep >= 10) return;
    handleSend(null, "I'll skip this, let's use the default best-practice recommendation.");
  };

  const handleRestart = () => {
    handlePlatformChange(selectedPlatform);
  };

  const handleGenerateClick = () => {
    const userPrompts = messages.filter(m => !m.isBot).map(m => m.text);
    const finalPrompt = userPrompts[userPrompts.length - 1] || "Web Application Architecture";
    onGenerate(finalPrompt, selectedPlatform, messages);
  };

  return (
    <div className="flex flex-col h-full glass-card rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl bg-slate-900/40 relative">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50 bg-slate-800/80 backdrop-blur-sm flex items-center justify-between z-10 shrink-0">
        <h3 className="font-semibold text-white flex items-center gap-2 text-sm md:text-base">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Cloudy AI Architect
          <span className="text-[10px] bg-slate-750 px-2 py-0.5 rounded-full text-indigo-300 font-bold border border-indigo-500/20">
            {settings.routingMode === 'local' ? `Local: ${settings.localModel}` : 'Cloud AI'}
          </span>
        </h3>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
            title="AI Model Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {messages.length > 1 && (
            <button
              onClick={handleGenerateClick}
              className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-750 text-white rounded-lg text-xs font-bold shadow-md border border-indigo-400/20 transition-all transform hover:scale-105"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generate
            </button>
          )}
        </div>
      </div>

      {/* Premium Onboarding Progress Bar */}
      {currentStep < 10 && (
        <div className="px-4 py-3 bg-slate-950/40 border-b border-slate-800 shrink-0 font-Outfit text-left">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Onboarding: Step {currentStep + 1} of 10
            </span>
            <span className="text-[11px] font-bold text-indigo-400">
              {STEP_TITLES[currentStep]}
            </span>
          </div>

          {/* Progress dots & bar container */}
          <div className="flex items-center gap-1.5 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-850">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-500 ease-out" 
              style={{ width: `${(currentStep + 1) * 10}%` }}
            ></div>
          </div>

          {/* Step dots visual preview */}
          <div className="flex justify-between mt-2 px-1">
            {STEP_TITLES.map((title, i) => (
              <div 
                key={i} 
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  i < currentStep 
                    ? 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.6)]' 
                    : i === currentStep 
                    ? 'bg-indigo-400 scale-125 shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-pulse' 
                    : 'bg-slate-700'
                }`}
                title={`Step ${i+1}: ${title}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Platform Selector */}
      <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800 shrink-0 flex flex-col gap-1 text-left">
        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Select Cloud Provider:</p>
        <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-850">
          {['AWS', 'GCP', 'Azure'].map((plat) => (
            <button
              key={plat}
              type="button"
              onClick={() => handlePlatformChange(plat)}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 ${
                selectedPlatform === plat
                  ? plat === 'AWS' 
                    ? 'bg-amber-600/90 text-white shadow-md border border-amber-500/20'
                    : plat === 'GCP'
                    ? 'bg-emerald-600/90 text-white shadow-md border border-emerald-500/20'
                    : 'bg-indigo-600/90 text-white shadow-md border border-indigo-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
              }`}
            >
              {plat === 'AWS' && <Cloud className="w-3.5 h-3.5" />}
              {plat === 'GCP' && <Layers className="w-3.5 h-3.5" />}
              {plat === 'Azure' && <Cpu className="w-3.5 h-3.5" />}
              {plat}
            </button>
          ))}
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
        {messages.map((msg, idx) => (
          <ChatBubble key={idx} message={msg.text} isBot={msg.isBot} />
        ))}
        {isTyping && (
          <div className="flex gap-4 mb-4 text-left">
            <div className="flex-shrink-0 mt-1">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
              </div>
            </div>
            <div className="bg-slate-800 border border-slate-700 p-4 rounded-2xl rounded-tl-sm w-16 flex items-center justify-center">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Onboarding Assistant Controls & Input Form */}
      <div className="p-4 bg-slate-800/50 border-t border-slate-700/50 flex flex-col gap-3 shrink-0">
        
        {/* Onboarding Step Quick Actions */}
        {currentStep < 10 && (
          <div className="flex items-center justify-between gap-3 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800 font-Outfit">
            <button
              onClick={handleBack}
              disabled={currentStep === 0 || isTyping}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white disabled:text-slate-600 disabled:hover:text-slate-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <button
              onClick={handleRestart}
              className="p-1.5 text-slate-500 hover:text-indigo-400 rounded-lg hover:bg-slate-850 transition-all"
              title="Restart Onboarding"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleSkip}
              disabled={isTyping}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 disabled:text-slate-600 transition-colors"
            >
              Skip
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              currentStep < 10 
                ? `Answer question ${currentStep + 1}...`
                : `Ask Cloudy about your ${selectedPlatform} system...`
            }
            className="w-full bg-slate-900 border border-slate-700 rounded-full pl-5 pr-12 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner text-sm"
            disabled={isTyping}
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isTyping}
            className="absolute right-2 p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-full transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {messages.length > 1 && (
          <button
            onClick={handleGenerateClick}
            className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-lg border border-indigo-500/20 transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <Sparkles className="w-4 h-4" />
            Generate Architecture & Cost Estimate
          </button>
        )}
      </div>

      {/* Floating Settings Glass Modal */}
      {showSettings && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-Outfit text-left">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90%]">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/60">
              <h4 className="font-bold text-white flex items-center gap-2 text-sm md:text-base">
                <Settings className="w-4 h-4 text-indigo-400" />
                AI Architect Model Settings
              </h4>
              <button 
                onClick={() => {
                  setShowSettings(false);
                  setTestResult(null);
                }}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
              
              {/* Routing Mode Toggle */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Routing Mode</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-850">
                  <button
                    type="button"
                    onClick={() => saveSettings({ ...settings, routingMode: 'cloud' })}
                    className={`py-2 px-3 rounded-lg font-semibold transition-all ${
                      settings.routingMode === 'cloud'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Cloud API
                  </button>
                  <button
                    type="button"
                    onClick={() => saveSettings({ ...settings, routingMode: 'local' })}
                    className={`py-2 px-3 rounded-lg font-semibold transition-all ${
                      settings.routingMode === 'local'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Local Ollama
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 leading-normal">
                  {settings.routingMode === 'cloud' 
                    ? "Routes requests through the AWS Lambda backend cloud gateway."
                    : "Routes requests directly from your browser to local host endpoints (bypasses lambda sandbox)."}
                </p>
              </div>

              {/* Local Ollama Fields */}
              {settings.routingMode === 'local' && (
                <div className="space-y-3.5 border-t border-slate-800 pt-4">
                  
                  {/* Local Url */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ollama Endpoint URL</label>
                    <input
                      type="text"
                      value={settings.localUrl}
                      onChange={(e) => saveSettings({ ...settings, localUrl: e.target.value })}
                      placeholder="http://localhost:11434"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Auth API key (Optional) */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Proxy Authorization Key <span className="text-slate-555 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="password"
                      value={settings.localApiKey}
                      onChange={(e) => saveSettings({ ...settings, localApiKey: e.target.value })}
                      placeholder="Enter proxy key/token (e.g. e8c955...)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                    />
                    <p className="text-[9px] text-slate-500 leading-normal">
                      Useful for local gateways requiring header-based authentication (LiteLLM, Open WebUI, Cloudflare).
                    </p>
                  </div>

                  {/* Model Selection */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Ollama Model</label>
                    <div className="flex gap-2">
                      <select
                        value={settings.localModel}
                        onChange={(e) => saveSettings({ ...settings, localModel: e.target.value })}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                      >
                        {availableModels.map(model => (
                          <option key={model} value={model}>{model}</option>
                        ))}
                      </select>
                      
                      <input
                        type="text"
                        value={settings.localModel}
                        onChange={(e) => saveSettings({ ...settings, localModel: e.target.value })}
                        placeholder="Or type custom model..."
                        className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Connection Tester */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={isTesting}
                      className="w-full py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold rounded-lg border border-slate-750 transition-colors flex items-center justify-center gap-1.5"
                    >
                      {isTesting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Testing connection...
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                          Test Local Connection
                        </>
                      )}
                    </button>

                    {/* Test result alert */}
                    {testResult && (
                      <div className={`mt-3 p-3 rounded-lg border flex gap-2.5 items-start ${
                        testResult.success 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
                          : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                      }`}>
                        {testResult.success ? (
                          <Check className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" />
                        )}
                        <p className="leading-normal">{testResult.message}</p>
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowSettings(false);
                  setTestResult(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-md transition-colors"
              >
                Apply & Save Settings
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ChatInterface;
