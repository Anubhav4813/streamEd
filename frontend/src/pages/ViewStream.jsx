import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { AlertCircle, Maximize, LayoutDashboard, Expand, Shrink, Send, Settings, MessageSquare, Video } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  GridLayout,
  ParticipantTile,
  ControlBar,
  useTracks,
} from '@livekit/components-react';
import { Track, VideoQuality } from 'livekit-client';
import '@livekit/components-styles';

function MyVideoUI() {
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  const [quality, setQuality] = useState('1080p');
  const [isQualityOpen, setIsQualityOpen] = useState(false);

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: false },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: true }
  );

  useEffect(() => {
    tracks.forEach(t => {
      if (t.publication) {
        if (quality === '1440p') t.publication.setVideoQuality(VideoQuality.HIGH);
        else if (quality === '1080p') t.publication.setVideoQuality(VideoQuality.MEDIUM);
        else if (quality === '720p') t.publication.setVideoQuality(VideoQuality.LOW);
      }
    });
  }, [quality, tracks]);

  const screenTracks = tracks.filter((t) => t.source === Track.Source.ScreenShare);
  const hasScreenShare = screenTracks.length > 0;

  useEffect(() => {
    if (hasScreenShare) {
      setFocusMode(true);
    } else {
      setFocusMode(false);
    }
  }, [hasScreenShare]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col h-full w-full relative group bg-black">
      <div className="absolute top-2 right-2 lg:top-4 lg:right-4 z-20 flex gap-2">
        <div className="relative">
          <button 
            onClick={() => setIsQualityOpen(!isQualityOpen)}
            className="bg-gray-900/80 hover:bg-gray-900 text-white p-2 rounded-lg backdrop-blur-md transition-all flex items-center gap-2 text-sm shadow-md border border-gray-700"
          >
            <Settings size={16} /> <span className="hidden sm:inline">Quality:</span> {quality}
          </button>
          {isQualityOpen && (
            <div className="absolute top-full right-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 flex flex-col overflow-hidden w-36">
              <button onClick={() => { setQuality('1440p'); setIsQualityOpen(false); }} className={`px-4 py-2 text-left text-sm hover:bg-gray-800 ${quality === '1440p' ? 'text-brand font-bold' : 'text-white'}`}>1440p</button>
              <button onClick={() => { setQuality('1080p'); setIsQualityOpen(false); }} className={`px-4 py-2 text-left text-sm hover:bg-gray-800 ${quality === '1080p' ? 'text-brand font-bold' : 'text-white'}`}>1080p</button>
              <button onClick={() => { setQuality('720p'); setIsQualityOpen(false); }} className={`px-4 py-2 text-left text-sm hover:bg-gray-800 ${quality === '720p' ? 'text-brand font-bold' : 'text-white'}`}>720p</button>
            </div>
          )}
        </div>
        {hasScreenShare && (
          <button 
            onClick={() => setFocusMode(!focusMode)}
            className="bg-gray-900/80 hover:bg-gray-900 text-white p-2 rounded-lg backdrop-blur-md transition-all flex items-center gap-2 text-sm shadow-md border border-gray-700"
          >
            {focusMode ? (
              <>
                <LayoutDashboard size={16} /> <span className="hidden sm:inline">Grid View</span>
              </>
            ) : (
              <>
                <Maximize size={16} /> <span className="hidden sm:inline">Focus Screen</span>
              </>
            )}
          </button>
        )}
        <button 
          onClick={toggleFullscreen}
          className="bg-gray-900/80 hover:bg-gray-900 text-white p-2 rounded-lg backdrop-blur-md transition-all flex items-center gap-2 text-sm shadow-md border border-gray-700"
        >
          {isFullscreen ? (
            <>
              <Shrink size={16} /> <span className="hidden sm:inline">Exit Fullscreen</span>
            </>
          ) : (
            <>
              <Expand size={16} /> <span className="hidden sm:inline">Fullscreen</span>
            </>
          )}
        </button>
      </div>

      {focusMode && hasScreenShare ? (
        <div className="flex-1 flex min-h-0 relative bg-gray-900">
           {/* Big Screen Share */}
           <div className="flex-1 h-full w-full">
             <GridLayout tracks={screenTracks} style={{ height: '100%', width: '100%' }}>
               <ParticipantTile />
             </GridLayout>
           </div>
        </div>
      ) : (
        <GridLayout tracks={tracks} style={{ flex: 1, minHeight: 0 }}>
          <ParticipantTile />
        </GridLayout>
      )}

      {/* Viewers only need basic controls like leave */}
      <ControlBar 
        controls={{ microphone: false, camera: false, screenShare: false, leave: true, chat: false }} 
      />
    </div>
  );
}

const socket = io(window.location.origin, { autoConnect: false });

const ViewStream = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [roomToken, setRoomToken] = useState('');
  const [liveKitUrl, setLiveKitUrl] = useState('');
  const [error, setError] = useState('');
  
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [mobileTab, setMobileTab] = useState('video'); // 'video' or 'chat'
  const { darkMode, token } = useAppContext();
  const chatEndRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (token) {
      socket.auth = { token };
      socket.connect();
    }
    
    socket.emit('chat:join', { roomName: roomId }, (res) => {
      if (res?.ok) {
        setMessages(res.history);
      }
    });

    const handleNewMessage = (message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    };

    socket.on('chat:new', handleNewMessage);
    socket.on('chat:cleared', () => setMessages([]));

    return () => {
      socket.off('chat:new', handleNewMessage);
      socket.off('chat:cleared');
      socket.disconnect();
    };
  }, [roomId, token]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (chatMessage.trim()) {
      socket.emit('chat:send', { roomName: roomId, text: chatMessage }, (res) => {
        if (!res?.ok) {
          console.error(res?.error);
        }
      });
      setChatMessage('');
    }
  };

  useEffect(() => {
    const joinStream = async () => {
      try {
        const res = await fetch('/live/token', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ roomName: roomId, role: 'viewer' })
        });
        const data = await res.json();
        
        if (!res.ok) {
           throw new Error(data.error || 'Failed to get token');
        }

        if (data.token && data.livekitUrl) {
          setRoomToken(data.token);
          setLiveKitUrl(data.livekitUrl);
        } else {
          throw new Error('Invalid token response from server');
        }
      } catch (err) {
        console.error(err);
        setError(err.message);
      }
    };

    joinStream();
  }, [roomId, token]);

  if (error) {
    return (
      <div className={`p-6 lg:p-8 max-w-3xl mx-auto text-center mt-20 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        <AlertCircle size={64} className="mx-auto mb-4 text-red-500" />
        <h2 className="text-3xl font-bold mb-2">Could not join stream</h2>
        <p className="text-gray-500 mb-6">{error}</p>
        <button 
          onClick={() => navigate('/watch')}
          className="bg-brand text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700"
        >
          Back to Live Streams
        </button>
      </div>
    );
  }

  const unreadCount = messages.length;

  return (
    <div className={`p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto flex flex-col h-[calc(100vh-73px)] lg:h-[calc(100vh-100px)] pb-16 lg:pb-8 ${darkMode ? 'text-white' : ''}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-3 sm:mb-6">
        <h2 className={`text-lg sm:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          <span className="hidden sm:inline">Live Session: </span><span className="text-brand text-sm sm:text-xl">{roomId}</span>
        </h2>
        <button onClick={() => navigate('/watch')} className="bg-gray-200 text-gray-800 px-4 sm:px-6 py-2 rounded-lg font-bold shadow-sm hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 text-sm sm:text-base">Leave</button>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-3 w-full">
        <button
          onClick={() => setMobileTab('video')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
            mobileTab === 'video' 
              ? `${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} shadow-sm` 
              : `${darkMode ? 'text-gray-400' : 'text-gray-500'}`
          }`}
        >
          <Video size={16} /> Stream
        </button>
        <button
          onClick={() => setMobileTab('chat')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 relative ${
            mobileTab === 'chat' 
              ? `${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} shadow-sm` 
              : `${darkMode ? 'text-gray-400' : 'text-gray-500'}`
          }`}
        >
          <MessageSquare size={16} /> Chat
          {mobileTab !== 'chat' && unreadCount > 0 && (
            <span className="absolute top-1 right-3 w-2 h-2 bg-brand rounded-full animate-pulse"></span>
          )}
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-3 sm:gap-6 min-h-0 overflow-hidden">
        {/* Video Player — hidden on mobile when chat tab is active */}
        <div className={`flex-1 bg-black rounded-2xl overflow-hidden relative shadow-lg flex items-center justify-center border-4 border-gray-800 min-h-0 ${mobileTab === 'chat' ? 'hidden lg:flex' : 'flex'}`}>
          {roomToken && liveKitUrl ? (
            <LiveKitRoom
              video={false}
              audio={true}
              token={roomToken}
              serverUrl={liveKitUrl}
              connect={true}
              data-lk-theme="default"
              style={{ height: '100%', width: '100%' }}
              onDisconnected={() => navigate('/watch')}
            >
              <MyVideoUI />
              <RoomAudioRenderer />
            </LiveKitRoom>
          ) : (
            <div className="text-gray-500 text-center flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mb-4"></div>
              <p className="text-xl font-medium">Connecting to stream...</p>
            </div>
          )}
        </div>

        {/* Chat Window — hidden on mobile when video tab is active */}
        <div className={`w-full lg:w-80 flex flex-col rounded-2xl shadow-sm border min-h-0 ${mobileTab === 'video' ? 'hidden lg:flex' : 'flex flex-1'} ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className={`p-3 sm:p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} font-bold text-sm sm:text-base shrink-0`}>
            Live Chat
          </div>
          
          <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3 sm:space-y-4 min-h-0">
            {messages.map((msg, i) => {
              const username = msg.user || msg.senderName || 'Unknown';
              const isHost = username.includes('Host');
              return (
                <div key={msg.id || i}>
                  <span className={`font-semibold text-sm ${isHost ? 'text-brand' : darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{username}: </span>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{msg.text}</span>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className={`p-3 sm:p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex gap-2 shrink-0`}>
            <input 
              type="text" 
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Type a message..." 
              className={`flex-1 px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-brand ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
            />
            <button type="submit" className="bg-brand text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors shrink-0">
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default ViewStream;
