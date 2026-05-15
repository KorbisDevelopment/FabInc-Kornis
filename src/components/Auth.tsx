import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { OperationalRole } from '../types';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function Auth() {
  const [projectCode, setProjectCode] = useState('');
  const [role, setRole] = useState<OperationalRole>(OperationalRole.OPERATOR);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectCode) return;
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check for existing profile
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      // We allow role updates for this demo to prevent getting "trapped" in one role
      await setDoc(userDocRef, {
        email: user.email,
        role: role,
        projectId: projectCode // Link to project
      }, { merge: true });

      if (role === OperationalRole.OPERATOR) {
        navigate('/cockpit');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error("Login failed", error);
      handleFirestoreError(error, OperationType.WRITE, 'users');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface-dark text-on-surface font-mono rugged-texture min-h-screen flex flex-col items-center justify-center p-4">
      <motion.main 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[480px] bg-surface-container border-2 border-outline-variant p-4 md:p-6 shadow-[8px_8px_0px_0px_rgba(59,73,76,0.5)]"
      >
        <div className="flex flex-col items-start gap-2 mb-10 border-b-4 border-primary-cyan pb-6">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary-cyan text-4xl">precision_manufacturing</span>
            <h1 className="text-3xl font-extrabold tracking-tighter text-primary-cyan">FAB_INC</h1>
          </div>
          <p className="text-xs text-on-surface-variant uppercase tracking-widest">System Authentication Required</p>
        </div>

        <form className="space-y-8" onSubmit={handleLogin}>
          <div className="space-y-2">
            <label className="text-xs text-on-surface-variant block" htmlFor="project-code">PROJECT_ACCESS_CODE</label>
            <div className="relative">
              <input 
                className="w-full bg-surface-container-high border-2 border-outline-variant px-4 py-4 focus:outline-none focus:border-primary-cyan text-primary-cyan placeholder:opacity-30" 
                id="project-code" 
                placeholder="PRJ-XXXX-000" 
                type="text"
                value={projectCode}
                onChange={(e) => setProjectCode(e.target.value)}
                required
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                <span className="material-symbols-outlined text-outline cursor-pointer">qr_code_scanner</span>
              </div>
            </div>
            <p className="text-[10px] text-outline italic">Enter 12-digit terminal authorization key</p>
          </div>

          <div className="space-y-3">
            <span className="text-xs text-on-surface-variant block uppercase">Operational Role</span>
            <div className="grid grid-cols-2 gap-4">
              <div 
                onClick={() => setRole(OperationalRole.OPERATOR)}
                className={`border-2 p-4 flex flex-col items-center gap-3 transition-all active:scale-95 cursor-pointer ${role === OperationalRole.OPERATOR ? 'border-primary-cyan bg-primary-cyan/10 shadow-[0_0_15px_rgba(0,229,255,0.2)]' : 'border-outline-variant hover:border-primary-cyan/50'}`}
              >
                <span className={`material-symbols-outlined text-3xl ${role === OperationalRole.OPERATOR ? 'text-primary-cyan' : 'text-on-surface-variant'}`}>engineering</span>
                <span className={`text-xs font-bold ${role === OperationalRole.OPERATOR ? 'text-primary-cyan' : 'text-on-surface-variant'}`}>OPERATOR</span>
              </div>

              <div 
                onClick={() => setRole(OperationalRole.EXPERT)}
                className={`border-2 p-4 flex flex-col items-center gap-3 transition-all active:scale-95 cursor-pointer ${role === OperationalRole.EXPERT ? 'border-primary-cyan bg-primary-cyan/10 shadow-[0_0_15px_rgba(0,229,255,0.2)]' : 'border-outline-variant hover:border-primary-cyan/50'}`}
              >
                <span className={`material-symbols-outlined text-3xl ${role === OperationalRole.EXPERT ? 'text-primary-cyan' : 'text-on-surface-variant'}`}>architecture</span>
                <span className={`text-xs font-bold ${role === OperationalRole.EXPERT ? 'text-primary-cyan' : 'text-on-surface-variant'}`}>EXPERT</span>
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-col gap-4">
            <button 
              className="w-full bg-primary-cyan text-on-primary-cyan font-bold text-xl py-5 border-b-4 border-on-primary-cyan active:translate-y-0.5 active:border-b-0 disabled:opacity-50 transition-all uppercase flex items-center justify-center gap-3 cursor-pointer hover:brightness-110" 
              type="submit"
              disabled={loading}
            >
              <span className="material-symbols-outlined">power_settings_new</span>
              {loading ? 'Initializing...' : 'Initialize Terminal'}
            </button>
            <button className="w-full bg-transparent border-2 border-primary-cyan text-primary-cyan text-xs py-4 hover:bg-primary-cyan/10 transition-colors uppercase cursor-pointer active:scale-[0.98]" type="button">
              Scan RFID Badge
            </button>
          </div>
        </form>

        <div className="mt-12 grid grid-cols-3 gap-2 border-t border-outline-variant/30 pt-6">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-outline">NETWORK</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-primary-cyan rounded-full"></div>
              <span className="text-[10px] text-primary-cyan font-medium uppercase">Encrypted</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 border-x border-outline-variant/30">
            <span className="text-[10px] text-outline">LOC_ID</span>
            <span className="text-[10px] text-on-surface uppercase">Bay_04-North</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-outline">UPTIME</span>
            <span className="text-[10px] text-on-surface">99.98%</span>
          </div>
        </div>
      </motion.main>

      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden opacity-10">
        <img 
          alt="Industrial environment" 
          className="w-full h-full object-cover filter grayscale" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuQ0lnks2J0c9Yku9TwiV2_FmKM8zI-c-Ylf70F_BuqEPfPrsWWEqXrxOKGFht4byMi0JSOYjIMyD8ZORV6fP4eq8TsfMcPPmvSdSx-Lsr46l2SMA4wH6jABmEMZUcZoHTDa6Bn4ahAsC17Gg1Q296lkVvERfveaSGz5mZBugpmIH7f8GoCHGP_lrrCk2Nzoyid0oK4qPIBn7NK2QJLECBZelC3ZIP8AN7jInjMm09sJAX3tOBgWXdTsdrepNMeNVv4Hdnc6f5e_0m" 
        />
      </div>
    </div>
  );
}
