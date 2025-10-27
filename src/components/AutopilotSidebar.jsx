import { useState, useRef, useEffect } from 'react';

export default function AutopilotSidebar({ onToggle }) {
  const [isOpen, setIsOpen] = useState(true);
  const [width, setWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [command, setCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [uploadProgress, setUploadProgress] = useState({});

  const sidebarRef = useRef(null);
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptPiece = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcriptPiece + ' ';
            } else {
              interimTranscript += transcriptPiece;
            }
          }

          setTranscript(finalTranscript || interimTranscript);
          if (finalTranscript) {
            setCommand(prev => prev + ' ' + finalTranscript);
          }
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
          setTranscript('');
        };
      }
    }
  }, []);

  // Load command history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('autopilot_command_history');
      if (saved) {
        setCommandHistory(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Failed to load command history:', err);
    }
  }, []);

  // Save command history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('autopilot_command_history', JSON.stringify(commandHistory));
    } catch (err) {
      console.error('Failed to save command history:', err);
    }
  }, [commandHistory]);

  // Handle sidebar resize
  const handleMouseDown = (e) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;

      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 300 && newWidth <= 800) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Handle command submission
  const handleSubmitCommand = async () => {
    if (!command.trim()) return;

    setIsExecuting(true);

    try {
      const response = await fetch('/api/autopilot/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: command.trim(),
          files: uploadedFiles.map(f => f.path),
        }),
      });

      const data = await response.json();

      // Add to history (keep last 10)
      const historyItem = {
        id: Date.now(),
        command: command.trim(),
        timestamp: new Date().toISOString(),
        success: data.success,
        result: data.result || data.error,
        workflowId: data.workflowId,
      };

      setCommandHistory(prev => [historyItem, ...prev.slice(0, 9)]);
      setCommand('');
      setUploadedFiles([]);

    } catch (error) {
      console.error('Command execution error:', error);

      const historyItem = {
        id: Date.now(),
        command: command.trim(),
        timestamp: new Date().toISOString(),
        success: false,
        result: 'Error: ' + error.message,
      };

      setCommandHistory(prev => [historyItem, ...prev.slice(0, 9)]);
    } finally {
      setIsExecuting(false);
    }
  };

  // Handle voice input
  const toggleVoiceInput = async () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      try {
        // Request microphone permission
        await navigator.mediaDevices.getUserMedia({ audio: true });
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        alert('Microphone access denied. Please allow microphone access to use voice input.');
        console.error('Microphone permission error:', err);
      }
    }
  };

  // Handle file upload
  const handleFileSelect = async (files) => {
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      const formData = new FormData();
      formData.append('file', file);

      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

      try {
        const response = await fetch('/api/autopilot/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (data.success) {
          setUploadedFiles(prev => [...prev, {
            name: file.name,
            type: file.type,
            size: file.size,
            path: data.path,
            extractedContent: data.extractedContent,
          }]);
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        }
      } catch (error) {
        console.error('File upload error:', error);
        alert(`Failed to upload ${file.name}: ${error.message}`);
      }
    }
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  // Toggle sidebar
  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (onToggle) onToggle(!isOpen);
  };

  if (!isOpen) {
    return (
      <div className="fixed right-0 top-20 z-50">
        <button
          onClick={handleToggle}
          className="bg-blue-600 text-white px-3 py-2 rounded-l-lg shadow-lg hover:bg-blue-700"
        >
          Open Autopilot
        </button>
      </div>
    );
  }

  return (
    <div
      ref={sidebarRef}
      className="fixed right-0 top-0 h-screen bg-gray-900 text-white shadow-2xl flex z-40"
      style={{ width: `${width}px` }}
    >
      {/* Resize handle */}
      <div
        className="w-1 bg-gray-700 hover:bg-blue-500 cursor-col-resize"
        onMouseDown={handleMouseDown}
      />

      {/* Sidebar content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 p-4 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <h2 className="text-lg font-semibold">Autopilot Command Center</h2>
          </div>
          <button
            onClick={handleToggle}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Command input area */}
        <div className="p-4 border-b border-gray-700">
          <div className="mb-3">
            <label className="text-sm text-gray-400 mb-1 block">Direct Command to Autopilot</label>
            <textarea
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  handleSubmitCommand();
                }
              }}
              placeholder="Type your command here... (Ctrl+Enter to send)"
              className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
            />
            {transcript && (
              <div className="mt-1 text-xs text-blue-400">
                Transcribing: {transcript}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleSubmitCommand}
              disabled={isExecuting || !command.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {isExecuting ? 'Executing...' : 'Send Command'}
            </button>

            <button
              onClick={toggleVoiceInput}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
              title="Voice input"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
              title="Upload file"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
        </div>

        {/* File upload area with drag-and-drop */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`p-4 border-b border-gray-700 transition-colors ${
            isDragging ? 'bg-blue-900 bg-opacity-20' : ''
          }`}
        >
          <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
            isDragging ? 'border-blue-500 bg-blue-900 bg-opacity-10' : 'border-gray-600'
          }`}>
            <svg className="w-8 h-8 mx-auto mb-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-gray-400">
              Drag & drop files here or click Upload
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PDF, images, text, audio, video, ZIP - any file type
            </p>
          </div>

          {/* Uploaded files */}
          {uploadedFiles.length > 0 && (
            <div className="mt-3 space-y-2">
              {uploadedFiles.map((file, idx) => (
                <div key={idx} className="bg-gray-800 rounded p-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm truncate">{file.name}</span>
                    <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button
                    onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))}
                    className="text-gray-400 hover:text-red-500 ml-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload progress */}
          {Object.entries(uploadProgress).filter(([_, progress]) => progress < 100).length > 0 && (
            <div className="mt-3 space-y-2">
              {Object.entries(uploadProgress)
                .filter(([_, progress]) => progress < 100)
                .map(([filename, progress]) => (
                  <div key={filename} className="bg-gray-800 rounded p-2">
                    <div className="text-xs text-gray-400 mb-1">{filename}</div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Command history */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Recent Commands (Last 10)</h3>

          {commandHistory.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <p className="text-sm">No commands yet</p>
              <p className="text-xs mt-1">Your command history will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {commandHistory.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-800 rounded-lg p-3 border border-gray-700"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {item.success ? (
                        <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className="text-xs text-gray-400">
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="text-sm font-mono bg-gray-900 p-2 rounded mb-2">
                    {item.command}
                  </div>

                  {item.result && (
                    <div className="text-xs text-gray-400 bg-gray-900 p-2 rounded">
                      {typeof item.result === 'string'
                        ? item.result
                        : JSON.stringify(item.result, null, 2)}
                    </div>
                  )}

                  {item.workflowId && (
                    <div className="text-xs text-blue-400 mt-2">
                      Workflow ID: {item.workflowId}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
