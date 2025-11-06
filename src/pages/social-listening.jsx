// Social Media Listening Dashboard
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function SocialListeningDashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [mentions, setMentions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('campaigns'); // campaigns, mentions, outreach, analytics

  // Mock user ID - in production, get from auth
  // Generate a UUID for demo purposes (replace with real authentication later)
  const userId = typeof window !== 'undefined' && window.crypto ? crypto.randomUUID() : '00000000-0000-0000-0000-000000000001';
  useEffect(() => {
    loadCampaigns();
  }, []);

  useEffect(() => {
    if (selectedCampaign) {
      loadMentions(selectedCampaign.id);
      loadAnalytics(selectedCampaign.id);
    }
  }, [selectedCampaign]);

  const loadCampaigns = async () => {
    try {
      const response = await axios.get(`/api/social-listening/campaigns?userId=${userId}`);
      setCampaigns(response.data);
      if (response.data.length > 0 && !selectedCampaign) {
        setSelectedCampaign(response.data[0]);
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMentions = async (campaignId) => {
    try {
      const response = await axios.get(`/api/social-listening/mentions?campaignId=${campaignId}&limit=50`);
      setMentions(response.data.mentions);
    } catch (error) {
      console.error('Error loading mentions:', error);
    }
  };

  const loadAnalytics = async (campaignId) => {
    try {
      const response = await axios.get(`/api/social-listening/analytics?campaignId=${campaignId}`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const runListeningJob = async () => {
    if (!selectedCampaign) return;

    try {
      setLoading(true);
      const response = await axios.post('/api/social-listening/listen', {
        campaignId: selectedCampaign.id
      });
      alert(`Found ${response.data.mentionsSaved} new mentions!`);
      loadMentions(selectedCampaign.id);
      loadAnalytics(selectedCampaign.id);
    } catch (error) {
      console.error('Error running listening job:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && campaigns.length === 0) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Social Media Listening</h1>
            <div className="flex gap-2">
              <button
                onClick={runListeningJob}
                disabled={!selectedCampaign || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Running...' : 'Run Listening Job'}
              </button>
            </div>
          </div>

          {/* Campaign Selector */}
          {campaigns.length > 0 && (
            <div className="pb-4">
              <select
                value={selectedCampaign?.id || ''}
                onChange={(e) => {
                  const campaign = campaigns.find(c => c.id === e.target.value);
                  setSelectedCampaign(campaign);
                }}
                className="px-3 py-2 border rounded-lg"
              >
                {campaigns.map(campaign => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name} ({campaign.mentions_count || 0} mentions)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-4">
            {['campaigns', 'mentions', 'outreach', 'analytics'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 px-2 font-medium capitalize border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'campaigns' && (
          <CampaignsTab campaigns={campaigns} onRefresh={loadCampaigns} userId={userId} />
        )}
        {activeTab === 'mentions' && (
          <MentionsTab mentions={mentions} />
        )}
        {activeTab === 'outreach' && (
          <OutreachTab campaignId={selectedCampaign?.id} userId={userId} />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsTab analytics={analytics} />
        )}
      </div>
    </div>
  );
}

// Campaigns Tab Component
function CampaignsTab({ campaigns, onRefresh, userId }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    platforms: [],
    keywords: '',
    hashtags: '',
    interval_minutes: 15,
  });
    const [optimizeUrl, setOptimizeUrl] = useState('');
    const [optimizing, setOptimizing] = useState(false);

  const createCampaign = async (e) => {
    e.preventDefault();

    try {
      await axios.post('/api/social-listening/campaigns', {
        ...formData,
        keywords: formData.keywords.split(',').map(k => k.trim()),
        hashtags: formData.hashtags.split(',').map(h => h.trim()).filter(h => h),
        user_id: userId,
      });

      alert('Campaign created!');
      setShowForm(false);
      setFormData({
        name: '',
        description: '',
        platforms: [],
        keywords: '',
        hashtags: '',
        interval_minutes: 15,
      });
      onRefresh();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

    const handleOptimizeUrl = async () => {
          if (!optimizeUrl.trim()) {
                  alert('Please enter a URL');
                  return;
                }

          try {
                  setOptimizing(true);
                  const response = await axios.post('/api/social-listening/optimize-url', {
                            url: optimizeUrl
                                    });

                  // Auto-fill form with AI-extracted data
                  const { keywords, hashtags, description, platforms } = response.data;
                  setFormData(prev => ({
                            ...prev,
                            description: description || prev.description,
                            keywords: keywords.join(', '),
                            hashtags: hashtags.join(', '),
                            platforms: platforms || prev.platforms
                                    }));
                  alert('Campaign optimized with AI! Review and adjust as needed.');
                } catch (error) {
                  alert('Error: ' + error.message);
                } finally {
                  setOptimizing(false);
                }
        };

  const togglePlatform = (platform) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Campaigns</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          {showForm ? 'Cancel' : '+ New Campaign'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Create Campaign</h3>
          <form onSubmit={createCampaign} className="space-y-4">
                            {/* URL Optimization Section */}
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border-2 border-blue-200 mb-6">
                                                <h4 className="text-md font-semibold text-blue-900 mb-2">🚀 AI-Powered Campaign Optimizer</h4>
                                                <p className="text-sm text-gray-700 mb-3">Paste your website or affiliate link and let AI extract keywords, generate hashtags, and optimize your campaign</p>
                                                <div className="flex gap-2">
                                                                      <input
                                                                                              type="url"
                                                                                              value={optimizeUrl}
                                                                                              onChange={(e) => setOptimizeUrl(e.target.value)}
                                                                                              placeholder="https://example.com/your-product"
                                                                                              className="flex-1 px-3 py-2 border rounded-lg"
                                                                                            />
                                                                      <button
                                                                                              type="button"
                                                                                              onClick={handleOptimizeUrl}
                                                                                              disabled={optimizing || !optimizeUrl.trim()}
                                                                                              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 font-medium"
                                                                                            >
                                                                                              {optimizing ? '⚙️ Analyzing...' : '✨ Optimize with AI'}
                                                                                            </button>
                                                                    </div>
                                              </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., Video Editing Software Mentions"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Platforms</label>
              <div className="flex gap-4">
                {['twitter', 'reddit', 'linkedin'].map(platform => (
                  <label key={platform} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.platforms.includes(platform)}
                      onChange={() => togglePlatform(platform)}
                      className="rounded"
                    />
                    <span className="capitalize">{platform}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Keywords (comma-separated)
              </label>
              <input
                type="text"
                required
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="video editing, video software, edit videos"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hashtags (optional, comma-separated)
              </label>
              <input
                type="text"
                value={formData.hashtags}
                onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="videoediting, contentcreator"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Check Interval (minutes)
              </label>
              <input
                type="number"
                value={formData.interval_minutes}
                onChange={(e) => setFormData({ ...formData, interval_minutes: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
                min="5"
              />
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Campaign
            </button>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {campaigns.map(campaign => (
          <div key={campaign.id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium">{campaign.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{campaign.description}</p>
                <div className="flex gap-2 mt-2">
                  {campaign.platforms.map(platform => (
                    <span key={platform} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded capitalize">
                      {platform}
                    </span>
                  ))}
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Keywords: {campaign.keywords.join(', ')}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{campaign.mentions_count || 0}</div>
                <div className="text-sm text-gray-500">mentions</div>
                <div className={`mt-2 inline-block px-3 py-1 rounded-full text-xs ${
                  campaign.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {campaign.status}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Mentions Tab Component
function MentionsTab({ mentions }) {
  const getSentimentColor = (sentiment) => {
    const colors = {
      positive: 'bg-green-100 text-green-700',
      negative: 'bg-red-100 text-red-700',
      neutral: 'bg-gray-100 text-gray-700',
      mixed: 'bg-yellow-100 text-yellow-700',
    };
    return colors[sentiment] || colors.neutral;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Mentions Feed</h2>

      {mentions.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
          No mentions yet. Run a listening job to find mentions.
        </div>
      ) : (
        <div className="space-y-4">
          {mentions.map(mention => (
            <div key={mention.id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded capitalize">
                    {mention.platform}
                  </span>
                  <span className={`px-3 py-1 text-sm rounded capitalize ${getSentimentColor(mention.sentiment)}`}>
                    {mention.sentiment}
                  </span>
                  <span className="text-sm text-gray-600">
                    Opportunity: {mention.opportunity_score}/100
                  </span>
                </div>
                <a
                  href={mention.post_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  View Post →
                </a>
              </div>

              <div className="mb-3">
                <div className="font-medium text-gray-900">
                  @{mention.author_username}
                  {mention.author_follower_count > 0 && (
                    <span className="text-sm text-gray-500 ml-2">
                      ({mention.author_follower_count.toLocaleString()} followers)
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  {new Date(mention.post_created_at).toLocaleString()}
                </div>
              </div>

              <div className="text-gray-800 mb-3">
                {mention.content}
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>❤️ {mention.engagement?.likes || 0}</span>
                <span>💬 {mention.engagement?.comments || 0}</span>
                <span>🔁 {mention.engagement?.shares || 0}</span>
                {mention.is_replied && (
                  <span className="text-green-600">✓ Replied</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Outreach Tab Component
function OutreachTab({ campaignId, userId }) {
  const [pendingMessages, setPendingMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPendingMessages();
  }, [userId]);

  const loadPendingMessages = async () => {
    try {
      const response = await axios.get(`/api/social-outreach/queue?userId=${userId}`);
      setPendingMessages(response.data);
    } catch (error) {
      console.error('Error loading pending messages:', error);
    }
  };

  const handleApprove = async (messageId) => {
    try {
      setLoading(true);
      await axios.post('/api/social-outreach/send', {
        messageId,
        action: 'approve',
        userId
      });
      alert('Message approved!');
      loadPendingMessages();
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (messageId) => {
    try {
      await axios.post('/api/social-outreach/send', {
        messageId,
        action: 'reject',
        userId
      });
      alert('Message rejected');
      loadPendingMessages();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Pending Outreach Messages</h2>

      {pendingMessages.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
          No pending outreach messages
        </div>
      ) : (
        <div className="space-y-4">
          {pendingMessages.map(message => (
            <div key={message.id} className="bg-white p-6 rounded-lg shadow">
              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-2">
                  Campaign: {message.campaign_name} • Platform: {message.platform}
                </div>
                <div className="font-medium mb-2">Original Mention:</div>
                <div className="bg-gray-50 p-3 rounded text-sm mb-3">
                  @{message.author_username}: {message.mention_content}
                </div>
                <div className="font-medium mb-2">Proposed Response:</div>
                <div className="bg-blue-50 p-3 rounded">
                  {message.message_content}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(message.id)}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  ✓ Approve & Send
                </button>
                <button
                  onClick={() => handleReject(message.id)}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  ✗ Reject
                </button>
                <a
                  href={message.post_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  View Original Post
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Analytics Tab Component
function AnalyticsTab({ analytics }) {
  if (!analytics) {
    return <div className="text-gray-500">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Campaign Analytics</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-3xl font-bold text-blue-600">{analytics.mentions.total}</div>
          <div className="text-sm text-gray-600">Total Mentions</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-3xl font-bold text-green-600">{analytics.outreach.total_sent}</div>
          <div className="text-sm text-gray-600">Outreach Sent</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-3xl font-bold text-purple-600">{analytics.outreach.response_rate.toFixed(1)}%</div>
          <div className="text-sm text-gray-600">Response Rate</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-3xl font-bold text-orange-600">{analytics.mentions.avg_opportunity_score.toFixed(0)}</div>
          <div className="text-sm text-gray-600">Avg Opportunity Score</div>
        </div>
      </div>

      {/* Platform Breakdown */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="font-medium mb-4">Mentions by Platform</h3>
        <div className="space-y-2">
          {Object.entries(analytics.mentions.by_platform).map(([platform, count]) => (
            <div key={platform} className="flex items-center gap-4">
              <div className="w-24 capitalize">{platform}</div>
              <div className="flex-1 bg-gray-200 rounded-full h-6">
                <div
                  className="bg-blue-600 h-6 rounded-full flex items-center justify-end px-2 text-white text-sm"
                  style={{ width: `${(count / analytics.mentions.total) * 100}%` }}
                >
                  {count}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sentiment Breakdown */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="font-medium mb-4">Sentiment Analysis</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{analytics.mentions.by_sentiment.positive}</div>
            <div className="text-sm text-gray-600">Positive</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{analytics.mentions.by_sentiment.neutral}</div>
            <div className="text-sm text-gray-600">Neutral</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{analytics.mentions.by_sentiment.negative}</div>
            <div className="text-sm text-gray-600">Negative</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{analytics.mentions.by_sentiment.mixed}</div>
            <div className="text-sm text-gray-600">Mixed</div>
          </div>
        </div>
      </div>

      {/* Top Keywords */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="font-medium mb-4">Top Keywords</h3>
        <div className="flex flex-wrap gap-2">
          {analytics.top_keywords.map((item, index) => (
            <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              {item.keyword} ({item.count})
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
