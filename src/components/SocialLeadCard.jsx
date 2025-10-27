import { useState } from 'react';
import { ThumbsUp, ThumbsDown, TrendingUp, AlertCircle, ExternalLink, Copy, Check } from 'lucide-react';

export default function SocialLeadCard({ lead, onPost, onIgnore }) {
  const [copied, setCopied] = useState(false);
  const [posting, setPosting] = useState(false);

  const handleCopyResponse = () => {
    navigator.clipboard.writeText(lead.response_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePost = async () => {
    setPosting(true);
    await onPost(lead);
    setPosting(false);
  };

  // Determine lead badge color
  const getLeadBadgeColor = (quality) => {
    switch (quality) {
      case 'hot': return 'bg-red-100 text-red-700 border-red-300';
      case 'warm': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'cold': return 'bg-blue-100 text-blue-700 border-blue-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-red-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-blue-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-4 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getLeadBadgeColor(lead.lead_quality)}`}>
              {lead.lead_quality?.toUpperCase()} LEAD
            </span>
            <span className={`text-2xl font-bold ${getScoreColor(lead.lead_score)}`}>
              {lead.lead_score}/100
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">{lead.author_name || 'Unknown'}</span>
            {lead.author_title && (
              <>
                <span>•</span>
                <span>{lead.author_title}</span>
              </>
            )}
            {lead.author_company && (
              <>
                <span>•</span>
                <span>{lead.author_company}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
            <span className="capitalize">{lead.platform}</span>
            <span>•</span>
            <span>{new Date(lead.analyzed_at).toLocaleString()}</span>
            {lead.post_url && (
              <>
                <span>•</span>
                <a
                  href={lead.post_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:underline"
                >
                  View Post <ExternalLink className="w-3 h-3" />
                </a>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Original Post */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">💬 Original Post:</h4>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-gray-800 text-sm leading-relaxed">{lead.text}</p>
        </div>
      </div>

      {/* AI Analysis */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">🎯 AI Analysis:</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
            <div className="text-xs text-purple-600 font-medium mb-1">Sentiment</div>
            <div className="text-sm font-semibold capitalize">{lead.sentiment}</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
            <div className="text-xs text-orange-600 font-medium mb-1">Urgency</div>
            <div className="text-sm font-semibold capitalize">{lead.urgency}</div>
          </div>
        </div>

        {lead.buying_signals && lead.buying_signals.length > 0 && (
          <div className="mt-3">
            <div className="text-xs font-medium text-green-600 mb-1">✅ Buying Signals:</div>
            <div className="flex flex-wrap gap-2">
              {lead.buying_signals.map((signal, idx) => (
                <span key={idx} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded border border-green-200">
                  {signal}
                </span>
              ))}
            </div>
          </div>
        )}

        {lead.pain_points && lead.pain_points.length > 0 && (
          <div className="mt-3">
            <div className="text-xs font-medium text-red-600 mb-1">⚠️ Pain Points:</div>
            <div className="flex flex-wrap gap-2">
              {lead.pain_points.map((point, idx) => (
                <span key={idx} className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded border border-red-200">
                  {point}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Generated Response */}
      {lead.response_text && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-700">🤖 AI-Generated Response:</h4>
            <button
              onClick={handleCopyResponse}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" /> Copy
                </>
              )}
            </button>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-gray-800 text-sm leading-relaxed">{lead.response_text}</p>
          </div>
          {lead.ready_to_post && (
            <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
              <Check className="w-3 h-3" />
              Ready to post ({lead.response_length} characters)
            </div>
          )}
        </div>
      )}

      {/* Engagement Approach */}
      {lead.engagement_approach && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">💡 Engagement Strategy:</h4>
          <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
            <p className="text-sm text-gray-700">{lead.engagement_approach}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={handlePost}
          disabled={posting}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {posting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Posting...
            </>
          ) : (
            <>
              <ThumbsUp className="w-4 h-4" />
              Post Response
            </>
          )}
        </button>

        <button
          onClick={() => onIgnore(lead)}
          disabled={posting}
          className="px-4 py-2 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <ThumbsDown className="w-4 h-4" />
          Ignore
        </button>
      </div>

      {/* Next Steps */}
      {lead.next_steps && lead.next_steps.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-xs font-semibold text-gray-600 mb-2">📋 Suggested Next Steps:</h4>
          <div className="space-y-2">
            {lead.next_steps.slice(0, 3).map((step, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                <span className="font-semibold text-blue-600">{idx + 1}.</span>
                <div>
                  <span className="font-medium">{step.step}:</span> {step.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
