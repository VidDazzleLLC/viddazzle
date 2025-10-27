import { useState, useEffect } from 'react';
import { Radio, Search, Settings, BarChart3, RefreshCw, Play, Loader2, ArrowLeft, Zap, Pause, CheckCircle } from 'lucide-react';
import SocialLeadCard from './SocialLeadCard';
import SocialAutomationSettings from './SocialAutomationSettings';

export default function SocialListening() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testPost, setTestPost] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [automationSettings, setAutomationSettings] = useState(null);
  const [automationStatus, setAutomationStatus] = useState('inactive'); // inactive, active, paused
  const [todayPostCount, setTodayPostCount] = useState(0);
  const [configError, setConfigError] = useState(null);

  // Validate environment variables on mount
  useEffect(() => {
    const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME;
    const companySolution = process.env.NEXT_PUBLIC_COMPANY_SOLUTION;

    if (!companyName || !companySolution) {
      setConfigError(
        '⚠️ Configuration Missing: NEXT_PUBLIC_COMPANY_NAME and NEXT_PUBLIC_COMPANY_SOLUTION must be set in environment variables for AI responses to work properly.'
      );
      console.error('Missing environment variables:', {
        NEXT_PUBLIC_COMPANY_NAME: !!companyName,
        NEXT_PUBLIC_COMPANY_SOLUTION: !!companySolution,
      });
    }
  }, []);

  // Load automation settings on mount
  useEffect(() => {
    loadAutomationSettings();
  }, []);

  const loadAutomationSettings = async () => {
    try {
      const response = await fetch('/api/social-listening/config');
      const data = await response.json();
      if (data.success) {
        setAutomationSettings(data.settings);
        // Set automation status based on mode
        if (data.settings.mode !== 'manual') {
          setAutomationStatus('active');
        }
      }
    } catch (error) {
      console.error('Failed to load automation settings:', error);
    }
  };

  const loadTodayPostCount = async () => {
    try {
      // This would fetch from a stats API - for now, simulate
      const response = await fetch('/api/social-listening/stats');
      if (response.ok) {
        const data = await response.json();
        setTodayPostCount(data.posts_today || 0);
      }
    } catch (error) {
      console.log('Stats not available yet');
    }
  };

  const toggleAutomationPause = () => {
    if (automationStatus === 'active') {
      setAutomationStatus('paused');
      alert('✅ Automation paused. No new posts will be made until resumed.');
    } else if (automationStatus === 'paused') {
      setAutomationStatus('active');
      alert('✅ Automation resumed. Posts will continue based on your settings.');
    }
  };

  const handleAnalyzePost = async () => {
    if (!testPost.trim()) {
      alert('Please enter a social media post to analyze');
      return;
    }

    setAnalyzing(true);
    try {
      const response = await fetch('/api/social-listening/process-mention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: testPost,
          platform: 'linkedin',
          author: {
            name: 'Test User',
            title: 'Unknown',
            company: 'Unknown'
          },
          your_company: process.env.NEXT_PUBLIC_COMPANY_NAME || 'Your Company',
          your_solution: process.env.NEXT_PUBLIC_COMPANY_SOLUTION || 'Your solution',
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Convert the workflow result to a lead format
        const newLead = {
          id: data.workflow_id,
          text: data.input.text_preview,
          platform: data.input.platform,
          author_name: data.input.author_name,
          post_url: data.input.post_url,
          analyzed_at: data.processed_at,

          // Analysis data
          sentiment: data.sentiment_analysis.sentiment,
          sentiment_score: data.sentiment_analysis.sentiment_score,
          lead_score: data.sentiment_analysis.lead_score,
          lead_quality: data.sentiment_analysis.lead_quality,
          urgency: data.sentiment_analysis.urgency,
          pain_points: data.sentiment_analysis.pain_points || [],
          buying_signals: data.sentiment_analysis.buying_signals || [],
          confidence: data.sentiment_analysis.confidence,

          // Response data
          response_text: data.sales_response.generated ? data.sales_response.response_text : null,
          alternative_response: data.sales_response.alternative,
          ready_to_post: data.sales_response.ready_to_post,
          response_length: data.sales_response.generated ? data.sales_response.response_text?.length : 0,
          engagement_approach: data.sentiment_analysis.engagement_approach || data.sales_response.engagement_approach,

          // Next steps
          next_steps: data.next_steps || [],

          // Metadata
          is_lead: data.sentiment_analysis.is_lead,
          summary: data.summary,
        };

        // Add to beginning of leads array
        setLeads([newLead, ...leads]);
        setTestPost(''); // Clear the input

        alert('✅ Lead analyzed successfully! Check the results below.');
      } else {
        alert('Failed to analyze: ' + data.error);
      }
    } catch (error) {
      console.error('Error analyzing post:', error);
      alert('Failed to analyze post: ' + error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePostResponse = async (lead) => {
    // For now, just show an alert with the response
    // In Phase 2, we'll add actual posting logic
    alert('🎉 In production, this would post to ' + lead.platform + '!\n\nFor now, copy the response and post manually.');
    console.log('Would post:', lead.response_text);
  };

  const handleIgnore = (lead) => {
    if (confirm('Are you sure you want to ignore this lead?')) {
      setLeads(leads.filter(l => l.id !== lead.id));
    }
  };

  const loadExampleLead = () => {
    setTestPost("Really frustrated with our current CRM system. Spent 3 hours trying to generate a simple sales report. There has to be a better way! Our team is wasting so much time on manual data entry.");
  };

  const filterLeads = (quality) => {
    return leads.filter(lead => {
      if (quality === 'all') return true;
      return lead.lead_quality === quality;
    });
  };

  const hotLeads = filterLeads('hot');
  const warmLeads = filterLeads('warm');
  const coldLeads = filterLeads('cold');

  const handleSaveSettings = async (newSettings) => {
    setAutomationSettings(newSettings);
    setShowSettings(false);
    await loadAutomationSettings(); // Reload to confirm save
  };

  // If showing settings, render settings component
  if (showSettings) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setShowSettings(false)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
        <SocialAutomationSettings onSave={handleSaveSettings} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configuration Error Banner */}
      {configError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-red-600 text-2xl">⚠️</div>
            <div className="flex-1">
              <h3 className="text-red-900 font-semibold mb-1">Configuration Error</h3>
              <p className="text-red-700 text-sm mb-3">{configError}</p>
              <p className="text-red-600 text-xs">
                Add these to your .env.local file and restart the server:
                <br />
                <code className="bg-red-100 px-2 py-1 rounded mt-1 inline-block">
                  NEXT_PUBLIC_COMPANY_NAME="Your Company Name"
                  <br />
                  NEXT_PUBLIC_COMPANY_SOLUTION="Your solution description"
                </code>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header with Settings and Automation Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900">Social Listening</h2>
          {automationSettings && automationSettings.mode !== 'manual' && (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
              automationStatus === 'active' ? 'bg-green-100 text-green-700' :
              automationStatus === 'paused' ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              <Zap className="w-4 h-4" />
              {automationStatus === 'active' ? 'Automation Active' :
               automationStatus === 'paused' ? 'Automation Paused' :
               'Automation Inactive'}
            </div>
          )}
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Settings className="w-4 h-4" />
          Automation Settings
        </button>
      </div>

      {/* Automation Control Panel */}
      {automationSettings && automationSettings.mode !== 'manual' && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-sm p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <div className="text-sm text-gray-600 mb-1">Mode</div>
                <div className="text-lg font-semibold text-gray-900 capitalize">
                  {automationSettings.mode === 'semi-auto' ? 'Semi-Automatic' : 'Full-Automatic'}
                </div>
              </div>
              <div className="h-10 w-px bg-gray-300"></div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Posts Today</div>
                <div className="text-lg font-semibold text-gray-900">
                  {todayPostCount} / {automationSettings.max_posts_per_day}
                </div>
              </div>
              <div className="h-10 w-px bg-gray-300"></div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Threshold</div>
                <div className="text-lg font-semibold text-gray-900">
                  {automationSettings.auto_post_threshold}+ score
                </div>
              </div>
              <div className="h-10 w-px bg-gray-300"></div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Active Platforms</div>
                <div className="flex gap-2">
                  {Object.entries(automationSettings.enabled_platforms || {})
                    .filter(([_, enabled]) => enabled)
                    .map(([platform]) => (
                      <span key={platform} className="px-2 py-1 bg-white rounded text-xs font-medium text-gray-700 capitalize">
                        {platform}
                      </span>
                    ))}
                </div>
              </div>
            </div>
            <button
              onClick={toggleAutomationPause}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                automationStatus === 'active'
                  ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {automationStatus === 'active' ? (
                <>
                  <Pause className="w-4 h-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Resume
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Total Analyzed</div>
              <div className="text-3xl font-bold text-gray-900">{leads.length}</div>
            </div>
            <Radio className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-red-50 rounded-lg shadow-sm p-6 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-red-600 mb-1">🔥 Hot Leads</div>
              <div className="text-3xl font-bold text-red-600">{hotLeads.length}</div>
            </div>
            <div className="text-red-600 text-xs">Score 80+</div>
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg shadow-sm p-6 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-yellow-600 mb-1">⚡ Warm Leads</div>
              <div className="text-3xl font-bold text-yellow-600">{warmLeads.length}</div>
            </div>
            <div className="text-yellow-600 text-xs">Score 60-79</div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg shadow-sm p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-blue-600 mb-1">❄️ Cold Leads</div>
              <div className="text-3xl font-bold text-blue-600">{coldLeads.length}</div>
            </div>
            <div className="text-blue-600 text-xs">Score &lt;60</div>
          </div>
        </div>
      </div>

      {/* Test/Demo Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-sm p-6 border border-blue-200">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Test Social Listening</h2>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Paste any social media post below to see AI analysis, lead scoring, and generated responses in action.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Social Media Post
            </label>
            <textarea
              value={testPost}
              onChange={(e) => setTestPost(e.target.value)}
              placeholder='Example: "Looking for a better CRM solution. Our current one is too expensive and hard to use. Budget around $500/month. Any recommendations?"'
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows="4"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleAnalyzePost}
              disabled={analyzing || !testPost.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Analyze Post
                </>
              )}
            </button>

            <button
              onClick={loadExampleLead}
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Load Example
            </button>
          </div>

          <div className="text-xs text-gray-500">
            💡 Tip: Try different types of posts (complaints, questions, requests) to see how AI identifies hot vs cold leads
          </div>
        </div>
      </div>

      {/* Leads Section */}
      {leads.length > 0 && (
        <div className="space-y-6">
          {/* Hot Leads */}
          {hotLeads.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-red-600">🔥</span>
                Hot Leads ({hotLeads.length})
              </h3>
              <div className="space-y-4">
                {hotLeads.map(lead => (
                  <SocialLeadCard
                    key={lead.id}
                    lead={lead}
                    onPost={handlePostResponse}
                    onIgnore={handleIgnore}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Warm Leads */}
          {warmLeads.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-yellow-600">⚡</span>
                Warm Leads ({warmLeads.length})
              </h3>
              <div className="space-y-4">
                {warmLeads.map(lead => (
                  <SocialLeadCard
                    key={lead.id}
                    lead={lead}
                    onPost={handlePostResponse}
                    onIgnore={handleIgnore}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Cold Leads */}
          {coldLeads.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-blue-600">❄️</span>
                Cold Leads ({coldLeads.length})
              </h3>
              <div className="space-y-4">
                {coldLeads.map(lead => (
                  <SocialLeadCard
                    key={lead.id}
                    lead={lead}
                    onPost={handlePostResponse}
                    onIgnore={handleIgnore}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {leads.length === 0 && (
        <div className="text-center py-12">
          <Radio className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Leads Yet</h3>
          <p className="text-gray-600 mb-6">
            Test the system by pasting a social media post above, or connect your social listening tools to start monitoring automatically.
          </p>
          <button
            onClick={loadExampleLead}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Try Example Post
          </button>
        </div>
      )}
    </div>
  );
}
