import React, { useState, useEffect } from 'react';
import { MessageSquare, Heart, Clock, User, Plus, Search, ChevronLeft, Send, Tag } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const Community = () => {
  const { token, user } = useAppContext();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Views: 'list', 'detail', 'new'
  const [view, setView] = useState('list');
  const [activeThreadId, setActiveThreadId] = useState(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch threads on mount
  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    try {
      const res = await fetch('/api/community');
      const data = await res.json();
      setThreads(data);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const filteredThreads = threads.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateThread = async (title, content, tags) => {
    try {
      const res = await fetch('/api/community', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, content, tags })
      });
      if (res.ok) {
        fetchThreads();
        setView('list');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLike = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/community/${id}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setThreads(prev => prev.map(t => t.id === id ? { ...t, likes: data.likes } : t));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto min-h-screen">
      {view === 'list' && (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">Community Forums</h2>
              <p className="text-gray-500 text-lg">Discuss, ask questions, and share resources.</p>
            </div>
            <button 
              onClick={() => setView('new')}
              className="bg-brand text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:bg-indigo-700 hover:-translate-y-0.5 transition-all flex items-center gap-2"
            >
              <Plus size={20} /> New Discussion
            </button>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search discussions by keyword or tag..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-shadow shadow-sm"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">No discussions found</h3>
              <p className="text-gray-500 mb-6">Be the first to start a conversation about this topic!</p>
              <button 
                onClick={() => setView('new')}
                className="text-brand font-bold hover:underline"
              >
                Start a discussion
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredThreads.map(thread => (
                <div 
                  key={thread.id} 
                  onClick={() => { setActiveThreadId(thread.id); setView('detail'); }}
                  className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-brand/30 transition-all cursor-pointer group flex flex-col sm:flex-row gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-brand transition-colors mb-2 truncate">
                      {thread.title}
                    </h3>
                    <p className="text-gray-600 line-clamp-2 text-sm mb-3">
                      {thread.content}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500">
                      <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-full">
                        <User size={14} /> {thread.authorName}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} /> {new Date(Number(thread.createdAt)).toLocaleDateString()}
                      </div>
                      {thread.tags && thread.tags.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Tag size={14} /> 
                          {thread.tags.slice(0, 2).join(', ')}
                          {thread.tags.length > 2 && ' +'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center justify-between sm:justify-center gap-4 border-t sm:border-t-0 sm:border-l border-gray-100 pt-3 sm:pt-0 sm:pl-6 shrink-0">
                    <button 
                      onClick={(e) => handleLike(thread.id, e)}
                      className="flex items-center gap-1.5 text-gray-500 hover:text-red-500 transition-colors bg-gray-50 hover:bg-red-50 px-3 py-1.5 rounded-lg font-bold text-sm"
                    >
                      <Heart size={16} /> {thread.likes}
                    </button>
                    <div className="flex items-center gap-1.5 text-gray-500 font-bold text-sm">
                      <MessageSquare size={16} /> {thread.replyCount}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {view === 'new' && (
        <NewThreadForm 
          onCancel={() => setView('list')} 
          onSubmit={handleCreateThread} 
        />
      )}

      {view === 'detail' && activeThreadId && (
        <ThreadDetail 
          threadId={activeThreadId} 
          onBack={() => setView('list')} 
          token={token} 
          currentUser={user}
        />
      )}
    </div>
  );
};

const NewThreadForm = ({ onCancel, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    onSubmit(title, content, tags);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8 pb-4 border-b border-gray-100">
        <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Start a Discussion</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Title</label>
          <input 
            type="text" 
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g., Best strategies for learning algorithms?"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand focus:border-transparent outline-none bg-gray-50 focus:bg-white transition-all text-gray-900"
            required
            maxLength={120}
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Content</label>
          <textarea 
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Describe your question or share your thoughts in detail..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand focus:border-transparent outline-none bg-gray-50 focus:bg-white transition-all text-gray-900 min-h-[200px] resize-y"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Tags (comma separated)</label>
          <input 
            type="text" 
            value={tagsInput}
            onChange={e => setTagsInput(e.target.value)}
            placeholder="e.g., Computer Science, Algorithms, Tips"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand focus:border-transparent outline-none bg-gray-50 focus:bg-white transition-all text-gray-900"
          />
        </div>
        
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button 
            type="button" 
            onClick={onCancel}
            className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={!title.trim() || !content.trim()}
            className="bg-brand text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-md"
          >
            <Send size={18} /> Post Discussion
          </button>
        </div>
      </form>
    </div>
  );
};

const ThreadDetail = ({ threadId, onBack, token, currentUser }) => {
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    fetchThread();
  }, [threadId]);

  const fetchThread = async () => {
    try {
      const res = await fetch(`/api/community/${threadId}`);
      if (res.ok) {
        setThread(await res.json());
      }
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    try {
      const res = await fetch(`/api/community/${threadId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: replyContent })
      });
      if (res.ok) {
        setReplyContent('');
        fetchThread();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Discussion not found</h2>
        <button onClick={onBack} className="text-brand hover:underline font-semibold">Go back</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-semibold mb-6 transition-colors">
        <ChevronLeft size={20} /> Back to Community
      </button>

      {/* Main Post */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-8">
        <div className="flex flex-wrap gap-2 mb-4">
          {thread.tags && thread.tags.map(tag => (
            <span key={tag} className="px-3 py-1 bg-brand/10 text-brand text-xs font-bold rounded-full">
              {tag}
            </span>
          ))}
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-4 leading-tight">{thread.title}</h1>
        
        <div className="flex items-center gap-4 text-sm text-gray-500 font-medium mb-6 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand to-indigo-400 flex items-center justify-center text-white font-bold text-xs">
              {thread.authorName.charAt(0).toUpperCase()}
            </div>
            <span className="text-gray-900">{thread.authorName}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={16} /> {new Date(Number(thread.createdAt)).toLocaleString()}
          </div>
        </div>

        <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed mb-8 whitespace-pre-wrap">
          {thread.content}
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-gray-50">
          <div className="flex items-center gap-1.5 text-red-500 bg-red-50 px-3 py-1.5 rounded-lg font-bold text-sm">
            <Heart size={18} className="fill-red-500" /> {thread.likes} Likes
          </div>
          <div className="flex items-center gap-1.5 text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg font-bold text-sm">
            <MessageSquare size={18} /> {thread.replies?.length || 0} Replies
          </div>
        </div>
      </div>

      {/* Replies Section */}
      <div className="space-y-6 mb-8">
        <h3 className="text-xl font-bold text-gray-900 pl-2 border-l-4 border-brand">
          Replies ({thread.replies?.length || 0})
        </h3>
        
        {thread.replies && thread.replies.length > 0 ? (
          <div className="space-y-4">
            {thread.replies.map(reply => (
              <div key={reply.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs">
                      {reply.authorName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm">{reply.authorName}</div>
                      <div className="text-xs text-gray-500">{new Date(Number(reply.createdAt)).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
                <div className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed ml-10">
                  {reply.content}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-200 border-dashed">
            <p className="text-gray-500">No replies yet. Be the first to share your thoughts!</p>
          </div>
        )}
      </div>

      {/* Reply Form */}
      <form onSubmit={handleReply} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky bottom-6 sm:bottom-0">
        <label className="block text-sm font-bold text-gray-900 mb-3">Add a Reply</label>
        <textarea 
          value={replyContent}
          onChange={e => setReplyContent(e.target.value)}
          placeholder={currentUser ? "Write your reply here..." : "Please log in to reply."}
          disabled={!currentUser}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand focus:border-transparent outline-none bg-gray-50 focus:bg-white transition-all text-gray-900 min-h-[120px] resize-y mb-4 disabled:opacity-50"
          required
        />
        <div className="flex justify-end">
          <button 
            type="submit"
            disabled={!replyContent.trim() || !currentUser}
            className="bg-brand text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-md"
          >
            <Send size={18} /> Post Reply
          </button>
        </div>
      </form>
    </div>
  );
};

export default Community;
