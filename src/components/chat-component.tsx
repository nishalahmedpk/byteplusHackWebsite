"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AudioVisualizer } from '@/components/ui/audio-visualizer';
import { supabase } from '@/lib/supabaseClient';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  IconPlus, IconMicrophone, IconSend, IconUser, IconRobot, 
  IconChevronDown, IconHistory, IconX, IconMicrophoneOff 
} from '@tabler/icons-react';
import JourneyMap from './map2';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatHistory {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  threadId: string;
}

// API Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const ChatComponent = () => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isTTSPlaying, setIsTTSPlaying] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [threadIds, setThreadIds] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: 'Hello! How can I help you today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([
    {
      id: '1',
      title: 'Welcome Chat',
      lastMessage: 'Hello! How can I help you today?',
      timestamp: new Date(),
      threadId: ''
    }
  ]);
  const [currentChatId, setCurrentChatId] = useState('1');
  const [apiEndpoint, setApiEndpoint] = useState("http://127.0.0.1:2024");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const threadIdRef = useRef<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Create new thread
  const createThread = async () => {
    try {
      const response = await fetch(`${apiEndpoint}/threads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      const threadId = data.thread_id;
      
      // Update state
      setCurrentThreadId(threadId);
      setThreadIds(prev => [...prev, threadId]);
      
      // Store thread in Supabase
      await saveThreadToSupabase(threadId);
      
      return threadId;
    } catch (error) {
      console.error("Error creating thread:", error);
      return null;
    }
  };

  // Create thread on mount
  useEffect(() => {
    const initThread = async () => {
      threadIdRef.current = await createThread();
    };
    initThread();
  }, [apiEndpoint]);

  // 🔊 ElevenLabs TTS
  const playTTS = async (text: string, autoResume = false) => {
    try {
      const response = await fetch(
        "https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || ""
          },
          body: JSON.stringify({
            text,
            model_id: "eleven_flash_v2_5",
            voice_settings: {
              stability: 0.8,
              similarity_boost: 0.75
            }
          })
        }
      );

      const audioData = await response.arrayBuffer();
      const audioBlob = new Blob([audioData], { type: "audio/mpeg" });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      setIsTTSPlaying(true);
      audio.onended = () => {
        setIsTTSPlaying(false);
        // 🔁 Auto resume listening after TTS ends
        if (autoResume) {
          // handleMicrophoneClick();
        }
      };

      await audio.play();
    } catch (error) {
      console.error("TTS error:", error);
      setIsTTSPlaying(false);
    }
  };

  // 🎤 ElevenLabs STT
  const processAudioSTT = async (audioBlob: Blob, voiceMode = false) => {
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "recording.webm");
      formData.append("model_id", "scribe_v1");

      const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
        method: "POST",
        headers: {
          "xi-api-key": process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || ""
        },
        body: formData
      });

      if (!response.ok) {
        console.error("STT failed:", response.status, await response.text());
        return;
      }

      const result = await response.json();
      console.log("STT result:", result);

      if (result && result.text) {
        const userMessage: ChatMessage = {
          id: Date.now().toString(),
          text: result.text,
          sender: 'user',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        await handleBotResponse(result.text, voiceMode);
      }
    } catch (error) {
      console.error("STT error:", error);
    }
  };

  // 🔊 Bot response with LangGraph API and optional TTS
  const handleBotResponse = async (userText: string, voiceMode = false) => {
    setIsTyping(true);
    
    try {
      if (!threadIdRef.current) {
        threadIdRef.current = await createThread();
      }

      const body = {
        assistant_id: "agent",
        input: { messages: [{ role: "user", content: userText }] },
      };

      const response = await fetch(
        `${apiEndpoint}/threads/${threadIdRef.current}/runs/wait`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();
      console.log("📦 API Response:", data);

      let botResponse = "Sorry, I couldn't get a response from the bot.";

      if (Array.isArray(data?.messages)) {
        const aiMessages = data.messages.filter((m: any) => m.type === "ai");
        if (aiMessages.length > 0) {
          botResponse = aiMessages[aiMessages.length - 1].content;
        }
      }

      setTimeout(async () => {
        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: botResponse,
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);

        // Play TTS if in voice mode and auto-resume listening
        if (voiceMode || isRecording) {
          await playTTS(botResponse, true);
        }
      }, Math.random() * 1000 + 1000);
    } catch (error) {
      console.error("❌ API Error:", error);
      setTimeout(async () => {
        const errorMessage = "Oops! Something went wrong with the API call. Please check your connection and try again! 😢";
        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: errorMessage,
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
        
        if (voiceMode || isRecording) {
          await playTTS(errorMessage, true);
        }
      }, 1000);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    const messageText = inputText;
    setInputText('');

    await handleBotResponse(messageText);
  };

  const handleMicrophoneClick = async () => {
    if (inputText.trim()) {
      handleSendMessage();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setAudioStream(stream);
        setIsRecording(true);
        setIsMuted(false);

        const options = { mimeType: "audio/webm" };
        const mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          await processAudioSTT(audioBlob, true);
        };

        mediaRecorder.start();

        // 👂 Silence detection
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        source.connect(analyser);
        const dataArray = new Uint8Array(analyser.fftSize);

        let silenceStart = Date.now();
        const SILENCE_THRESHOLD = 0.01;
        const SILENCE_DURATION = 2000;

        const checkSilence = () => {
          if (isMuted || isTTSPlaying) {
            requestAnimationFrame(checkSilence);
            return;
          }

          analyser.getByteFrequencyData(dataArray);
          let values = 0;
          for (let i = 0; i < dataArray.length; i++) values += dataArray[i];
          const average = values / dataArray.length;

          if (average < SILENCE_THRESHOLD * 255) {
            if (Date.now() - silenceStart > SILENCE_DURATION) {
              handleStopRecording();
              return;
            }
          } else {
            silenceStart = Date.now();
          }

          requestAnimationFrame(checkSilence);
        };

        checkSilence();
      } catch (error) {
        console.error('Error accessing microphone:', error);
      }
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      setAudioStream(null);
    }
    setIsRecording(false);
    setIsMuted(false);
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };

  const saveThreadToSupabase = async (threadId: string) => {
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user found');
      return;
    }

    const { error } = await supabase
      .from('chat_threads')
      .insert([
        {
          thread_id: threadId,
          user_id: user.id, // Use actual user ID
          title: 'New Chat',
          last_message: 'Start a conversation...'
        }
      ]);

    if (error) throw error;
  } catch (error) {
    console.error('Error saving thread to Supabase:', error);
  }
};

const loadThreadsFromSupabase = async () => {
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user found');
      return;
    }

    const { data, error } = await supabase
      .from('chat_threads')
      .select('*')
      .eq('user_id', user.id) // Filter by user ID
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (data) {
      const threads = data.map(thread => ({
        id: thread.thread_id,
        title: thread.thread_id,
        lastMessage: thread.last_message,
        timestamp: new Date(thread.created_at),
        threadId: thread.thread_id
      }));
      
      setChatHistory(threads);
      setThreadIds(data.map(thread => thread.thread_id));
    }
  } catch (error) {
    console.error('Error loading threads from Supabase:', error);
  }
};
  const getChatState = async (threadID: string): Promise<any> => {
    try {
      const response = await fetch(`${apiEndpoint}/threads/${threadID}/state`);
      
      if (!response.ok) {
        throw new Error('Failed to get chat state');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting chat state:', error);
      throw error;
    }
  };

  // Load threads on component mount
  useEffect(() => {
    loadThreadsFromSupabase();
  }, []);

  const handleNewChat = async () => {
    try {
      const threadId = await createThread();
      const newChatId = Date.now().toString();
      const newChat: ChatHistory = {
        id: newChatId,
        title: 'New Chat',
        lastMessage: 'Start a conversation...',
        timestamp: new Date(),
        threadId: threadId || ''
      };

      setChatHistory(prev => [newChat, ...prev]);
      setCurrentChatId(newChatId);
      setMessages([
        {
          id: '1',
          text: 'Hello! How can I help you today?',
          sender: 'bot',
          timestamp: new Date()
        }
      ]);
    } catch (error) {
      console.error('Error creating new chat:', error);
      // Fallback to local chat without thread
      const newChatId = Date.now().toString();
      const newChat: ChatHistory = {
        id: newChatId,
        title: 'New Chat',
        lastMessage: 'Start a conversation...',
        timestamp: new Date(),
        threadId: ''
      };

      setChatHistory(prev => [newChat, ...prev]);
      setCurrentChatId(newChatId);
      setMessages([
        {
          id: '1',
          text: 'Hello! How can I help you today?',
          sender: 'bot',
          timestamp: new Date()
        }
      ]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const selectChat = async (chatId: string) => {
    setCurrentChatId(chatId);
    
    // Find the selected chat to get its thread ID
    const selectedChat = chatHistory.find(chat => chat.id === chatId);
    
    if (selectedChat && selectedChat.threadId) {
      try {
        setCurrentThreadId(selectedChat.threadId);
        
        // Load chat state from API
        const chatState = await getChatState(selectedChat.threadId);
        
        // Convert API response to messages format
        if (chatState && chatState.values && chatState.values.messages) {
          // const loadedMessages = chatState.values.messages.map((msg: any, index: number) => ({
          //   id: `${selectedChat.threadId}-${index}`,
          //   text: msg.content || msg.text || '',
          //   sender: msg.role === 'user' ? 'user' : 'bot',
          //   timestamp: new Date(msg.timestamp || Date.now())
          // }));
          
            const loadedMessages = chatState.values.messages.map((msg: any, index: number) => {
              let text = '';
              
              if (typeof msg.content === 'string') {
                text = msg.content;
              } else if (Array.isArray(msg.content)) {
                const textPart = msg.content.find((c: any) => c.type === 'text');
                text = textPart?.text || '';
              }

              if (!text) return null;

              return {
                id: `${selectedChat.threadId}-${index}`,
                text,
                sender: msg.type === 'human' ? 'user' : msg.type === 'ai' ? 'bot' : 'system',
                timestamp: new Date(msg.timestamp || Date.now()),
              };
            }).filter(Boolean);
          
          
          setMessages(loadedMessages.length > 0 ? loadedMessages : [
            {
              id: '1',
              text: 'Hello! How can I help you today?',
              sender: 'bot',
              timestamp: new Date()
            }
          ]);
        } else {
          // Fallback if no messages in state
          setMessages([
            {
              id: '1',
              text: 'Hello! How can I help you today?',
              sender: 'bot',
              timestamp: new Date()
            }
          ]);
        }
      } catch (error) {
        console.error('Error loading chat state:', error);
        // Fallback to default message
        setMessages([
          {
            id: '1',
            text: 'Hello! How can I help you today?',
            sender: 'bot',
            timestamp: new Date()
          }
        ]);
      }
    } else {
      // No thread ID, load default message
      setCurrentThreadId(null);
      setMessages([
        {
          id: '1',
          text: 'Hello! How can I help you today?',
          sender: 'bot',
          timestamp: new Date()
        }
      ]);
    }
  };

  return (
    <div className="flex flex-col h-[80vh] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b flex-shrink-0">
        <div className="flex gap-2">
          <Button
            onClick={handleNewChat}
            className="flex-1 justify-start gap-2"
            variant="outline"
          >
            <IconPlus size={16} />
            New Chat
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <IconHistory size={16} />
                History
                <IconChevronDown size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="p-2 max-h-60 overflow-y-auto">
                {chatHistory.map((chat) => (
                  <DropdownMenuItem
                    key={chat.id}
                    onClick={() => selectChat(chat.id)}
                    className={`p-3 cursor-pointer ${
                      currentChatId === chat.id ? 'bg-accent' : ''
                    }`}
                  >
                    <div className="w-full">
                      <div className="font-medium text-sm truncate">{chat.title}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {chat.lastMessage}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {chat.timestamp.toLocaleDateString()}
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 min-h-0 overflow-y-auto p-4">

          <div className="space-y-4">
            {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.sender === 'bot' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        <IconRobot size={16} />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[70%] rounded-lg px-3 py-2 ${
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  {message.sender === 'user' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        <IconUser size={16} />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              
              {/* Typing indicator */}
              {isTyping && (
                <div className="flex gap-3 justify-start">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <IconRobot size={16} />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <div className="flex items-center space-x-1">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-xs text-muted-foreground ml-2">Bot is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t flex-shrink-0">
            {isRecording ? (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="text-center text-sm text-muted-foreground mb-2">
                    {isMuted ? 'Microphone muted' : isTTSPlaying ? 'Paused for TTS...' : 'Listening...'}
                  </div>
                  <div className="h-20">
                    <AudioVisualizer
                      stream={audioStream}
                      isRecording={isRecording}
                      onClick={handleStopRecording}
                      isMuted={isMuted || isTTSPlaying}
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={handleToggleMute}
                    size="icon"
                    variant={isMuted ? "destructive" : "outline"}
                    className="rounded-full"
                  >
                    {isMuted ? (
                      <IconMicrophoneOff size={16} />
                    ) : (
                      <IconMicrophone size={16} />
                    )}
                  </Button>
                  <Button
                    onClick={handleStopRecording}
                    size="icon"
                    variant="destructive"
                    className="rounded-full"
                  >
                    <IconX size={16} />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button
                  onClick={handleMicrophoneClick}
                  size="icon"
                >
                  {inputText.trim() ? (
                    <IconSend size={16} />
                  ) : (
                    <IconMicrophone size={16} />
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
        {/* <JourneyMap threadID={currentThreadId ?? undefined} apiEndpoint={apiEndpoint} /> */}
      </div>
      
  );
};

export default ChatComponent;
