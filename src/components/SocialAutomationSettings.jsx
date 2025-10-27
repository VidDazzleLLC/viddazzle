import { useState, useEffect } from 'react';
import { Settings, Power, AlertTriangle, Check, Save } from 'lucide-react';

export default function SocialAutomationSettings({ onSave }) {
  const [settings, setSettings] = useState({
    // Automation Mode
    mode: 'manual', // manual, semi-auto, full-auto

    // Volume Limits
    max_posts_per_day: 15,
    max_posts_per_platform: 10,
    min_delay_minutes: 5,
    max_delay_minutes: 15,

    // Lead Filters
    auto_post_threshold: 80, // Auto-post if score >= 80
    enabled_platforms: {
      linkedin: true,
      twitter: false,
      facebook: false,
      reddit: false,
    },

    // Company Info
    company_name: '',
    company_solution: '',

    // Albato Integration
    albato_webhook_url: '',

    // Safety Features
    enable_health_monitoring: true,
    pause_if_low_engagement: true,
    require_approval_warm_leads: true,
  });

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/social-listening/config');
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/social-listening/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        if (onSave) onSave(settings);
        alert('✅ Settings saved successfully!');
      } else {
        alert('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    }
  };

  const updateSetting = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  const updatePlatform = (platform, enabled) => {
    setSettings({
      ...settings,
      enabled_platforms: {
        ...settings.enabled_platforms,
        [platform]: enabled,
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Automation Settings</h2>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          {saved ? (
            <>
              <Check className="w-5 h-5" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Settings
            </>
          )}
        </button>
      </div>

      {/* Automation Mode */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Power className="w-5 h-5 text-blue-600" />
          Automation Mode
        </h3>

        <div className="space-y-3">
          <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="mode"
              value="manual"
              checked={settings.mode === 'manual'}
              onChange={(e) => updateSetting('mode', e.target.value)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">Manual Mode</div>
              <div className="text-sm text-gray-600">
                You approve and post every response manually. Full control, zero automation.
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="mode"
              value="semi-auto"
              checked={settings.mode === 'semi-auto'}
              onChange={(e) => updateSetting('mode', e.target.value)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">Semi-Auto Mode (Recommended) ⚡</div>
              <div className="text-sm text-gray-600">
                Auto-posts hot leads (score ≥ 80). You approve warm leads. Best balance of automation and control.
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="mode"
              value="full-auto"
              checked={settings.mode === 'full-auto'}
              onChange={(e) => updateSetting('mode', e.target.value)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">Full-Auto Mode 🤖</div>
              <div className="text-sm text-gray-600">
                Completely hands-off. Auto-posts all qualified leads. Just monitor the dashboard.
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Volume Limits */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Volume Limits & Safety</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Posts Per Day (All Platforms)
            </label>
            <input
              type="number"
              value={settings.max_posts_per_day}
              onChange={(e) => updateSetting('max_posts_per_day', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="1"
              max="50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Recommended: 10-15 for safety. Max: 50.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Posts Per Platform
            </label>
            <input
              type="number"
              value={settings.max_posts_per_platform}
              onChange={(e) => updateSetting('max_posts_per_platform', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="1"
              max="30"
            />
            <p className="text-xs text-gray-500 mt-1">
              Prevents over-posting on single platform.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Min Delay Between Posts (minutes)
            </label>
            <input
              type="number"
              value={settings.min_delay_minutes}
              onChange={(e) => updateSetting('min_delay_minutes', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="1"
              max="60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Delay Between Posts (minutes)
            </label>
            <input
              type="number"
              value={settings.max_delay_minutes}
              onChange={(e) => updateSetting('max_delay_minutes', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="1"
              max="120"
            />
            <p className="text-xs text-gray-500 mt-1">
              Random delays between min-max look more human.
            </p>
          </div>
        </div>
      </div>

      {/* Lead Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Lead Filters</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Auto-Post Threshold (Lead Score)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                value={settings.auto_post_threshold}
                onChange={(e) => updateSetting('auto_post_threshold', parseInt(e.target.value))}
                className="flex-1"
                min="60"
                max="100"
                step="5"
              />
              <span className="text-2xl font-bold text-blue-600 w-16 text-right">
                {settings.auto_post_threshold}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Only auto-post if lead score ≥ {settings.auto_post_threshold}.
              {settings.auto_post_threshold >= 80 && ' (Hot leads only)'}
              {settings.auto_post_threshold >= 70 && settings.auto_post_threshold < 80 && ' (Hot + some warm leads)'}
              {settings.auto_post_threshold < 70 && ' (Warning: Includes cold leads)'}
            </p>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.require_approval_warm_leads}
              onChange={(e) => updateSetting('require_approval_warm_leads', e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700">
              Require manual approval for warm leads (60-79 score)
            </span>
          </label>
        </div>
      </div>

      {/* Enabled Platforms */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Enabled Platforms</h3>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.enabled_platforms.linkedin}
                onChange={(e) => updatePlatform('linkedin', e.target.checked)}
                className="w-5 h-5"
              />
              <div>
                <div className="font-medium">LinkedIn</div>
                <div className="text-sm text-gray-600">Professional B2B networking</div>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              settings.enabled_platforms.linkedin ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {settings.enabled_platforms.linkedin ? 'Active' : 'Disabled'}
            </span>
          </label>

          <label className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.enabled_platforms.twitter}
                onChange={(e) => updatePlatform('twitter', e.target.checked)}
                className="w-5 h-5"
              />
              <div>
                <div className="font-medium">Twitter / X</div>
                <div className="text-sm text-gray-600">Real-time conversations</div>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              settings.enabled_platforms.twitter ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {settings.enabled_platforms.twitter ? 'Active' : 'Disabled'}
            </span>
          </label>

          <label className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.enabled_platforms.reddit}
                onChange={(e) => updatePlatform('reddit', e.target.checked)}
                className="w-5 h-5"
              />
              <div>
                <div className="font-medium">Reddit</div>
                <div className="text-sm text-gray-600">Community discussions</div>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              settings.enabled_platforms.reddit ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {settings.enabled_platforms.reddit ? 'Active' : 'Disabled'}
            </span>
          </label>
        </div>
      </div>

      {/* Company Info */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Company Information</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name
            </label>
            <input
              type="text"
              value={settings.company_name}
              onChange={(e) => updateSetting('company_name', e.target.value)}
              placeholder="Your Company Name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What You Offer (Solution)
            </label>
            <textarea
              value={settings.company_solution}
              onChange={(e) => updateSetting('company_solution', e.target.value)}
              placeholder="E.g., Automated CRM workflows and reporting"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
              rows="2"
            />
            <p className="text-xs text-gray-500 mt-1">
              Used by AI to generate personalized responses
            </p>
          </div>
        </div>
      </div>

      {/* Albato Integration */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">CRM Integration (Albato)</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Albato Webhook URL (Optional)
          </label>
          <input
            type="url"
            value={settings.albato_webhook_url}
            onChange={(e) => updateSetting('albato_webhook_url', e.target.value)}
            placeholder="https://webhooks.albato.com/p/XXX/add-to-aitable"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            If provided, qualified leads automatically flow to Aitable CRM
          </p>
        </div>
      </div>

      {/* Safety Features */}
      <div className="bg-yellow-50 rounded-lg shadow-sm p-6 border border-yellow-200">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-yellow-900 mb-4">Safety Features</h3>

            <div className="space-y-3">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={settings.enable_health_monitoring}
                  onChange={(e) => updateSetting('enable_health_monitoring', e.target.checked)}
                  className="mt-1 w-4 h-4"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Enable Health Monitoring</div>
                  <div className="text-xs text-gray-600">
                    Track engagement rates and alert if unusual patterns detected
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={settings.pause_if_low_engagement}
                  onChange={(e) => updateSetting('pause_if_low_engagement', e.target.checked)}
                  className="mt-1 w-4 h-4"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Auto-Pause if Low Engagement</div>
                  <div className="text-xs text-gray-600">
                    Automatically pause if response rate drops significantly
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button (Bottom) */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Save className="w-5 h-5" />
          Save All Settings
        </button>
      </div>
    </div>
  );
}
