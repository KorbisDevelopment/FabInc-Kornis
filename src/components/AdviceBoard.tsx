import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { Advice } from '../types';

export default function AdviceBoard() {
  const [adviceList, setAdviceList] = useState<Advice[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
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
      }
    };
    fetchProfile();
  }, [navigate]);

  useEffect(() => {
    if (!projectId) return;

    const adviceQuery = query(
      collection(db, 'projects', projectId, 'advice'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(adviceQuery, (snapshot) => {
      const ads = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Advice));
      setAdviceList(ads.length > 0 ? ads : [
        { id: '1', identifier: 'ADV-402', text: 'Verify hydraulic seal on Axis-B before initialization.', importance: 'critical', createdAt: Date.now() - 3600000 },
        { id: '2', identifier: 'ADV-399', text: 'Standard operating temp threshold increased to 72°C for current batch.', importance: 'normal', createdAt: Date.now() - 7200000 },
        { id: '3', identifier: 'ADV-388', text: 'Use specific calibration jig model JIG-42 for final alignment.', importance: 'normal', createdAt: Date.now() - 86400000 }
      ]);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `projects/${projectId}/advice`));

    return () => unsubscribe();
  }, [projectId]);

  return (
    <div className="min-h-screen bg-surface-dark text-on-surface font-mono p-4 md:p-8 flex flex-col items-center pb-24">
      <header className="w-full max-w-4xl flex justify-between items-center mb-12 border-b-2 border-outline-variant pb-6 shrink-0">
        <div className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/cockpit')}>
          <span className="material-symbols-outlined text-primary-cyan text-4xl">precision_manufacturing</span>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-primary-cyan uppercase">LABOR_GUIDANCE</h1>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em]">Live Support Uplink Activity</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:block text-right">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase">Last Update</p>
            <p className="text-xs font-bold text-primary-cyan">12S AGO</p>
          </div>
          <button 
            onClick={() => navigate('/cockpit')}
            className="bg-surface-container-highest border border-outline-variant p-3 hover:bg-primary-cyan/10 hover:border-primary-cyan transition-all active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-primary-cyan">close</span>
          </button>
        </div>
      </header>

      <main className="w-full max-w-4xl space-y-6 flex-grow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button className="bg-primary-cyan text-on-primary-cyan p-8 flex flex-col items-center gap-3 border-b-4 border-on-primary-cyan hover:brightness-110 active:translate-y-0.5 active:border-b-0 transition-all cursor-pointer shadow-lg group">
            <span className="material-symbols-outlined text-4xl group-hover:scale-110 transition-transform">emergency</span>
            <span className="font-bold uppercase tracking-[0.15em] text-sm">Request Emergency Help</span>
          </button>
          <button className="bg-surface-container text-on-surface p-8 flex flex-col items-center gap-3 border-2 border-outline-variant hover:border-primary-cyan transition-all active:scale-95 cursor-pointer shadow-lg group">
            <span className="material-symbols-outlined text-4xl group-hover:scale-110 transition-transform">add_a_photo</span>
            <span className="font-bold uppercase tracking-[0.15em] text-sm">Submit Photo for Review</span>
          </button>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-2 px-2 mb-4">
            <span className="material-symbols-outlined text-sm">history</span>
            Recent_Instructions_Stream
          </h3>
          {adviceList.map((advice, idx) => (
            <AdviceCard key={advice.id} advice={advice} index={idx} />
          ))}
        </div>
      </main>

      {/* Mobile Nav Footer */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 bg-surface-container-highest border-t-2 border-outline-variant px-2 pb-2">
        <NavButton icon="videocam" label="COCKPIT" onClick={() => navigate('/cockpit')} />
        <NavButton icon="support_agent" label="SUPPORT" onClick={() => navigate('/dashboard')} />
        <NavButton icon="assignment" label="ADVICE" active onClick={() => navigate('/board')} />
      </nav>
    </div>
  );
}

function AdviceCard({ advice, index }: { advice: Advice, index: number }) {
  const isCritical = advice.importance === 'critical';
  
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`relative p-6 border-2 transition-all cursor-pointer group hover:bg-surface-container-high ${isCritical ? 'border-error-red bg-error-red/5' : 'border-outline-variant bg-surface-container-low shadow-sm'}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${isCritical ? 'bg-error-red text-surface-dark animate-pulse' : 'bg-primary-cyan text-on-primary-cyan'}`}>
          {advice.identifier} // {isCritical ? 'CRITICAL_DIRECTIVE' : 'PROCEDURE_UPDATE'}
        </div>
        <span className="text-[10px] text-on-surface-variant font-medium opacity-60">
          {new Date(advice.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>
      
      <p className={`text-xl font-bold leading-tight uppercase ${isCritical ? 'text-on-surface' : 'text-on-surface group-hover:text-primary-cyan transition-colors'}`}>
        {advice.text}
      </p>

      {isCritical && (
        <div className="absolute top-0 right-0 w-12 h-12 overflow-hidden pointer-events-none opacity-50">
          <div className="absolute top-0 right-0 w-16 h-1 bg-error-red rotate-45 translate-x-4 translate-y-2 shadow-[0_0_5px_rgba(255,84,77,0.5)]"></div>
        </div>
      )}
      
      <div className="mt-6 flex justify-end gap-6 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="text-[10px] font-bold text-primary-cyan uppercase hover:bg-primary-cyan/10 px-3 py-1 border border-primary-cyan/30 cursor-pointer active:scale-95 transition-all">Acknowledge</button>
        <button className="text-[10px] font-bold text-on-surface-variant uppercase hover:bg-surface-container-highest px-3 py-1 border border-outline-variant cursor-pointer active:scale-95 transition-all">Request Clarification</button>
      </div>
    </motion.div>
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
