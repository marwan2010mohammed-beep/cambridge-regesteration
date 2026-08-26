import React, { useState, useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import {
  Bot,
  User,
  Send,
  Trash2,
  Copy,
  Check,
  Sparkles,
  AlertTriangle,
  HelpCircle,
  Clock,
  BookOpen,
  Calendar,
  Layers,
  X,
  Maximize2,
  Minimize2,
  ShieldAlert,
  ArrowRight,
  Flame,
  Paperclip,
  Image as ImageIcon,
  FileText,
  UploadCloud,
  Eye,
  ZoomIn,
} from 'lucide-react';
import { ChatMessage, CandidateChatContext, ChatAttachment } from '../types';
import ChatReasoningDemo from './ui/demo';

interface CambridgeNightmareSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateContext?: CandidateChatContext;
}

const STORAGE_KEY = 'cambridge_nightmare_chat_history_v1';

const INITIAL_GREETING: ChatMessage = {
  id: 'init-msg-001',
  role: 'model',
  text: `### 🏛️ Cambridge Nightmare Support & Study Desk — Active

Greetings candidate. Welcome to **Cambridge Nightmare Support**, your specialized crisis counseling, study partner & exam strategy advisor for the Cambridge IGCSE / O Level / AS & A Level **October / November 2026 series**.

**Study & Solver Tool Features**:
* 📸 **Attach Question Photos & Diagrams**: Upload past paper screenshots, graph plots, circuit diagrams, chemical apparatus, or formula sheets to solve together.
* 📄 **Upload Past Paper PDFs & Notes**: Review specific questions and get full step-by-step mark scheme breakdowns.
* ✍️ **Handwriting & Working Review**: Check your intermediate steps for Method (**M**) and Accuracy (**A**) marks.
* 🗓️ **Timetable & Clash Analysis**: Triage revision schedules and understand Full Centre Supervision rules.

*Attach a question below, pick a topic, or type your immediate exam nightmare:*`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

const SUGGESTION_CHIPS = [
  {
    icon: BookOpen,
    label: 'What is the syllabus for 0580?',
    prompt: 'What is the syllabus coverage, component options, and exam format for Cambridge IGCSE Mathematics 0580?',
    badge: 'Syllabus',
  },
  {
    icon: Calendar,
    label: 'How do I handle exam clashes?',
    prompt: 'How do I handle exam clashes if I have two Cambridge papers scheduled in the same morning or afternoon session?',
    badge: 'Timetable',
  },
  {
    icon: FileText,
    label: 'How do I get my Statement of Entry?',
    prompt: 'How do I retrieve my official Cambridge Statement of Entry (SOE), center number, and 4-digit candidate number?',
    badge: 'Official Document',
  },
  {
    icon: Layers,
    label: 'What are the grade thresholds?',
    prompt: 'How do Cambridge grade thresholds and component weightings work? How are raw marks converted to A* grades?',
    badge: 'Grading',
  },
  {
    icon: BookOpen,
    label: '0580 Math P4 Traps & Tips',
    prompt: 'What are the most common trap questions and lost marks in Cambridge IGCSE Mathematics 0580 Paper 4 (Extended)?',
    badge: 'Tips',
  },
  {
    icon: Sparkles,
    label: '0620 Chemistry P6 Alt to Practical',
    prompt: 'Give me a comprehensive checklist for Cambridge IGCSE Chemistry 0620 Paper 6 (Alternative to Practical): flame tests, gas tests, and experimental accuracy.',
    badge: 'Chemistry',
  },
  {
    icon: Flame,
    label: '2-Week Emergency Triage Plan',
    prompt: 'I am 2 weeks away from my Cambridge IGCSE exams and haven\'t finished the syllabus. Give me an emergency triage plan to maximize my marks.',
    badge: 'Triage',
  },
  {
    icon: ShieldAlert,
    label: 'Exam Hall Panic & Time Strategy',
    prompt: 'What is the optimal time-per-mark strategy in a 2-hour Cambridge paper, and what should I do if I blank out on question 1?',
    badge: 'Strategy',
  },
];

const ATTACHMENT_SUGGESTION_CHIPS = [
  'Solve this past paper question with mark scheme breakdown',
  'Check my working and identify any lost marks or errors',
  'Explain the theory and formula behind this problem',
  'What are the common examiner traps for this question?',
];

const LOADING_STATUS_STEPS = [
  'Analyzing question & syllabus context...',
  'Cross-referencing Cambridge mark schemes & guidelines...',
  'Checking examiner traps & method (M) marks...',
  'Formulating step-by-step guidance & exam tips...',
];


function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const CambridgeNightmareSupportModal: React.FC<CambridgeNightmareSupportModalProps> = ({
  isOpen,
  onClose,
  candidateContext,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load chat history from localStorage', e);
    }
    return [INITIAL_GREETING];
  });

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Attachment states
  const [stagedAttachments, setStagedAttachments] = useState<ChatAttachment[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);

  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const clearConfirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Cycle loading status text to provide rich feedback
  useEffect(() => {
    if (!isLoading) {
      setLoadingStepIndex(0);
      return;
    }
    const timer = setInterval(() => {
      setLoadingStepIndex((prev) => (prev + 1) % LOADING_STATUS_STEPS.length);
    }, 2400);
    return () => clearInterval(timer);
  }, [isLoading]);

  // Save messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save chat history', e);
    }
  }, [messages]);

  // Scroll to bottom on new messages
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        scrollToBottom(false);
        textareaRef.current?.focus();
      }, 80);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, isLoading, stagedAttachments]);

  const processFiles = (files: FileList | File[]) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    if (stagedAttachments.length + fileList.length > 6) {
      setAttachmentError('You can attach up to 6 study files or photos at once.');
      setTimeout(() => setAttachmentError(null), 4000);
      return;
    }

    fileList.forEach((file) => {
      if (file.size > 15 * 1024 * 1024) {
        setAttachmentError(`File "${file.name}" exceeds the 15MB size limit.`);
        setTimeout(() => setAttachmentError(null), 4000);
        return;
      }

      const isImage = file.type.startsWith('image/');
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (!dataUrl) return;

        const newAttachment: ChatAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          type: isImage ? 'image' : 'file',
          mimeType: file.type || (isImage ? 'image/jpeg' : 'application/octet-stream'),
          size: file.size,
          dataUrl,
        };

        setStagedAttachments((prev) => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleRemoveStagedAttachment = (id: string) => {
    setStagedAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingOver) setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend !== undefined ? textToSend : inputMessage).trim();
    if ((!prompt && stagedAttachments.length === 0) || isLoading) return;

    const currentAttachments = [...stagedAttachments];
    const userMessageId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMessageId,
      role: 'user',
      text: prompt || 'Please analyze this attached study material / question and provide step-by-step guidance.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMessage('');
    setStagedAttachments([]);
    setIsLoading(true);

    try {
      // Build history payload for multi-turn context
      const historyPayload = messages
        .filter((m) => !m.isError)
        .map((m) => ({
          role: m.role,
          text: m.text,
          attachments: m.attachments,
        }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          attachments: currentAttachments,
          history: historyPayload,
          candidateContext,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to receive response from Cambridge Nightmare Support.');
      }

      const botMessageId = `bot-${Date.now()}`;
      const botMsg: ChatMessage = {
        id: botMessageId,
        role: 'model',
        text: data.reply || 'No response generated.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessageId = `err-${Date.now()}`;
      const errorMsg: ChatMessage = {
        id: errorMessageId,
        role: 'model',
        text: `⚠️ **Nightmare Support Error**: ${
          err.message || 'Unable to connect to AI server. Please verify your internet or try again in a moment.'
        }`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = () => {
    if (!isConfirmingClear) {
      setIsConfirmingClear(true);
      if (clearConfirmTimeoutRef.current) clearTimeout(clearConfirmTimeoutRef.current);
      clearConfirmTimeoutRef.current = setTimeout(() => {
        setIsConfirmingClear(false);
      }, 4000);
      return;
    }
    // Confirmed clear
    if (clearConfirmTimeoutRef.current) clearTimeout(clearConfirmTimeoutRef.current);
    setIsConfirmingClear(false);
    setMessages([INITIAL_GREETING]);
    setStagedAttachments([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear chat history in localStorage', e);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.88)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isFullscreen ? '0px' : '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="nightmare-support-title"
    >
      {/* Hidden File and Photo Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        multiple
        accept=".pdf,.doc,.docx,.txt,.csv,.png,.jpg,.jpeg,.webp"
        style={{ display: 'none' }}
        id="nightmare-file-input"
      />
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleFileSelect}
        multiple
        accept="image/*"
        style={{ display: 'none' }}
        id="nightmare-photo-input"
      />

      {/* Drag & Drop Visual Overlay */}
      {isDraggingOver && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(30, 58, 138, 0.88)',
            backdropFilter: 'blur(4px)',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            color: '#ffffff',
            border: '3px dashed #60a5fa',
            borderRadius: isFullscreen ? '0px' : '14px',
            pointerEvents: 'none',
          }}
        >
          <UploadCloud size={64} color="#93c5fd" />
          <div style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Drop Question Photos, Diagrams, or PDFs Here
          </div>
          <div style={{ fontSize: '13px', color: '#bfdbfe', fontFamily: 'var(--font-mono)' }}>
            Supports past paper screenshots, graph plots, handwriting, and study PDFs
          </div>
        </div>
      )}

      {/* Main Modal Card */}
      <div
        className="modal-container"
        style={{
          background: 'linear-gradient(180deg, #090d16 0%, #030712 100%)',
          border: '1px solid rgba(96, 165, 250, 0.3)',
          borderRadius: isFullscreen ? '0px' : '14px',
          width: isFullscreen ? '100vw' : '980px',
          height: isFullscreen ? '100vh' : '86vh',
          maxWidth: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 35px rgba(37, 99, 235, 0.25)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Top Header Bar */}
        <header
          style={{
            padding: '14px 20px',
            background: 'rgba(15, 23, 42, 0.9)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexShrink: 0,
          }}
        >
          {/* Identity & Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                border: '1px solid rgba(96, 165, 250, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(37, 99, 235, 0.4)',
              }}
            >
              <Bot size={20} color="#93c5fd" />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2
                  id="nightmare-support-title"
                  style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: '#ffffff',
                    letterSpacing: '-0.01em',
                    margin: 0,
                  }}
                >
                  Cambridge Nightmare Support
                </h2>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '10px',
                    padding: '2px 7px',
                    background: 'rgba(34, 197, 94, 0.15)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    color: '#4ade80',
                    borderRadius: '10px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                  }}
                >
                  <span
                    style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      background: '#22c55e',
                      boxShadow: '0 0 6px #22c55e',
                    }}
                  />
                  STUDY SOLVER
                </span>
              </div>
              <p
                style={{
                  fontSize: '11px',
                  color: 'var(--text-dim)',
                  margin: '2px 0 0 0',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                Attach question photos, past papers & solve together • Cambridge IGCSE & A-Levels 2026
              </p>
            </div>
          </div>

          {/* Header Action Cluster */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Clear History Button */}
            <button
              type="button"
              id="clear-chat-history-btn"
              onClick={handleClearHistory}
              style={{
                background: isConfirmingClear ? 'rgba(239, 68, 68, 0.22)' : 'rgba(255, 255, 255, 0.06)',
                border: isConfirmingClear ? '1px solid rgba(239, 68, 68, 0.65)' : '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '6px',
                padding: '6px 11px',
                color: isConfirmingClear ? '#fca5a5' : '#cbd5e1',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isConfirmingClear ? '0 0 12px rgba(239, 68, 68, 0.35)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isConfirmingClear) {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                  e.currentTarget.style.color = '#fca5a5';
                }
              }}
              onMouseLeave={(e) => {
                if (!isConfirmingClear) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.14)';
                  e.currentTarget.style.color = '#cbd5e1';
                }
              }}
              title={isConfirmingClear ? 'Click again to confirm clearing all messages' : 'Reset conversation and start fresh'}
            >
              {isConfirmingClear ? (
                <>
                  <AlertTriangle size={12} color="#fca5a5" />
                  <span>Confirm Clear?</span>
                </>
              ) : (
                <>
                  <Trash2 size={12} />
                  <span>Clear Chat</span>
                </>
              )}
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              id="toggle-fullscreen-btn"
              onClick={() => setIsFullscreen((prev) => !prev)}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                width: '44px',
                height: '44px',
                minWidth: '44px',
                minHeight: '44px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                cursor: 'pointer',
              }}
              title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              id="close-nightmare-modal-btn"
              onClick={onClose}
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '8px',
                width: '44px',
                height: '44px',
                minWidth: '44px',
                minHeight: '44px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f87171',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              title="Close window"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Candidate Context Indicator (if active) */}
        {candidateContext && (candidateContext.selectedSubjects?.length || candidateContext.clashesCount !== undefined) && (
          <div
            style={{
              padding: '6px 20px',
              background: 'rgba(30, 58, 138, 0.25)',
              borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
              fontSize: '11px',
              color: '#93c5fd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-mono)',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 600 }}>CANDIDATE PROFILE:</span>
              <span>
                {candidateContext.selectedSubjects?.length
                  ? `${candidateContext.selectedSubjects.length} enrolled subjects (${candidateContext.selectedSubjects.slice(0, 3).join(', ')}${candidateContext.selectedSubjects.length > 3 ? '...' : ''})`
                  : 'Syllabus Triage Mode'}
              </span>
            </div>
            {candidateContext.clashesCount !== undefined && candidateContext.clashesCount > 0 && (
              <span style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertTriangle size={11} /> {candidateContext.clashesCount} Direct Clashes
              </span>
            )}
          </div>
        )}

        {/* Attachment Error Alert Banner (if any) */}
        {attachmentError && (
          <div
            style={{
              padding: '8px 20px',
              background: 'rgba(239, 68, 68, 0.2)',
              borderBottom: '1px solid rgba(239, 68, 68, 0.4)',
              fontSize: '12px',
              color: '#fca5a5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-mono)',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={14} color="#f87171" />
              <span>{attachmentError}</span>
            </div>
            <button
              type="button"
              onClick={() => setAttachmentError(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fca5a5',
                cursor: 'pointer',
                padding: '2px',
              }}
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Chat Messages Log */}
        <div
          id="chat-messages-container"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            scrollBehavior: 'smooth',
          }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              }}
            >
              {/* Role Avatar */}
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background:
                    msg.role === 'user'
                      ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                      : 'linear-gradient(135deg, #1e3a8a, #0f172a)',
                  border:
                    msg.role === 'user'
                      ? '1px solid rgba(96, 165, 250, 0.4)'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow:
                    msg.role === 'user'
                      ? '0 0 10px rgba(59, 130, 246, 0.3)'
                      : '0 0 10px rgba(0, 0, 0, 0.5)',
                }}
              >
                {msg.role === 'user' ? (
                  <User size={16} color="#ffffff" />
                ) : (
                  <Bot size={16} color="#93c5fd" />
                )}
              </div>

              {/* Message Bubble Container */}
              <div
                style={{
                  maxWidth: '84%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                {/* Meta info (Name & Time) */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px',
                    fontSize: '11px',
                    color: 'var(--text-dim)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  <span style={{ fontWeight: 600, color: msg.role === 'user' ? '#93c5fd' : '#cbd5e1' }}>
                    {msg.role === 'user' ? 'Candidate' : 'Cambridge Nightmare Support'}
                  </span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>

                {/* Message Bubble Body */}
                <div
                  style={{
                    background:
                      msg.role === 'user'
                        ? 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)'
                        : msg.isError
                        ? 'rgba(239, 68, 68, 0.1)'
                        : 'rgba(15, 23, 42, 0.75)',
                    border:
                      msg.role === 'user'
                        ? '1px solid rgba(96, 165, 250, 0.3)'
                        : msg.isError
                        ? '1px solid rgba(239, 68, 68, 0.3)'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius:
                      msg.role === 'user' ? '12px 2px 12px 12px' : '2px 12px 12px 12px',
                    padding: '14px 16px',
                    color: '#ffffff',
                    fontSize: '13px',
                    lineHeight: 1.65,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                    position: 'relative',
                    wordBreak: 'break-word',
                  }}
                >
                  {/* Render Message Attachments (if any) */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px',
                        marginBottom: '10px',
                        paddingBottom: '10px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      {msg.attachments.map((att) =>
                        att.type === 'image' ? (
                          <div
                            key={att.id}
                            style={{
                              position: 'relative',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              border: '1px solid rgba(96, 165, 250, 0.4)',
                              cursor: 'pointer',
                              background: '#020617',
                              maxWidth: '220px',
                              maxHeight: '160px',
                            }}
                            onClick={() => setActiveLightboxImage(att.dataUrl)}
                            title="Click to zoom image"
                          >
                            <img
                              src={att.dataUrl}
                              alt={att.name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block',
                              }}
                            />
                            <div
                              style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                background: 'rgba(2, 6, 23, 0.75)',
                                padding: '3px 6px',
                                fontSize: '10px',
                                color: '#e2e8f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontFamily: 'var(--font-mono)',
                              }}
                            >
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                                {att.name}
                              </span>
                              <ZoomIn size={11} color="#93c5fd" />
                            </div>
                          </div>
                        ) : (
                          <div
                            key={att.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              background: 'rgba(2, 6, 23, 0.8)',
                              border: '1px solid rgba(96, 165, 250, 0.3)',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              fontSize: '11px',
                              fontFamily: 'var(--font-mono)',
                              color: '#cbd5e1',
                            }}
                          >
                            <FileText size={14} color="#60a5fa" />
                            <div>
                              <div style={{ fontWeight: 600, color: '#ffffff' }}>{att.name}</div>
                              <div style={{ fontSize: '9px', color: 'var(--text-dimmer)' }}>
                                {formatFileSize(att.size)}
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* Markdown Renderer formatted cleanly */}
                  <div
                    className="markdown-body"
                    style={{
                      color: '#f1f5f9',
                      fontSize: '13px',
                    }}
                  >
                    <Markdown>{msg.text}</Markdown>
                  </div>
                  
                  {msg.id === 'init-msg-001' && (
                    <div style={{ marginTop: '12px' }}>
                      <ChatReasoningDemo />
                    </div>
                  )}

                  {/* Message Tools (Copy) */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      marginTop: '8px',
                      paddingTop: '6px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(msg.id, msg.text)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: copiedId === msg.id ? '#4ade80' : 'var(--text-dimmer)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                        padding: '2px 4px',
                      }}
                      title="Copy message content"
                    >
                      {copiedId === msg.id ? <Check size={11} color="#4ade80" /> : <Copy size={11} />}
                      <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div
              id="chat-typing-indicator"
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                animation: 'fadeIn 0.25s ease-out',
              }}
            >
              {/* Pulsing Bot Avatar */}
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
                  border: '1px solid rgba(147, 197, 253, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  animation: 'avatarGlowPulse 2s infinite ease-in-out',
                }}
              >
                <Bot size={16} color="#93c5fd" />
              </div>

              {/* Typing Bubble */}
              <div
                style={{
                  maxWidth: '84%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                }}
              >
                {/* Meta info with Live Typing Status */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px',
                    fontSize: '11px',
                    color: '#93c5fd',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  <span style={{ fontWeight: 600, color: '#93c5fd' }}>Cambridge Nightmare Support</span>
                  <span>•</span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#38bdf8',
                    }}
                  >
                    <span
                      style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        background: '#38bdf8',
                        boxShadow: '0 0 6px #38bdf8',
                        animation: 'pulse 1s infinite alternate',
                      }}
                    />
                    typing...
                  </span>
                </div>

                {/* Animated Bubble Container */}
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid rgba(96, 165, 250, 0.35)',
                    borderRadius: '2px 12px 12px 12px',
                    padding: '12px 16px',
                    color: '#ffffff',
                    fontSize: '12px',
                    lineHeight: 1.5,
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4), 0 0 15px rgba(37, 99, 235, 0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Subtle Top Shimmer Line */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '2px',
                      background: 'linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.8), transparent)',
                      animation: 'shimmerGlow 2s infinite ease-in-out',
                    }}
                  />

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Triple Bouncing Wave Dots */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '3px 6px',
                        background: 'rgba(2, 6, 23, 0.7)',
                        borderRadius: '12px',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                      }}
                    >
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </div>

                    {/* Dynamic Real-Time Feedback Text with Blinking Cursor */}
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12px',
                        color: '#bae6fd',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <span>{LOADING_STATUS_STEPS[loadingStepIndex]}</span>
                      <span className="typing-cursor" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />

        </div>

        {/* Quick Reply Suggestion Chips */}
        <div
          style={{
            padding: '10px 20px',
            background: 'rgba(15, 23, 42, 0.85)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '10px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: '#60a5fa',
              background: 'rgba(37, 99, 235, 0.2)',
              border: '1px solid rgba(96, 165, 250, 0.3)',
              borderRadius: '12px',
              padding: '4px 8px',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <Sparkles size={11} color="#60a5fa" />
            <span>QUICK REPLIES</span>
          </div>

          {stagedAttachments.length > 0
            ? ATTACHMENT_SUGGESTION_CHIPS.map((promptText, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(promptText)}
                  disabled={isLoading}
                  style={{
                    background: 'rgba(37, 99, 235, 0.18)',
                    border: '1px solid rgba(96, 165, 250, 0.4)',
                    borderRadius: '20px',
                    padding: '6px 14px',
                    color: '#93c5fd',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                    minHeight: '34px',
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.background = 'rgba(59, 130, 246, 0.35)';
                      e.currentTarget.style.color = '#ffffff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(37, 99, 235, 0.18)';
                    e.currentTarget.style.color = '#93c5fd';
                  }}
                >
                  <Sparkles size={12} color="#60a5fa" />
                  <span>{promptText}</span>
                </button>
              ))
            : SUGGESTION_CHIPS.map((chip, idx) => {
                const Icon = chip.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(chip.prompt)}
                    disabled={isLoading}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '20px',
                      padding: '6px 14px',
                      color: '#e2e8f0',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s ease',
                      flexShrink: 0,
                      minHeight: '34px',
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.25)';
                        e.currentTarget.style.borderColor = 'rgba(96, 165, 250, 0.5)';
                        e.currentTarget.style.color = '#ffffff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                      e.currentTarget.style.color = '#e2e8f0';
                    }}
                  >
                    <Icon size={13} color="#60a5fa" />
                    <span>{chip.label}</span>
                    {chip.badge && (
                      <span
                        style={{
                          fontSize: '9px',
                          fontFamily: 'var(--font-mono)',
                          background: 'rgba(96, 165, 250, 0.15)',
                          color: '#93c5fd',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          border: '1px solid rgba(96, 165, 250, 0.25)',
                        }}
                      >
                        {chip.badge}
                      </span>
                    )}
                  </button>
                );
              })}
        </div>

        {/* Staged Attachments Tray */}
        {stagedAttachments.length > 0 && (
          <div
            style={{
              padding: '8px 20px',
              background: 'rgba(2, 6, 23, 0.9)',
              borderTop: '1px solid rgba(59, 130, 246, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: '10px',
                color: '#93c5fd',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Attached Study Material ({stagedAttachments.length}):
            </span>

            {stagedAttachments.map((att) => (
              <div
                key={att.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(30, 58, 138, 0.4)',
                  border: '1px solid rgba(96, 165, 250, 0.4)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  color: '#ffffff',
                }}
              >
                {att.type === 'image' ? (
                  <img
                    src={att.dataUrl}
                    alt={att.name}
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '4px',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <FileText size={14} color="#60a5fa" />
                )}
                <span
                  style={{
                    maxWidth: '120px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={att.name}
                >
                  {att.name}
                </span>
                <span style={{ fontSize: '9px', color: '#93c5fd', fontFamily: 'var(--font-mono)' }}>
                  ({formatFileSize(att.size)})
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveStagedAttachment(att.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#f87171',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px',
                    marginLeft: '2px',
                  }}
                  title="Remove attachment"
                >
                  <X size={12} />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setStagedAttachments([])}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-dimmer)',
                fontSize: '10px',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                textDecoration: 'underline',
              }}
            >
              Clear all
            </button>
          </div>
        )}

        {/* Input Bar with Radiant Kinetic Prompt Input styling */}
        <footer
          style={{
            padding: '12px 20px 16px',
            background: 'rgba(15, 23, 42, 0.95)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div className="radiant-input-wrapper">
            {/* Animated Kinetic Gradient Border Mask */}
            <div className="radiant-input-border" />

            <div
              style={{
                position: 'relative',
                zIndex: 10,
                display: 'flex',
                alignItems: 'flex-end',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '12px',
                background: 'rgba(2, 6, 23, 0.85)',
                backdropFilter: 'blur(12px)',
              }}
            >
              {/* Attachment Buttons */}
              <div style={{ display: 'flex', gap: '4px', paddingBottom: '2px' }}>
                <button
                  type="button"
                  id="nightmare-photo-attach-btn"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isLoading}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    width: '34px',
                    height: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#93c5fd',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  title="Attach question photo or diagram (PNG, JPG, WebP)"
                >
                  <ImageIcon size={15} />
                </button>

                <button
                  type="button"
                  id="nightmare-file-attach-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    width: '34px',
                    height: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#cbd5e1',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  title="Attach past paper PDF or notes"
                >
                  <Paperclip size={15} />
                </button>
              </div>

              <textarea
                ref={textareaRef}
                id="nightmare-chat-input"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  stagedAttachments.length > 0
                    ? "Describe what you need help with in this attached file (or press Enter to analyze)..."
                    : "Ask or attach question photo / diagram / PDF to study together..."
                }
                disabled={isLoading}
                rows={1}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#ffffff',
                  fontSize: '13px',
                  lineHeight: 1.5,
                  resize: 'none',
                  maxHeight: '120px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />

              <button
                type="button"
                id="nightmare-chat-send-btn"
                onClick={() => handleSendMessage()}
                disabled={(!inputMessage.trim() && stagedAttachments.length === 0) || isLoading}
                style={{
                  background:
                    (inputMessage.trim() || stagedAttachments.length > 0) && !isLoading
                      ? 'linear-gradient(135deg, #2563eb, #3b82f6)'
                      : 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '8px',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  cursor:
                    (inputMessage.trim() || stagedAttachments.length > 0) && !isLoading
                      ? 'pointer'
                      : 'not-allowed',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                  boxShadow:
                    (inputMessage.trim() || stagedAttachments.length > 0) && !isLoading
                      ? '0 0 16px rgba(59, 130, 246, 0.5)'
                      : 'none',
                }}
                title="Send message or solve attached question (Enter)"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '8px',
              fontSize: '10px',
              color: 'var(--text-dimmer)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <span>
              <strong>Enter</strong> to send • <strong>Shift + Enter</strong> for new line • Drag & drop photos / PDFs
            </span>
            <span>Cambridge IGCSE 2026</span>
          </div>
        </footer>
      </div>

      {/* Lightbox Modal for Zooming Attached Images */}
      {activeLightboxImage && (
        <div
          onClick={() => setActiveLightboxImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.92)',
            zIndex: 100000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            cursor: 'zoom-out',
          }}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '92vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%',
                marginBottom: '8px',
                color: '#ffffff',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
              }}
            >
              <span>Past Paper Image / Diagram Inspection</span>
              <button
                type="button"
                onClick={() => setActiveLightboxImage(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <X size={14} /> Close
              </button>
            </div>
            <img
              src={activeLightboxImage}
              alt="Expanded study diagram"
              style={{
                maxWidth: '92vw',
                maxHeight: '82vh',
                objectFit: 'contain',
                borderRadius: '8px',
                border: '1px solid rgba(96, 165, 250, 0.4)',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.9)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CambridgeNightmareSupportModal;
