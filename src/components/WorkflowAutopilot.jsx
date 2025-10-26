import { useState, useEffect } from 'react';
import { Play, Plus, Sparkles, Loader2, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function WorkflowAutopilot() {
  const [prompt, setPrompt] = useState('');
  const [workflows, setWorkflows] = useState([]);
  const [currentWorkflow, setCurrentWorkflow] = useState(null);
  const [execution, setExecution] = useState(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState('generate');

  // Load workflows on mount
  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      const response = await fetch('/api/workflows');
      if (response.ok) {
        const data = await response.json();
        setWorkflows(data.workflows || []);
      }
    } catch (error) {
      console.error('Error loading workflows:', error);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/generate-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, save: true }),
      });

      const data = await response.json();

      if (data.success) {
        // Use data.saved (which has the database ID) instead of data.workflow
        setCurrentWorkflow(data.saved);
        setWorkflows([data.saved, ...workflows]);
        setActiveTab('workflow');
        setPrompt('');
      } else {
        alert('Failed to generate workflow: ' + data.error);
      }
    } catch (error) {
      console.error('Error generating workflow:', error);
      alert('Failed to generate workflow');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async (workflowId) => {
    setExecuting(true);
    setExecution(null);

    try {
      // If workflowId is not provided, pass the current workflow object
      const payload = workflowId
        ? { workflowId }
        : { workflow: currentWorkflow };

      const response = await fetch('/api/execute-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        setExecution(data);
        setActiveTab('execution');
      } else {
        alert('Execution failed: ' + data.error);
      }
    } catch (error) {
      console.error('Error executing workflow:', error);
      alert('Failed to execute workflow');
    } finally {
      setExecuting(false);
    }
  };

  const handleQuickAction = (action) => {
    const prompts = {
      'send-email': 'Send an email to team@example.com with the subject "Daily Report" and a summary of today\'s activities',
      'data-pipeline': 'Create a data pipeline that fetches data from an API, transforms it, and stores it in the database',
      'notification': 'Set up a notification system that sends Slack messages when new records are added to the database',
    };
    setPrompt(prompts[action] || '');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Zap className="w-10 h-10 text-blue-600" />
            Workflow Autopilot
          </h1>
          <p className="text-gray-600">AI-powered workflow automation with Claude and MCP</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          {['generate', 'workflow', 'execution', 'library'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Generate Tab */}
        {activeTab === 'generate' && (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <QuickActionCard
                  title="Send Email"
                  description="Automated email workflows"
                  onClick={() => handleQuickAction('send-email')}
                />
                <QuickActionCard
                  title="Data Pipeline"
                  description="ETL and data processing"
                  onClick={() => handleQuickAction('data-pipeline')}
                />
                <QuickActionCard
                  title="Notifications"
                  description="Multi-channel alerts"
                  onClick={() => handleQuickAction('notification')}
                />
              </div>
            </div>

            {/* Generate Workflow */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                Generate Workflow with AI
              </h2>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want to automate... (e.g., 'Send a daily email report with database statistics')"
                className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Workflow
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Workflow Tab */}
        {activeTab === 'workflow' && currentWorkflow && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{currentWorkflow.name}</h2>
                  <p className="text-gray-600 mt-2">{currentWorkflow.description}</p>
                </div>
                <button
                  onClick={() => handleExecute(currentWorkflow.id)}
                  disabled={executing}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 flex items-center gap-2 transition-colors"
                >
                  {executing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Execute
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Workflow Steps</h3>
                {currentWorkflow.steps?.map((step, index) => (
                  <WorkflowStep key={step.id} step={step} index={index} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Execution Tab */}
        {activeTab === 'execution' && execution && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Execution Results</h2>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  execution.success
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {execution.success ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Success
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5" />
                      Failed
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Duration: {execution.duration}ms
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Execution Log</h3>
                  <div className="space-y-2">
                    {execution.log?.map((entry, index) => (
                      <ExecutionLogEntry key={index} entry={entry} />
                    ))}
                  </div>
                </div>

                {execution.outputs && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Outputs</h3>
                    <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
                      {JSON.stringify(execution.outputs, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Library Tab */}
        {activeTab === 'library' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Workflow Library</h2>
              {workflows.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No workflows yet. Create your first workflow to get started!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {workflows.map((workflow) => (
                    <WorkflowCard
                      key={workflow.id}
                      workflow={workflow}
                      onView={() => {
                        setCurrentWorkflow(workflow);
                        setActiveTab('workflow');
                      }}
                      onExecute={() => handleExecute(workflow.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function QuickActionCard({ title, description, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
    >
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </button>
  );
}

function WorkflowStep({ step, index }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
          {index + 1}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{step.name}</h4>
          <p className="text-sm text-gray-600 mt-1">Tool: <code className="bg-gray-100 px-2 py-0.5 rounded">{step.tool}</code></p>
          {step.input && Object.keys(step.input).length > 0 && (
            <details className="mt-2">
              <summary className="text-sm text-blue-600 cursor-pointer hover:underline">View Input</summary>
              <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto">
                {JSON.stringify(step.input, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

function ExecutionLogEntry({ entry }) {
  const statusColors = {
    running: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  };

  return (
    <div className="border border-gray-200 rounded-lg p-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{entry.step_name}</span>
            <span className={`text-xs px-2 py-0.5 rounded ${statusColors[entry.status]}`}>
              {entry.status}
            </span>
          </div>
          {entry.error && (
            <p className="text-sm text-red-600 mt-1">Error: {entry.error}</p>
          )}
          {entry.duration && (
            <p className="text-xs text-gray-500 mt-1">Duration: {entry.duration}ms</p>
          )}
        </div>
      </div>
    </div>
  );
}

function WorkflowCard({ workflow, onView, onExecute }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{workflow.name}</h3>
          <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            <span>{workflow.steps?.length || 0} steps</span>
            <span>Status: {workflow.status}</span>
            {workflow.execution_count > 0 && (
              <span>{workflow.execution_count} executions</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onView}
            className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            View
          </button>
          <button
            onClick={onExecute}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
          >
            <Play className="w-4 h-4" />
            Run
          </button>
        </div>
      </div>
    </div>
  );
}
