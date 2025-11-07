import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { IconCopy, IconCheck, IconAlertCircle, IconBrandGithubCopilot, IconLoader2, IconStars } from '@tabler/icons';
import { hideJsonAnonymizer } from 'providers/ReduxStore/slices/app';
import { checkCopilotAuthStatus, sendChatCompletion, getCopilotModels } from 'utils/ipc/copilot';
import { copilotActions } from 'providers/ReduxStore/slices/copilot';
import Console from 'components/Devtools/Console';
import toast from 'react-hot-toast';
import StyledWrapper from './StyledWrapper';

const DEFAULT_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
  { id: 'gpt-4', name: 'GPT-4' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
  { id: 'o1-preview', name: 'O1 Preview' },
  { id: 'o1-mini', name: 'O1 Mini' }
];

const JsonAnonymizer = () => {
  const dispatch = useDispatch();
  const { authenticated, hasCopilotAccess } = useSelector((state) => state.copilot);
  const [inputJson, setInputJson] = useState('');
  const [outputJson, setOutputJson] = useState('');
  const [copied, setCopied] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [availableModels, setAvailableModels] = useState(DEFAULT_MODELS);

  // Check authentication status and fetch models on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const result = await checkCopilotAuthStatus();
        if (result.authenticated) {
          dispatch(copilotActions.setAuthStatus({
            authenticated: result.authenticated,
            hasCopilotAccess: result.hasCopilotAccess,
            metadata: result.metadata
          }));
        }
      } catch (err) {
        console.error('Failed to check auth status:', err);
      }
    };

    const fetchModels = async () => {
      try {
        const result = await getCopilotModels();
        if (result.success && result.models) {
          setAvailableModels(result.models);
        }
      } catch (err) {
        console.error('Failed to fetch models:', err);
      }
    };

    checkAuth();
    fetchModels();
  }, [dispatch]);

  const handleClose = () => {
    dispatch(hideJsonAnonymizer());
  };

  const handleCopyToClipboard = async () => {
    if (!outputJson) return;

    try {
      await navigator.clipboard.writeText(outputJson);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const formatJson = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonString;
    }
  };

  const handleAnonymize = async () => {
    if (!inputJson.trim()) {
      setError('Please enter JSON to anonymize');
      return;
    }

    // Validate JSON
    try {
      JSON.parse(inputJson);
    } catch (e) {
      setError('Invalid JSON format');
      return;
    }

    if (!authenticated || !hasCopilotAccess) {
      // Open console to show Copilot authentication tab
      setIsConsoleOpen(true);
      toast.error('Please authenticate with GitHub Copilot first');
      return;
    }

    setProcessing(true);
    setError(null);
    setOutputJson('');

    try {
      const messages = [
        {
          role: 'system',
          content: 'You are a JSON anonymization assistant. Your task is to anonymize sensitive data in JSON objects while preserving the structure. Replace personal information (names, emails, phone numbers, addresses, IDs, etc.) with realistic fake data. Keep the same data types and formats. Return ONLY the anonymized JSON, no explanations.'
        },
        {
          role: 'user',
          content: `Anonymize this JSON:\n\n${inputJson}`
        }
      ];

      const result = await sendChatCompletion({
        messages,
        model: selectedModel,
        temperature: 0.7,
        maxTokens: 4000
      });

      if (result.success && result.response?.choices?.[0]?.message?.content) {
        let content = result.response.choices[0].message.content;

        // Remove markdown code blocks if present
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        // Format and validate the output
        const formatted = formatJson(content);
        setOutputJson(formatted);
        toast.success('JSON anonymized successfully');
      } else {
        throw new Error(result.error || 'Failed to anonymize JSON');
      }
    } catch (err) {
      console.error('Anonymization error:', err);
      setError(err.message || 'Failed to anonymize JSON');
      toast.error('Failed to anonymize JSON');
    } finally {
      setProcessing(false);
    }
  };

  const handleAuthClick = () => {
    setIsConsoleOpen(true);
  };

  const isAnonymizeDisabled = !authenticated || !hasCopilotAccess || processing || !inputJson.trim();

  return (
    <StyledWrapper>
      <div className="json-anonymizer-container">
        <div className="json-anonymizer-header">
          <div className="header-left">
            <IconStars size={24} strokeWidth={1.5} className="title-icon" />
            <h1 className="title">JSON Anonymizer</h1>
            <span className="subtitle">Powered by GitHub Copilot</span>
          </div>
          <div className="header-right">
            <div className="model-selector">
              <label htmlFor="model-select">Model:</label>
              <select
                id="model-select"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={processing}
                className="model-select"
              >
                {availableModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>
            <button className="close-button" onClick={handleClose} title="Close">
              ×
            </button>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <IconAlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="json-anonymizer-content">
          <div className="json-panel input-panel">
            <div className="panel-header">
              <h2>Input JSON</h2>
              <span className="panel-hint">Paste your JSON here</span>
            </div>
            <textarea
              className="json-textarea"
              value={inputJson}
              onChange={(e) => {
                setInputJson(e.target.value);
                setError(null);
              }}
              placeholder={`{
  "_id": "690dd4e1928829cc3757fb7e",
  "index": 0,
  "guid": "ae047ce1-c560-4dea-9da6-396d25cc5801",
  "isActive": true,
  "balance": "$1,861.71",
  "picture": "http://placehold.it/32x32",
  "age": 32,
  "eyeColor": "blue",
  "name": "Carrillo Horn",
  "gender": "male",
  "company": "ASSURITY",
  "email": "carrillohorn@assurity.com",
  "phone": "+1 (873) 511-2241",
  "address": "758 Madoc Avenue, Idledale, Ohio, 6502",
  "about": "Tempor duis sint esse eu ipsum irure reprehenderit.",
  "registered": "2025-01-31T12:51:19 -00:00",
  "latitude": 1.739611,
  "longitude": -127.859992,
  "tags": ["in", "qui", "quis", "ullamco"],
  "friends": [
    { "id": 0, "name": "Zimmerman Patel" },
    { "id": 1, "name": "Cecile Rivers" }
  ],
  "greeting": "Hello, Carrillo Horn! You have 2 unread messages.",
  "favoriteFruit": "banana"
}`}
              spellCheck={false}
            />
          </div>

          <div className="divider">
            <button
              className="anonymize-button"
              onClick={handleAnonymize}
              disabled={isAnonymizeDisabled}
              title={!authenticated || !hasCopilotAccess ? 'Please authenticate with GitHub Copilot' : 'Anonymize JSON'}
            >
              {processing ? (
                <>
                  <IconLoader2 size={16} className="animate-spin" />
                  <span>Anonymizing...</span>
                </>
              ) : (
                <>
                  <IconBrandGithubCopilot size={16} />
                  <span>Anonymize</span>
                </>
              )}
            </button>

            {(!authenticated || !hasCopilotAccess) && (
              <button
                className="auth-hint-button"
                onClick={handleAuthClick}
                title="Authenticate with GitHub Copilot"
              >
                <IconBrandGithubCopilot size={14} />
                <span>Authenticate Copilot</span>
              </button>
            )}
          </div>

          <div className="json-panel output-panel">
            <div className="panel-header">
              <h2>Anonymized Output</h2>
              <button
                className="copy-button"
                onClick={handleCopyToClipboard}
                disabled={!outputJson}
                title="Copy to clipboard"
              >
                {copied ? (
                  <>
                    <IconCheck size={16} />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <IconCopy size={16} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              className="json-textarea"
              value={outputJson}
              readOnly
              placeholder="Anonymized JSON will appear here..."
              spellCheck={false}
            />
          </div>
        </div>
      </div>

      {isConsoleOpen && (
        <div className="console-drawer">
          <Console
            initialTab="copilot"
            onClose={() => setIsConsoleOpen(false)}
          />
        </div>
      )}
    </StyledWrapper>
  );
};

export default JsonAnonymizer;
