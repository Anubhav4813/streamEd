import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { 
  Settings, Video, Mic, MicOff, VideoOff, Monitor, Send, Maximize, 
  LayoutDashboard, Expand, Shrink, GripHorizontal, MessageSquare,
  Radio, Users, Activity, Play, Square, ShieldAlert
} from 'lucide-react';
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

function CameraPreview() {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
        setStream(s);
      } catch (err) {
        console.error("Failed to access camera", err);
      }
    };
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const toggleMic = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !micEnabled;
      });
      setMicEnabled(!micEnabled);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = !videoEnabled;
      });
      setVideoEnabled(!videoEnabled);
    }
  };

  return (
    <div className="w-full h-full relative bg-black group">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover transition-all duration-500 ${videoEnabled ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
        style={{ transform: 'scaleX(-1)' }}
      />
      
      {!videoEnabled && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
          <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center mb-4 ring-4 ring-gray-800/50">
            <VideoOff size={40} className="text-gray-500" />
          </div>
          <p className="text-gray-400 font-medium">Camera is disabled</p>
        </div>
      )}

      {/* Overlays */}
      <div className="absolute top-4 left-4 flex gap-2">
         <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg flex items-center gap-2 border border-white/10">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
            <span className="text-xs font-bold text-white tracking-wider uppercase">Preview Mode</span>
         </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-gray-900/90 backdrop-blur-xl px-6 py-4 rounded-2xl border border-white/10 shadow-2xl opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
        <button 
            onClick={toggleMic} 
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${micEnabled ? 'hover:bg-white/10 text-gray-200' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
        >
            {micEnabled ? <Mic size={24} /> : <MicOff size={24} />}
            <span className="text-[10px] font-bold uppercase tracking-wider">{micEnabled ? 'Mic On' : 'Mic Off'}</span>
        </button>
        <div className="w-px h-10 bg-white/10"></div>
        <button 
            onClick={toggleVideo} 
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${videoEnabled ? 'hover:bg-white/10 text-gray-200' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
        >
            {videoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
            <span className="text-[10px] font-bold uppercase tracking-wider">{videoEnabled ? 'Cam On' : 'Cam Off'}</span>
        </button>
      </div>
    </div>
  );
}

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
      <div className="absolute top-2 right-2 lg:top-4 lg:right-4 z-20 flex gap-2">
        {hasScreenShare && (
          <button 
            onClick={() => setFocusMode(!focusMode)}
            className="bg-black/60 hover:bg-black/80 text-white p-2.5 rounded-xl backdrop-blur-md transition-all flex items-center gap-2 text-sm shadow-md border border-white/10"
          >
            {focusMode ? (
              <>
                <LayoutDashboard size={16} /> <span className="hidden sm:inline font-bold uppercase tracking-wider text-[10px]">Grid View</span>
              </>
            ) : (
              <>
                <Maximize size={16} /> <span className="hidden sm:inline font-bold uppercase tracking-wider text-[10px]">Focus Screen</span>
              </>
            )}
          </button>
        )}
        <button 
          onClick={toggleFullscreen}
          className="bg-black/60 hover:bg-black/80 text-white p-2.5 rounded-xl backdrop-blur-md transition-all flex items-center gap-2 text-sm shadow-md border border-white/10"
        >
          {isFullscreen ? (
            <>
              <Shrink size={16} /> <span className="hidden sm:inline font-bold uppercase tracking-wider text-[10px]">Exit Full</span>
            </>
          ) : (
            <>
              <Expand size={16} /> <span className="hidden sm:inline font-bold uppercase tracking-wider text-[10px]">Fullscreen</span>
            </>
          )}
        </button>
      </div>

      {focusMode && hasScreenShare ? (
        <div className="flex-1 flex min-h-0 relative bg-gray-950">
           {/* Big Screen Share */}
           <div className="flex-1 h-full w-full">
             <GridLayout tracks={screenTracks} style={{ height: '100%', width: '100%' }}>
               <ParticipantTile />
             </GridLayout>
           </div>
           {/* Small Camera */}
           <div 
             className="absolute bottom-20 right-4 w-32 sm:w-48 lg:w-64 aspect-video bg-black rounded-xl shadow-2xl overflow-hidden border border-white/20 z-30 flex flex-col"
             style={{ 
               transform: `translate(${pipPos.x}px, ${pipPos.y}px)`,
               transition: isDragging ? 'none' : 'transform 0.1s ease',
             }}
           >
             <div 
               className="h-6 bg-gray-900 hover:bg-gray-800 flex items-center justify-center cursor-move touch-none transition-colors"
               onPointerDown={handlePointerDown}
               onPointerMove={handlePointerMove}
               onPointerUp={handlePointerUp}
               onPointerCancel={handlePointerUp}
               title="Drag to move"
             >
               <GripHorizontal size={14} className="text-gray-500" />
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
        className="lk-control-bar custom-lk-bar"
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
  const [mobileTab, setMobileTab] = useState('video'); // 'video' or 'chat'
  const { user, token } = useAppContext();
  const chatEndRef = useRef(null);
  
  // Use a stable, unique room name for this user's stream
  const myRoomName = user ? `stream-${user.username.replace(/[^a-zA-Z0-9]/g, '')}-${user.id.substring(0,6)}` : 'streamed-session-1';

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, mobileTab]);

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
    <div className="flex flex-col lg:flex-row h-[calc(100vh-73px)] lg:h-[calc(100vh-80px)] bg-[#0B0E14] text-gray-100 overflow-hidden font-sans relative">
      
      {/* Left Panel: Stream Settings (Hidden on Mobile) */}
      <div className="hidden xl:flex flex-col w-80 bg-[#12161F] border-r border-gray-800/80 p-6 overflow-y-auto">
        <div className="mb-8">
          <h2 className="text-xl font-extrabold text-white mb-2 flex items-center gap-2 tracking-tight">
            <Radio size={20} className="text-brand" /> 
            Stream Setup
          </h2>
          <p className="text-sm text-gray-400 leading-relaxed">Configure your broadcast details before going live to the world.</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Stream Title</label>
            <input type="text" defaultValue={`${user?.username || 'Host'}'s Live Session`} className="w-full bg-[#0B0E14] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-inner" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Subject Category</label>
            <select className="w-full bg-[#0B0E14] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand appearance-none shadow-inner">
              <option>Engineering & CS</option>
              <option>Mathematics</option>
              <option>Science</option>
              <option>Languages</option>
              <option>Arts & Design</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tags</label>
            <input type="text" placeholder="e.g. React, Exam Prep" className="w-full bg-[#0B0E14] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-inner" />
          </div>
        </div>

        <div className="mt-auto pt-8">
          <div className="bg-brand/10 border border-brand/20 rounded-2xl p-5">
            <h4 className="flex items-center gap-2 text-sm font-bold text-brand mb-3"><ShieldAlert size={16} /> Stream Rules</h4>
            <ul className="text-xs text-brand/80 space-y-2 list-disc list-inside font-medium">
              <li>No inappropriate content.</li>
              <li>Be respectful in chat.</li>
              <li>Protect your personal info.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Main Center Stage */}
      <div className={`flex-1 flex flex-col min-w-0 relative bg-[#0B0E14] ${mobileTab === 'chat' ? 'hidden lg:flex' : 'flex'}`}>
        
        {/* Top Control Bar */}
        <div className="h-16 lg:h-20 px-4 sm:px-6 flex items-center justify-between border-b border-gray-800/80 bg-[#12161F]/80 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-4">
            {isLive ? (
              <div className="flex items-center gap-3">
                <div className="bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                  <span className="text-red-500 font-bold text-sm tracking-wider uppercase">LIVE</span>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-gray-400 text-sm font-medium bg-[#0B0E14] px-3 py-1.5 rounded-lg border border-gray-800">
                  <Activity size={16} className="text-emerald-500" /> <span className="text-gray-300">Excellent Connection</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-400 font-medium bg-[#1A1F2B] px-4 py-2 rounded-lg border border-gray-800 text-sm">
                <span className="w-2.5 h-2.5 bg-gray-600 rounded-full"></span>
                Studio Offline
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isLive ? (
              <button onClick={handleEndStream} className="bg-red-500 hover:bg-red-600 text-white px-5 lg:px-6 py-2 lg:py-2.5 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:shadow-[0_0_25px_rgba(239,68,68,0.4)] flex items-center gap-2 text-sm lg:text-base">
                <Square size={16} className="fill-white" /> <span className="hidden sm:inline">End Stream</span><span className="sm:hidden">End</span>
              </button>
            ) : (
              <button onClick={handleGoLive} className="bg-brand hover:bg-indigo-500 text-white px-5 lg:px-6 py-2 lg:py-2.5 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] flex items-center gap-2 text-sm lg:text-base active:scale-95">
                <Play size={16} className="fill-white" /> <span className="hidden sm:inline">Go Live Now</span><span className="sm:hidden">Go Live</span>
              </button>
            )}
          </div>
        </div>

        {/* Video Area */}
        <div className="flex-1 p-2 sm:p-4 lg:p-6 flex items-center justify-center relative overflow-hidden bg-[#0B0E14]">
          <div className={`w-full h-full rounded-2xl overflow-hidden ring-1 ring-gray-800 shadow-2xl relative bg-black transition-all duration-500 ${isLive ? 'shadow-[0_0_40px_rgba(99,102,241,0.1)] ring-brand/30' : ''}`}>
            {isLive && roomToken && liveKitUrl ? (
              <LiveKitRoom
                video={true}
                audio={true}
                token={roomToken}
                serverUrl={liveKitUrl}
                connect={true}
                data-lk-theme="default"
                style={{ height: '100%', width: '100%', backgroundColor: 'black' }}
                options={{
                  publishDefaults: {
                    videoSimulcastLayers: [VideoPresets.h720, VideoPresets.h1080],
                    screenShareSimulcastLayers: [VideoPresets.h720, VideoPresets.h1080],
                  },
                }}
              >
                <MyVideoUI />
                <RoomAudioRenderer />
              </LiveKitRoom>
            ) : (
              <CameraPreview />
            )}
          </div>
        </div>

      </div>

      {/* Right Sidebar: Chat */}
      <div className={`w-full lg:w-[350px] bg-[#12161F] border-l border-gray-800/80 flex flex-col h-full z-20 ${mobileTab === 'video' ? 'hidden lg:flex' : 'flex'}`}>
         <div className="h-16 lg:h-20 flex items-center justify-between px-6 border-b border-gray-800/80 shrink-0 bg-[#12161F]/80 backdrop-blur-md">
            <h3 className="font-bold flex items-center gap-2 text-white text-lg tracking-tight">
               <MessageSquare size={20} className="text-gray-400" /> Live Chat
            </h3>
            {isLive && (
               <div className="flex items-center gap-1.5 text-xs font-bold text-gray-300 bg-[#0B0E14] px-2.5 py-1.5 rounded-lg border border-gray-800 shadow-inner">
                  <Users size={14} className="text-brand" /> {messages.length > 0 ? messages.length + 1 : 1}
               </div>
            )}
         </div>

         <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar bg-[#0B0E14]/30">
            {messages.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <div className="w-16 h-16 rounded-2xl bg-gray-800/50 flex items-center justify-center mb-4 border border-gray-700">
                     <MessageSquare size={24} className="text-gray-500" />
                  </div>
                  <p className="text-gray-300 font-semibold text-sm">Welcome to the live chat!</p>
                  <p className="text-gray-500 text-xs mt-1.5 leading-relaxed">Messages will appear here once you go live and viewers join.</p>
               </div>
            ) : (
               messages.map((msg, i) => {
                  const username = msg.user || msg.senderName || 'Unknown';
                  const isHost = username.includes('Host') || username === (user?.username || 'Host');
                  return (
                     <div key={msg.id || i} className="group hover:bg-white/[0.03] p-2 -mx-2 rounded-lg transition-colors">
                        <div className="flex items-baseline gap-2 mb-0.5">
                           <span className={`font-bold text-sm ${isHost ? 'text-brand' : 'text-emerald-400'}`}>
                              {username}
                              {isHost && <span className="ml-2 text-[9px] bg-brand/20 text-brand px-1.5 py-0.5 rounded uppercase tracking-wider font-extrabold border border-brand/20">Host</span>}
                           </span>
                           <span className="text-xs text-gray-600 font-medium">
                              {new Date(msg.ts).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                           </span>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed break-words">{msg.text}</p>
                     </div>
                  );
               })
            )}
            <div ref={chatEndRef} />
         </div>

         <div className="p-4 bg-[#12161F] border-t border-gray-800/80 shrink-0 pb-20 lg:pb-4">
            <form onSubmit={handleSendMessage} className="relative">
               <input 
                  type="text" 
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Send a message..." 
                  className="w-full bg-[#0B0E14] border border-gray-700 text-white text-sm rounded-xl pl-4 pr-12 py-3.5 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand placeholder-gray-500 transition-all shadow-inner"
               />
               <button 
                  type="submit" 
                  disabled={!chatMessage.trim()}
                  className="absolute right-2 top-2 bottom-2 bg-brand hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-500 text-white w-10 flex items-center justify-center rounded-lg transition-colors"
               >
                  <Send size={16} className={chatMessage.trim() ? "translate-x-0.5" : ""} />
               </button>
            </form>
         </div>
      </div>

      {/* Mobile Nav Tabs */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#12161F]/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-1.5 flex gap-1 z-50 shadow-2xl">
        <button onClick={() => setMobileTab('video')} className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${mobileTab==='video' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}><Video size={16}/> Stream</button>
        <button onClick={() => setMobileTab('chat')} className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all relative ${mobileTab==='chat' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}>
          <MessageSquare size={16}/> Chat
          {mobileTab !== 'chat' && messages.length > 0 && (
             <span className="absolute top-2 right-3 w-2 h-2 bg-brand rounded-full animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span>
          )}
        </button>
      </div>

    </div>
  );
};

export default HostLive;
