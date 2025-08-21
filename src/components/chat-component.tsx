"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AudioVisualizer } from '@/components/ui/audio-visualizer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IconPlus, IconMicrophone, IconSend, IconUser, IconRobot, IconChevronDown, IconHistory, IconX, IconMicrophoneOff } from '@tabler/icons-react';

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
}

const ChatComponent = () => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
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
      timestamp: new Date()
    }
  ]);
  const [currentChatId, setCurrentChatId] = useState('1');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');

    // Simulate bot response
    setTimeout(() => {
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Thank you for your message! This is a simulated response.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    }, 1000);
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
      } catch (error) {
        console.error('Error accessing microphone:', error);
      }
    }
  };

  const handleStopRecording = () => {
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      setAudioStream(null);
    }
    setIsRecording(false);
    setIsMuted(false);
    // Here you would stop recording and process the audio
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    // Here you would mute/unmute the microphone
  };

  const handleNewChat = () => {
    const newChatId = Date.now().toString();
    const newChat: ChatHistory = {
      id: newChatId,
      title: 'New Chat',
      lastMessage: 'Start a conversation...',
      timestamp: new Date()
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
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const selectChat = (chatId: string) => {
    setCurrentChatId(chatId);
    // In a real app, you'd load the messages for this chat
    setMessages([
      {
        id: '1',
        text: 'Hello! How can I help you today?',
        sender: 'bot',
        timestamp: new Date()
      }
    ]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with New Chat Button and Chat History Dropdown */}
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

      {/* Main Chat Area - Full Width */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-4">
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
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t flex-shrink-0">
          {isRecording ? (
            /* Recording Mode with Audio Visualizer */
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-center text-sm text-muted-foreground mb-2">
                  {isMuted ? 'Microphone muted' : 'Listening...'}
                </div>
                <div className="h-20">
                  <AudioVisualizer
                    stream={audioStream}
                    isRecording={isRecording}
                    onClick={handleStopRecording}
                    isMuted={isMuted}
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
            /* Normal Input Mode */
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
                disabled={false}
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
    </div>
  );
};

export default ChatComponent;
