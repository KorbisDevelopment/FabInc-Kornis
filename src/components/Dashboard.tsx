import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, doc, getDoc, where } from 'firebase/firestore';
import { Message, CameraFeed } from '../types';

export default function Dashboard() {
  const [activeCalls, setActiveCalls] = useState<CameraFeed[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [userName, setUserName] = useState('EXPERT');
  const [adviceText, setAdviceText] = useState('');
  const [postingAdvice, setPostingAdvice] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/');
      return;
    }

    const fetchProfile = async () => {
      const docRef = doc(db, 'users', user.uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setProjectId(data.projectId);
        setUserName(user.displayName || 'EXPERT');
      }
    };
    fetchProfile();
  }, [navigate]);

  useEffect(() => {
    if (!projectId) return;

    const camQuery = query(
      collection(db, 'projects', projectId, 'cameras')
    );

    const unsubscribe = onSnapshot(camQuery, (snapshot) => {
      const cams = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CameraFeed));
      setActiveCalls(cams.length > 0 ? cams : [
        { id: '1', label: 'Site 7 - Jim (Welding Bay)', streamId: 'phone-main', isOnline: true, isCritical: true, location: 'BAY 7' },
        { id: '2', label: 'Site 12 - Heavy Fab (Main)', streamId: 'cam-a', isOnline: true, isCritical: false, location: 'SITE 12' },
        { id: '3', label: 'Site 3 - QA Inspection (Offline)', streamId: 'cam-d', isOnline: false, isCritical: false, location: 'SITE 3' }
      ]);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `projects/${projectId}/cameras`));

    return () => unsubscribe();
  }, [projectId]);

  const postAdvice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adviceText.trim() || !projectId) return;
    setPostingAdvice(true);

    try {
      await addDoc(collection(db, 'projects', projectId, 'advice'), {
        projectId,
        identifier: `ADV-${Math.floor(Math.random() * 1000)}`,
        text: adviceText,
        importance: 'normal',
        createdAt: Date.now()
      });
      setAdviceText('');
      alert("Advice posted to Site Board");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `projects/${projectId}/advice`);
    } finally {
      setPostingAdvice(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen font-mono bg-surface-dark text-on-surface">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col h-screen py-8 bg-surface-container border-r-2 border-outline-variant w-80 shrink-0 sticky top-0">
        <div className="px-6 mb-10 flex flex-col items-start cursor-pointer group" onClick={() => navigate('/')}>
          <div className="w-16 h-16 bg-surface-container-highest border-2 border-outline-variant flex items-center justify-center mb-4 group-hover:border-primary-cyan transition-colors">
            <span className="material-symbols-outlined text-primary-cyan text-4xl">precision_manufacturing</span>
          </div>
          <h2 className="text-xl font-bold text-primary-cyan uppercase truncate w-full">{userName}</h2>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Expert Level 3</p>
          <div className="mt-4 inline-flex items-center gap-2 px-2 py-1 bg-primary-cyan/10 border border-primary-cyan/30">
            <span className="w-2 h-2 bg-primary-cyan rounded-full animate-pulse"></span>
            <span className="text-[10px] font-bold text-primary-cyan uppercase">Online</span>
          </div>
        </div>

        <nav className="flex flex-col flex-grow">
          <SidebarItem icon="dashboard" label="DASHBOARD" active onClick={() => navigate('/dashboard')} />
          <SidebarItem icon="sensors" label="LIVE_STREAMS" onClick={() => navigate('/cockpit')} />
          <SidebarItem icon="assignment" label="SITE_BOARD" onClick={() => navigate('/board')} />
          <SidebarItem icon="folder_open" label="FILE_VAULT" />
          <SidebarItem icon="terminal" label="LOGS" />
        </nav>
      </aside>

      <div className="flex-grow flex flex-col">
        {/* Top Bar */}
        <header className="flex justify-between items-center px-4 md:px-8 py-4 w-full bg-background border-b-2 border-outline-variant">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-primary-cyan text-2xl">precision_manufacturing</span>
            <h1 className="text-lg md:text-xl font-extrabold tracking-tighter text-primary-cyan">FAB_INC_OPERATIONS</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-surface-container-high transition-colors text-on-surface-variant active:translate-y-0.5 cursor-pointer">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="p-2 hover:bg-surface-container-high transition-colors text-primary-cyan active:translate-y-0.5 cursor-pointer">
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow p-4 md:p-8 bg-background">
          <div className="max-w-[1440px] mx-auto space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard label="Active Channels" value={(activeCalls.length).toString().padStart(2, '0')} color="primary-cyan" />
              <StatCard label="Critical Alerts" value="02" color="error-red" />
              <StatCard label="System Load" value="42%" color="primary-cyan" opacity />
            </div>

            {/* Quick Advice Bar */}
            <div className="bg-surface-container p-6 border-l-4 border-primary-cyan shadow-lg">
              <h3 className="text-[10px] font-bold text-primary-cyan uppercase tracking-widest mb-4">Post_Site_Advice_Transmit</h3>
              <form onSubmit={postAdvice} className="flex gap-4">
                <input 
                  className="flex-1 bg-surface-container-lowest border border-outline-variant px-4 py-3 text-sm focus:border-primary-cyan outline-none placeholder:opacity-30 uppercase font-mono" 
                  placeholder="Type instruction for the labor board..."
                  value={adviceText}
                  onChange={(e) => setAdviceText(e.target.value)}
                />
                <button 
                  disabled={postingAdvice}
                  className="bg-primary-cyan text-on-primary-cyan px-8 py-3 font-bold text-xs uppercase cursor-pointer hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all border-b-4 border-on-primary-cyan"
                >
                  {postingAdvice ? 'Transmitting...' : 'Transmit'}
                </button>
              </form>
            </div>

            {/* Grid */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-outline-variant pb-2">
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary-cyan">broadcast_on_home</span>
                  ACTIVE JOBSITE CALLS
                </h2>
                <div className="flex gap-2">
                  <span className="text-[10px] font-bold px-3 py-1 bg-surface-container-highest border border-outline-variant text-primary-cyan cursor-pointer">GRID_VIEW</span>
                  <span className="text-[10px] font-bold px-3 py-1 text-on-surface-variant border border-outline-variant opacity-50 cursor-pointer hover:opacity-100">LIST_VIEW</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {activeCalls.map(call => (
                  <CallCard key={call.id} call={call} onJoin={() => navigate('/cockpit')} />
                ))}
              </div>
            </div>

            {/* Logs Placeholder */}
            <div className="bg-surface-container border border-outline-variant overflow-hidden">
              <div className="p-4 bg-surface-container-high border-b border-outline-variant flex justify-between items-center">
                <h3 className="text-[10px] font-bold text-primary-cyan uppercase tracking-widest">Operation_Log_Dump_001</h3>
                <span className="material-symbols-outlined text-xs text-on-surface-variant cursor-pointer hover:text-white">download</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px] font-mono">
                  <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant uppercase border-b border-outline-variant">
                      <th className="p-3 border-r border-outline-variant">Timestamp</th>
                      <th className="p-3 border-r border-outline-variant">Event_ID</th>
                      <th className="p-3 border-r border-outline-variant">Node</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    <LogRow time="08:42:12" id="EVT_9921" node="S7_WELD" action="ARC_VOLTAGE_SPIKE" />
                    <LogRow time="08:40:55" id="EVT_9920" node="S12_MAIN" action="HANDOVER_STARTED" />
                    <LogRow time="08:38:01" id="EVT_9919" node="S3_INSP" action="RECAL_SYNC_COMP" />
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 bg-surface-container-highest border-t-2 border-outline-variant px-2 pb-2">
        <NavButton icon="dashboard" label="DASH" active onClick={() => navigate('/dashboard')} />
        <NavButton icon="videocam" label="COCKPIT" onClick={() => navigate('/cockpit')} />
        <NavButton icon="assignment" label="BOARD" onClick={() => navigate('/board')} />
        <NavButton icon="logout" label="EXIT" onClick={() => navigate('/')} />
      </nav>
    </div>
  );
}

function SidebarItem({ icon, label, active = false, onClick }: { icon: string, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`px-6 py-4 flex items-center gap-4 text-xs font-bold transition-all cursor-pointer ${active ? 'bg-surface-container-high text-primary-cyan border-l-4 border-primary-cyan' : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-primary-cyan'}`}
    >
      <span className="material-symbols-outlined">{icon}</span>
      <span className="tracking-widest uppercase">{label}</span>
    </div>
  );
}

function StatCard({ label, value, color, opacity = false }: any) {
  return (
    <div className={`bg-surface-container p-6 border border-outline-variant border-t-4 border-t-${color} ${opacity ? 'border-primary-cyan/40 shadow-inner' : 'shadow-lg'}`}>
      <p className="text-[10px] font-bold text-on-surface-variant uppercase mb-2 tracking-widest">{label}</p>
      <p className={`text-4xl font-extrabold text-on-surface ${color === 'error-red' ? 'text-error-red' : ''}`}>{value}</p>
    </div>
  );
}

function CallCard({ call, onJoin }: { call: CameraFeed, onJoin: () => void }) {
  return (
    <div className={`bg-surface-container border-2 p-1 flex flex-col group ${call.isCritical ? 'border-error-red/50 shadow-[0_0_15px_rgba(255,180,171,0.1)]' : 'border-outline-variant hover:border-primary-cyan transition-all duration-300'}`}>
      <div className="relative h-48 bg-black overflow-hidden bg-zinc-900 flex items-center justify-center cursor-pointer" onClick={onJoin}>
        {call.isOnline ? (
          <img 
            alt={call.label} 
            className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-500" 
            src={`https://lh3.googleusercontent.com/aida-public/AB6AXuDV2oqa9eNEv6ZLoUr9y5zL4fpc-0GAhC5dzXfbx9it6x-FW-C0ulqeBpOi3vd1oSQmhgRuVcnBLXsVaBxd_DmQUePFqJ56F_6OdnNct-p7cAzGw06Q0Lemi5Y3dMrJFwKLMgpuzdJhuzDiDS_Mc8z2kid2HnmG8SZbZnvjAdukrJL2FVfxCZUnuJlfB-lTWW8Zp8dPTdcgu_dPbK4KKz-oUH75eKRAr0ghz26WIEi72rflGH_nPpOgI_hsq_HIVfLCWvaGJngbuDxr`}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 opacity-30">
            <span className="material-symbols-outlined text-4xl">no_photography</span>
            <span className="text-[10px] font-bold">FEED_OFFLINE</span>
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-2">
          <div className={`text-[10px] font-bold px-2 py-1 flex items-center gap-1 ${call.isCritical ? 'bg-error-red text-surface-dark animate-pulse' : 'bg-primary-cyan text-on-primary-cyan'}`}>
            {call.isOnline ? 'LIVE' : 'IDLE'} {call.isCritical ? '- CRITICAL' : '- ACTIVE'}
          </div>
          <div className="bg-black/70 text-white text-[8px] font-bold px-2 py-1 border border-white/20 uppercase tracking-tighter backdrop-blur-sm">
            {call.streamId} // CAM_{call.id}
          </div>
        </div>
        
        {/* Play Overlay on Hover */}
        <div className="absolute inset-0 bg-primary-cyan/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
          <span className="material-symbols-outlined text-6xl text-white drop-shadow-lg">play_circle</span>
        </div>
      </div>
      <div className="p-4 flex flex-col gap-3">
        <div>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Location</p>
          <p className="text-lg font-bold text-on-surface uppercase truncate">{call.label}</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onJoin}
            className={`flex-grow font-bold text-xs py-3 transition-all active:scale-95 uppercase cursor-pointer border-b-4 ${call.isCritical ? 'bg-error-red text-surface-dark border-red-900 hover:brightness-110' : 'bg-primary-cyan text-on-primary-cyan border-on-primary-cyan hover:brightness-110'}`}
          >
            {call.isCritical ? 'Intercept Call' : 'Join Session'}
          </button>
          <button className="px-4 border-2 border-outline-variant text-on-surface-variant hover:bg-surface-container-high hover:text-white active:scale-95 cursor-pointer transition-colors">
            <span className="material-symbols-outlined">more_vert</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function LogRow({ time, id, node, action }: any) {
  return (
    <tr className="hover:bg-surface-container-highest transition-all cursor-pointer group">
      <td className="p-3 border-r border-outline-variant text-primary-cyan group-hover:font-bold">{time}</td>
      <td className="p-3 border-r border-outline-variant">{id}</td>
      <td className="p-3 border-r border-outline-variant">{node}</td>
      <td className="p-3 uppercase group-hover:text-primary-cyan">{action}</td>
    </tr>
  );
}

function NavButton({ icon, label, active = false, onClick }: { icon: string, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center px-4 py-2 transition-all active:scale-95 cursor-pointer rounded-lg ${active ? 'bg-primary-cyan text-on-primary-cyan font-bold border-b-2 border-on-primary-cyan shadow-md' : 'text-on-surface-variant opacity-70 hover:opacity-100 hover:bg-surface-container-high'}`}
    >
      <span className="material-symbols-outlined">{icon}</span>
      <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
    </button>
  );
}
