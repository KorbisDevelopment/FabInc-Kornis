import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, doc, getDoc } from 'firebase/firestore';
import { Message, Telemetry, CameraFeed } from '../types';
import LiveFeed from './LiveFeed';

export default function Cockpit() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [telemetry, setTelemetry] = useState<Telemetry>({ rpm: 12450, temp: 68.2 });
  const [projectId, setProjectId] = useState<string | null>(null);
  const [userName, setUserName] = useState('OPERATOR');
  const [showSettings, setShowSettings] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/');
      return;
    }
    // ... profile fetch ...

    const fetchProfile = async () => {
      const docRef = doc(db, 'users', user.uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setProjectId(data.projectId);
        setUserName(user.displayName || 'OPERATOR');
      }
    };
    fetchProfile();
  }, [navigate]);

  useEffect(() => {
    if (!projectId) return;

    const msgQuery = query(
      collection(db, 'projects', projectId, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(msgQuery, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Message));
      setMessages(msgs);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `projects/${projectId}/messages`));

    const telUnsub = onSnapshot(doc(db, 'projects', projectId, 'telemetry', projectId), (snap) => {
      if (snap.exists()) {
        setTelemetry(snap.data() as Telemetry);
      }
    });

    return () => {
      unsubscribe();
      telUnsub();
    };
  }, [projectId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !projectId) return;

    try {
      await addDoc(collection(db, 'projects', projectId, 'messages'), {
        projectId,
        sender: userName,
        text: newMessage,
        timestamp: Date.now()
      });
      setNewMessage('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `projects/${projectId}/messages`);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden font-mono bg-surface-dark text-on-surface">
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-surface-container-highest border-2 border-primary-cyan p-8 shadow-[0_0_50px_rgba(0,229,255,0.2)]"
          >
            <div className="flex justify-between items-center mb-8 border-b border-primary-cyan/30 pb-4">
              <h2 className="text-xl font-black text-primary-cyan uppercase tracking-tighter">Terminal_Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-primary-cyan hover:rotate-90 transition-transform cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Active_Operator</label>
                <div className="p-4 bg-surface-container-lowest border border-outline-variant text-primary-cyan font-bold">{userName}</div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">System_Diagnostics</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-surface-container-lowest border border-outline-variant flex flex-col">
                    <span className="text-[8px] text-on-surface-variant">UPLINK_LATENCY</span>
                    <span className="text-sm font-bold text-primary-cyan">14ms</span>
                  </div>
                  <div className="p-3 bg-surface-container-lowest border border-outline-variant flex flex-col">
                    <span className="text-[8px] text-on-surface-variant">PACKET_LOSS</span>
                    <span className="text-sm font-bold text-primary-cyan">0.02%</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <button 
                  onClick={() => {
                    auth.signOut();
                    navigate('/');
                  }}
                  className="w-full py-4 bg-error-red text-surface-dark font-bold uppercase text-xs tracking-widest hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                >
                  Terminate Session (Logout)
                </button>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="w-full py-4 border-2 border-primary-cyan text-primary-cyan font-bold uppercase text-xs tracking-widest hover:bg-primary-cyan/10 active:scale-95 transition-all cursor-pointer"
                >
                  Return to Cockpit
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Top Bar */}
      <header className="bg-surface-container-lowest text-primary-cyan border-b-2 border-outline-variant flex justify-between items-center px-4 md:px-8 py-4 w-full z-10">
        <div className="flex items-center gap-4 cursor-pointer hover:opacity-80" onClick={() => navigate('/')}>
          <span className="material-symbols-outlined text-primary-cyan">precision_manufacturing</span>
          <h1 className="text-xl font-extrabold tracking-tighter text-primary-cyan">FAB_INC</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex gap-8">
            <span className="text-primary-cyan border-b-2 border-primary-cyan text-xs font-bold cursor-pointer hover:brightness-110">COCKPIT</span>
            <span className="text-on-surface-variant text-xs font-bold cursor-pointer hover:bg-surface-container-high px-2 py-1 transition-colors hover:text-primary-cyan" onClick={() => navigate('/dashboard')}>SUPPORT</span>
            <span className="text-on-surface-variant text-xs font-bold cursor-pointer hover:bg-surface-container-high px-2 py-1 transition-colors hover:text-primary-cyan" onClick={() => navigate('/board')}>ADVICE</span>
          </div>
          <button 
            className="active:translate-y-0.5 transition-transform hover:rotate-12 cursor-pointer"
            onClick={() => setShowSettings(true)}
          >
            <span className="material-symbols-outlined text-primary-cyan">settings</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col h-full py-8 w-80 border-r-2 border-outline-variant bg-surface-container-low shrink-0">
          <div className="px-6 mb-8 flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-cyan flex items-center justify-center border-2 border-on-primary-cyan">
              <span className="material-symbols-outlined text-on-primary-cyan">person</span>
            </div>
            <div>
              <p className="text-sm font-medium text-primary-cyan uppercase truncate max-w-[160px]">{userName}</p>
              <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest">Operator Level 1</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 bg-primary-cyan rounded-full animate-pulse"></span>
                <span className="text-[10px] text-primary-cyan font-bold uppercase">Online</span>
              </div>
            </div>
          </div>
          
          <nav className="flex flex-col">
            <div className="bg-surface-container-highest text-primary-cyan border-l-4 border-primary-cyan px-6 py-4 flex items-center gap-4 text-sm font-medium uppercase transition-colors cursor-pointer hover:bg-primary-cyan/10">
              <span className="material-symbols-outlined">dashboard</span>
              Dashboard
            </div>
            <div 
              className="text-on-surface-variant px-6 py-4 flex items-center gap-4 text-sm font-medium uppercase hover:bg-surface-container-high hover:text-primary-cyan cursor-pointer transition-colors"
              onClick={() => navigate('/camera/phone-main')}
            >
              <span className="material-symbols-outlined">sensors</span>
              Live_Streams
            </div>
          </nav>

          <div className="mt-auto px-6">
            <button className="w-full bg-primary-cyan text-on-primary-cyan text-xs font-bold py-4 px-4 flex items-center justify-center gap-2 border-b-4 border-outline-variant hover:brightness-110 active:scale-[0.98] transition-all uppercase cursor-pointer">
              <span className="material-symbols-outlined">upload_file</span>
              Upload Reference Doc
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 bg-surface-container-lowest relative">
          <section className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <span className="bg-primary-cyan px-3 py-1 text-on-primary-cyan text-[10px] font-bold uppercase">Live</span>
                <span className="bg-surface-container-highest px-3 py-1 text-on-surface text-[10px] font-bold border border-outline-variant uppercase">Phone_Cam_Main</span>
              </div>
              <div className="flex gap-4 text-xs font-medium text-primary-cyan">
                <span>LATENCY: 42MS</span>
                <span>RES: 4K/60FPS</span>
              </div>
            </div>
            
            <div className="flex-1 relative overflow-hidden group border-2 border-outline-variant">
              <LiveFeed streamUrl={`/api/streams/phone-main/index.m3u8`} className="w-full h-full" />
              
              {/* Telemetry Overlay */}
              <div className="absolute top-1/2 left-8 -translate-y-1/2 flex flex-col gap-4 z-20">
                <div className="bg-surface-container-lowest/80 border border-primary-cyan/30 p-2 backdrop-blur-sm">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase">RPM</p>
                  <p className="text-xl font-bold text-primary-cyan">{telemetry.rpm.toLocaleString()}</p>
                </div>
                <div className="bg-surface-container-lowest/80 border border-primary-cyan/30 p-2 backdrop-blur-sm">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase">TEMP</p>
                  <p className="text-xl font-bold text-on-surface">{telemetry.temp.toFixed(1)}°C</p>
                </div>
              </div>
            </div>
          </section>

          {/* Bottom Panel */}
          <section className="h-1/3 md:h-1/4 border-t-2 border-outline-variant bg-surface-container-low flex divide-x divide-outline-variant">
            <div className="flex-1 flex flex-col min-w-0">
              <div className="bg-surface-container-highest px-4 py-2 flex justify-between items-center border-b border-outline-variant">
                <span className="text-[10px] font-bold text-primary-cyan flex items-center gap-2 uppercase tracking-widest">
                  <span className="material-symbols-outlined text-sm">forum</span>
                  Expert_Advice_Channel
                </span>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">3 Active Collaborators</span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm bg-surface-container-lowest/30">
                {messages.length > 0 ? (
                  messages.map(msg => (
                    <div key={msg.id} className="flex gap-4">
                      <div className="text-primary-cyan shrink-0 font-bold">
                        [{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}] {msg.sender}:
                      </div>
                      <div className="text-on-surface">{msg.text}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-on-surface-variant opacity-40 italic text-xs uppercase tracking-widest h-full flex items-center justify-center">Waiting for communications...</div>
                )}
              </div>

              <form onSubmit={sendMessage} className="p-2 border-t border-outline-variant flex gap-2">
                <input 
                  className="flex-1 bg-surface-container-lowest border border-outline-variant px-4 py-2 text-sm text-on-surface focus:border-primary-cyan outline-none placeholder:text-outline-variant uppercase font-mono" 
                  placeholder="Enter command or message..." 
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  autoComplete="off"
                />
                <button className="bg-primary-cyan px-6 py-2 text-on-primary-cyan text-xs font-bold border-b-2 border-on-primary-cyan active:translate-y-0.5 uppercase hover:brightness-110 cursor-pointer">Send</button>
              </form>
            </div>

            <div className="hidden lg:flex w-64 flex-col p-4 gap-4 bg-surface-container overflow-y-auto">
              <h3 className="text-[10px] font-bold text-on-surface-variant border-b border-outline-variant pb-2 uppercase tracking-widest">Critical_Tasks</h3>
              <div className="space-y-3">
                <TaskItem label="Verify lubricant pressure" completed={false} />
                <TaskItem label="Calibrate Axis Z-01" completed={false} />
                <TaskItem label="Initialization Seq" completed={true} />
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 bg-surface-container-highest border-t-2 border-outline-variant px-2 pb-2">
        <NavButton icon="videocam" label="COCKPIT" active onClick={() => navigate('/cockpit')} />
        <NavButton icon="support_agent" label="SUPPORT" onClick={() => navigate('/dashboard')} />
        <NavButton icon="assignment" label="ADVICE" onClick={() => navigate('/board')} />
        <NavButton icon="router" label="SETUP" onClick={() => navigate('/camera/phone-main')} />
      </nav>
    </div>
  );
}

function TaskItem({ label, completed }: { label: string, completed: boolean }) {
  return (
    <div className={`flex items-center gap-3 cursor-pointer hover:bg-surface-container-high p-1 -m-1 transition-colors ${completed ? 'opacity-40' : ''}`}>
      <span className="material-symbols-outlined text-primary-cyan text-xl">
        {completed ? 'check_box' : 'check_box_outline_blank'}
      </span>
      <span className={`text-xs uppercase font-medium ${completed ? 'line-through' : ''}`}>{label}</span>
    </div>
  );
}

function NavButton({ icon, label, active = false, onClick }: { icon: string, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center px-4 py-2 transition-all active:scale-95 cursor-pointer rounded-lg ${active ? 'bg-primary-cyan text-on-primary-cyan font-bold border-b-2 border-on-primary-cyan' : 'text-on-surface-variant opacity-70 hover:opacity-100 hover:bg-surface-container-high'}`}
    >
      <span className="material-symbols-outlined">{icon}</span>
      <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
    </button>
  );
}
