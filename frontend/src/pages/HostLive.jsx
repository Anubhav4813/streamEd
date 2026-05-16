import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Settings, Video, Mic, Monitor, Send, Maximize, LayoutDashboard, Expand, Shrink, GripHorizontal } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  GridLayout,
  ParticipantTile,
  ControlBar,
  useTracks,
} from '@livekit/components-react';
import { Track, VideoPresets } from 'livekit-client';
import '@livekit/components-styles';

function MyVideoUI() {
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  
  const [pipPos, setPipPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartInfo = useRef({ x: 0, y: 0, startX: 0, startY: 0 });

  const handlePointerDown = (e) => {
    setIsDragging(true);
    dragStartInfo.current = {
      x: e.clientX,
      y: e.clientY,
      startX: pipPos.x,
      startY: pipPos.y,
    };
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartInfo.current.x;
    const dy = e.clientY - dragStartInfo.current.y;
    setPipPos({
      x: dragStartInfo.current.startX + dx,
      y: dragStartInfo.current.startY + dy,
    });
  };

  const handlePointerUp = (e) => {
    if (isDragging) {
      setIsDragging(false);
      e.target.releasePointerCapture(e.pointerId);
    }
  };
  const allTracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );
  const tracks = allTracks.filter(t => t.participant.isLocal || t.publication);

  const screenTracks = tracks.filter((t) => t.source === Track.Source.ScreenShare);
  const cameraTracks = tracks.filter((t) => t.source === Track.Source.Camera);
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
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        {hasScreenShare && (
          <button 
            onClick={() => setFocusMode(!focusMode)}
            className="bg-gray-900/80 hover:bg-gray-900 text-white p-2 rounded-lg backdrop-blur-md transition-all flex items-center gap-2 text-sm shadow-md border border-gray-700"
          >
            {focusMode ? (
              <>
                <LayoutDashboard size={16} /> Grid View
              </>
            ) : (
              <>
                <Maximize size={16} /> Focus Screen
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
              <Shrink size={16} /> Exit Fullscreen
            </>
          ) : (
            <>
              <Expand size={16} /> Fullscreen
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
           {/* Small Camera */}
           <div 
             className="absolute bottom-20 right-4 w-48 lg:w-64 aspect-video bg-black rounded-lg shadow-2xl overflow-hidden border-2 border-gray-700 z-30 flex flex-col"
             style={{ 
               transform: `translate(${pipPos.x}px, ${pipPos.y}px)`,
               transition: isDragging ? 'none' : 'transform 0.1s ease',
             }}
           >
             <div 
               className="h-6 bg-gray-800 hover:bg-gray-700 flex items-center justify-center cursor-move touch-none"
               onPointerDown={handlePointerDown}
               onPointerMove={handlePointerMove}
               onPointerUp={handlePointerUp}
               onPointerCancel={handlePointerUp}
               title="Drag to move"
             >
               <GripHorizontal size={14} className="text-gray-400" />
             </div>
             <div className="flex-1 min-h-0 pointer-events-none">
               <GridLayout tracks={cameraTracks} style={{ height: '100%', width: '100%' }}>
                 <ParticipantTile />
               </GridLayout>
             </div>
           </div>
        </div>
      ) : (
        <GridLayout tracks={tracks} style={{ flex: 1, minHeight: 0 }}>
          <ParticipantTile />
        </GridLayout>
      )}

      <ControlBar 
        controls={{ microphone: true, camera: true, screenShare: true, leave: false, chat: false }} 
      />
    </div>
  );
}

const socket = io(window.location.origin, { autoConnect: false });

const HostLive = () => {
  const [isLive, setIsLive] = useState(false);
  const [roomToken, setRoomToken] = useState('');
  const [liveKitUrl, setLiveKitUrl] = useState('');
  
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const { darkMode, user, token } = useAppContext();
  
  // Use a stable, unique room name for this user's stream
  const myRoomName = user ? `stream-${user.username.replace(/[^a-zA-Z0-9]/g, '')}-${user.id.substring(0,6)}` : 'streamed-session-1';

  useEffect(() => {
    if (token) {
      socket.auth = { token };
      socket.connect();
    }
    
    socket.emit('chat:join', { roomName: myRoomName, isHost: true }, (res) => {
      if (res?.ok) {
        setMessages(res.history);
      }
    });

    const handleNewMessage = (message) => {
      setMessages((prev) => {
        // Prevent duplicate messages if we already added it (not doing optimistic UI for now, but good practice)
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    };

    socket.on('chat:new', handleNewMessage);

    return () => {
      socket.off('chat:new', handleNewMessage);
      socket.disconnect();
    };
  }, [myRoomName, token]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (chatMessage.trim()) {
      socket.emit('chat:send', { roomName: myRoomName, text: chatMessage }, (res) => {
        if (!res?.ok) {
          console.error(res?.error);
        }
      });
      setChatMessage('');
    }
  };

  const handleGoLive = async () => {
    try {
      const res = await fetch('/live/token', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ roomName: myRoomName, role: 'host' })
      });
      const data = await res.json();
      if (data.token && data.livekitUrl) {
        setRoomToken(data.token);
        setLiveKitUrl(data.livekitUrl);
        setIsLive(true);
      } else {
        console.error('Failed to get token:', data);
        alert('Could not fetch LiveKit token. Check server console.');
      }
    } catch (err) {
      console.error(err);
      alert('Error communicating with backend.');
    }
  };

  const handleEndStream = () => {
    setIsLive(false);
    setRoomToken('');
    setLiveKitUrl('');
  };

  return (
    <div className={`p-6 lg:p-8 max-w-7xl mx-auto flex flex-col h-[calc(100vh-100px)] ${darkMode ? 'text-white' : ''}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Host Live Studio</h2>
        {isLive ? (
           <button onClick={handleEndStream} className="bg-red-500 text-white px-6 py-2 rounded-lg font-bold shadow-sm hover:bg-red-600 animate-pulse">End Stream</button>
        ) : (
           <button onClick={handleGoLive} className="bg-brand-green text-white px-6 py-2 rounded-lg font-bold shadow-sm hover:bg-emerald-600">Go Live Now</button>
        )}
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
        {/* Video Player */}
        <div className="flex-1 bg-black rounded-2xl overflow-hidden relative shadow-lg flex items-center justify-center border-4 border-gray-800 min-h-[300px]">
          {isLive && roomToken && liveKitUrl ? (
            <LiveKitRoom
              video={true}
              audio={true}
              token={roomToken}
              serverUrl={liveKitUrl}
              connect={true}
              data-lk-theme="default"
              style={{ height: '100%', width: '100%' }}
              options={{
                publishDefaults: {
                  videoSimulcastLayers: [VideoPresets.h720, VideoPresets.h1080, VideoPresets.h1440],
                  screenShareSimulcastLayers: [VideoPresets.h720, VideoPresets.h1080, VideoPresets.h1440],
                  videoEncoding: {
                    maxBitrate: 3000000,
                    maxFramerate: 30,
                  }
                },
                screenShareCaptureDefaults: {
                  resolution: VideoPresets.h1440.resolution,
                },
                videoCaptureDefaults: {
                  resolution: VideoPresets.h1440.resolution,
                }
              }}
            >
              <MyVideoUI />
              <RoomAudioRenderer />
            </LiveKitRoom>
          ) : (
            <div className="text-gray-500 text-center">
              <Video size={48} className="mx-auto mb-4" />
              <p className="text-xl font-medium">Camera Preview</p>
              <p className="text-sm">Click 'Go Live Now' to connect to LiveKit</p>
            </div>
          )}

          {/* Fallback mock overlay if not live */}
          {!isLive && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-gray-900/80 backdrop-blur-md px-6 py-3 rounded-full flex gap-4">
                <button className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"><Mic size={20}/></button>
                <button className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"><Video size={20}/></button>
                <button className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"><Monitor size={20}/></button>
                <button className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"><Settings size={20}/></button>
            </div>
          )}
        </div>

        {/* Chat Window */}
        <div className={`w-full lg:w-80 flex flex-col rounded-2xl shadow-sm border h-[400px] lg:h-auto ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} font-bold`}>
            Live Chat
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
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
          </div>

          <form onSubmit={handleSendMessage} className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex gap-2`}>
            <input 
              type="text" 
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Type a message..." 
              className={`flex-1 px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-brand ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
            />
            <button type="submit" className="bg-brand text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors">
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default HostLive;
