/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { db, handleFirestoreError, OperationType } from './firebase';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import {
  School,
  Operator,
  MonthlyPagu,
  RAB,
  Transaction,
  TarikTunai,
  SystemConfig,
  ToastMessage
} from './types';
import {
  initialSchools,
  initialOperators,
  initialMonthlyPagu,
  initialRAB,
  initialTransactions,
  initialTarikTunai,
  defaultSystemConfig
} from './data/initialData';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Toast from './components/Toast';
import ConfirmModal from './components/ConfirmModal';
import SchoolModal from './components/SchoolModal';
import UserModal from './components/UserModal';
import RabModal from './components/RabModal';
import TransactionModal from './components/TransactionModal';
import TarikTunaiModal from './components/TarikTunaiModal';
import PaguBulanModal from './components/PaguBulanModal';
import ImportModal from './components/ImportModal';

// Recharts imports
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';

import {
  Wallet,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  TrendingUp,
  Coins,
  Hourglass,
  Building2,
  AlertCircle,
  AlarmClock,
  Printer,
  Download,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  CheckCircle,
  Database,
  X,
  CalendarRange,
  ArrowDownToLine,
  School as SchoolIcon,
  BookOpen,
  Upload
} from 'lucide-react';

export default function App() {
  const apiUrl = '';

  // Authentication & Session
  const [currentUser, setCurrentUser] = useState<Operator | null>(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // Core Database States (Persisted in LocalStorage or Synced with WebApp API)
  const [schools, rawSetSchools] = useState<School[]>(() => {
    try {
      const data = localStorage.getItem('perbala_schools');
      return data ? JSON.parse(data) : initialSchools;
    } catch {
      return initialSchools;
    }
  });
  const [operators, rawSetOperators] = useState<Operator[]>(() => {
    try {
      const data = localStorage.getItem('perbala_operators');
      return data ? JSON.parse(data) : initialOperators;
    } catch {
      return initialOperators;
    }
  });
  const [monthlyPagu, rawSetMonthlyPagu] = useState<MonthlyPagu[]>(() => {
    try {
      const data = localStorage.getItem('perbala_monthly_pagu');
      return data ? JSON.parse(data) : initialMonthlyPagu;
    } catch {
      return initialMonthlyPagu;
    }
  });
  const [rabList, rawSetRabList] = useState<RAB[]>(() => {
    try {
      const data = localStorage.getItem('perbala_rab');
      return data ? JSON.parse(data) : initialRAB;
    } catch {
      return initialRAB;
    }
  });
  const [transactions, rawSetTransactions] = useState<Transaction[]>(() => {
    try {
      const data = localStorage.getItem('perbala_transactions');
      return data ? JSON.parse(data) : initialTransactions;
    } catch {
      return initialTransactions;
    }
  });
  const [tarikTunaiList, rawSetTarikTunaiList] = useState<TarikTunai[]>(() => {
    try {
      const data = localStorage.getItem('perbala_tarik_tunai');
      return data ? JSON.parse(data) : initialTarikTunai;
    } catch {
      return initialTarikTunai;
    }
  });
  const [systemConfig, rawSetSystemConfig] = useState<SystemConfig>(() => {
    try {
      return {
        org_name: localStorage.getItem('perbala_org_name') || defaultSystemConfig.org_name,
        logo_preset: localStorage.getItem('perbala_logo_preset') || defaultSystemConfig.logo_preset,
        logo_url: localStorage.getItem('perbala_logo_url') || defaultSystemConfig.logo_url,
        deadline_t1: localStorage.getItem('perbala_deadline_t1') || defaultSystemConfig.deadline_t1,
        deadline_t2: localStorage.getItem('perbala_deadline_t2') || defaultSystemConfig.deadline_t2,
      };
    } catch {
      return defaultSystemConfig;
    }
  });

  // Local change tracking ref to strictly gate Firestore write-back triggers
  const isLocalChange = useRef(false);

  // Wrapped state setters that flag the change as user-initiated / local
  const setSchools = (val: School[] | ((prev: School[]) => School[])) => {
    isLocalChange.current = true;
    rawSetSchools(val);
  };
  const setOperators = (val: Operator[] | ((prev: Operator[]) => Operator[])) => {
    isLocalChange.current = true;
    rawSetOperators(val);
  };
  const setMonthlyPagu = (val: MonthlyPagu[] | ((prev: MonthlyPagu[]) => MonthlyPagu[])) => {
    isLocalChange.current = true;
    rawSetMonthlyPagu(val);
  };
  const setRabList = (val: RAB[] | ((prev: RAB[]) => RAB[])) => {
    isLocalChange.current = true;
    rawSetRabList(val);
  };
  const setTransactions = (val: Transaction[] | ((prev: Transaction[]) => Transaction[])) => {
    isLocalChange.current = true;
    rawSetTransactions(val);
  };
  const setTarikTunaiList = (val: TarikTunai[] | ((prev: TarikTunai[]) => TarikTunai[])) => {
    isLocalChange.current = true;
    rawSetTarikTunaiList(val);
  };
  const setSystemConfig = (val: SystemConfig | ((prev: SystemConfig) => SystemConfig)) => {
    isLocalChange.current = true;
    rawSetSystemConfig(val);
  };
  const [syncStatus, setSyncStatus] = useState<'active' | 'error' | 'syncing'>('active');
  const [syncErrorReason, setSyncErrorReason] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(new Date());

  // App UI Navigation & Filters
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [schoolFilter, setSchoolFilter] = useState('SEMUA');
  const [monthFilterHabisPakai, setMonthFilterHabisPakai] = useState('SEMUA');
  const [monthFilterTarikTunai, setMonthFilterTarikTunai] = useState('SEMUA');
  const [dashboardFilterCategory, setDashboardFilterCategory] = useState('SEMUA');
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

  // Toast & Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Confirmation modal states
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Modal open states
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isRabModalOpen, setIsRabModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isTarikTunaiModalOpen, setIsTarikTunaiModalOpen] = useState(false);
  const [isPaguBulanModalOpen, setIsPaguBulanModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Selected editing item states
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [editingUser, setEditingUser] = useState<Operator | null>(null);
  const [editingRab, setEditingRab] = useState<RAB | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingTarikTunai, setEditingTarikTunai] = useState<TarikTunai | null>(null);
  const [editingPaguBulan, setEditingPaguBulan] = useState<string | null>(null);
  const [importType, setImportType] = useState<'schools' | 'operators'>('schools');

  const isInitialLoaded = useRef(false);
  const lastSyncedData = useRef<string | null>(null);
  const firestoreUnsubscribeRef = useRef<(() => void) | null>(null);
  const retryTimeoutRef = useRef<any>(null);

  // Start real-time Firestore synchronization
  const startFirestoreSync = (
    currentSchools = schools,
    currentOperators = operators,
    currentMonthlyPagu = monthlyPagu,
    currentRab = rabList,
    currentTx = transactions,
    currentTarik = tarikTunaiList,
    currentConfig = systemConfig,
    showToastOnSuccess = false,
    retryCount = 0
  ) => {
    if (firestoreUnsubscribeRef.current) {
      try {
        firestoreUnsubscribeRef.current();
      } catch (e) {
        console.error('Error unsubscribing:', e);
      }
      firestoreUnsubscribeRef.current = null;
    }

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    setSyncStatus('syncing');

    const docRef = doc(db, 'app_data', 'database');
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      // Clear any pending retry timeouts on successful connection
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      setSyncErrorReason(null);

      if (snapshot.exists()) {
        const data = snapshot.data();
        
        // Firestore data or default fallbacks
        const firestoreSchools = data.schools || initialSchools;
        const firestoreOperators = data.operators || initialOperators;
        const firestoreMonthlyPagu = data.monthlyPagu || initialMonthlyPagu;
        const firestoreRab = data.rabList || initialRAB;
        const firestoreTx = data.transactions || initialTransactions;
        const firestoreTarik = data.tarikTunaiList || initialTarikTunai;
        const firestoreConfig = data.systemConfig || defaultSystemConfig;

        // Directly adopt the Firestore data as the absolute source of truth.
        const dbState = {
          schools: firestoreSchools,
          operators: firestoreOperators,
          monthlyPagu: firestoreMonthlyPagu,
          rabList: firestoreRab,
          transactions: firestoreTx,
          tarikTunaiList: firestoreTarik,
          systemConfig: firestoreConfig
        };

        const dbStateStr = JSON.stringify(dbState);

        // 1. STRICT GUARD: If there is a pending unsaved local change,
        // do not let real-time listener overwrite our unsaved changes with older server data.
        if (isLocalChange.current) {
          console.log('Skipping real-time update because there are pending local changes.');
          return;
        }

        // 2. OPTIMIZATION: If the incoming data is identical to what we have, skip redundant updates
        if (dbStateStr === lastSyncedData.current) {
          setSyncStatus('active');
          setLastSyncTime(new Date());
          isInitialLoaded.current = true;
          return;
        }

        isLocalChange.current = false; // Prevent writeback loop on incoming remote state changes
        lastSyncedData.current = dbStateStr;

        // Update React states using raw setters to prevent flagging this as a local/user change
        rawSetSchools(dbState.schools);
        rawSetOperators(dbState.operators);
        rawSetMonthlyPagu(dbState.monthlyPagu);
        rawSetRabList(dbState.rabList);
        rawSetTransactions(dbState.transactions);
        rawSetTarikTunaiList(dbState.tarikTunaiList);
        rawSetSystemConfig(dbState.systemConfig);

        // Update LocalStorage
        localStorage.setItem('perbala_schools', JSON.stringify(dbState.schools));
        localStorage.setItem('perbala_operators', JSON.stringify(dbState.operators));
        localStorage.setItem('perbala_monthly_pagu', JSON.stringify(dbState.monthlyPagu));
        localStorage.setItem('perbala_rab', JSON.stringify(dbState.rabList));
        localStorage.setItem('perbala_transactions', JSON.stringify(dbState.transactions));
        localStorage.setItem('perbala_tarik_tunai', JSON.stringify(dbState.tarikTunaiList));
        localStorage.setItem('perbala_org_name', dbState.systemConfig.org_name);
        localStorage.setItem('perbala_logo_preset', dbState.systemConfig.logo_preset);
        localStorage.setItem('perbala_logo_url', dbState.systemConfig.logo_url || '');
        localStorage.setItem('perbala_deadline_t1', dbState.systemConfig.deadline_t1);
        localStorage.setItem('perbala_deadline_t2', dbState.systemConfig.deadline_t2);

        setSyncStatus('active');
        setLastSyncTime(new Date());
        isInitialLoaded.current = true;

        if (showToastOnSuccess) {
          addToast('Sinkronisasi Sukses', 'Basis data berhasil disinkronkan dengan server awan.', 'success');
        }
      } else {
        // Create initial document on Firestore if not present
        const defaultDb = {
          schools: currentSchools,
          operators: currentOperators,
          monthlyPagu: currentMonthlyPagu,
          rabList: currentRab,
          transactions: currentTx,
          tarikTunaiList: currentTarik,
          systemConfig: currentConfig
        };
        
        lastSyncedData.current = JSON.stringify(defaultDb);
        setDoc(docRef, defaultDb)
          .then(() => {
            setSyncStatus('active');
            setLastSyncTime(new Date());
            isInitialLoaded.current = true;
            if (showToastOnSuccess) {
              addToast('Sinkronisasi Sukses', 'Basis data berhasil diinisialisasi dan disinkronkan dengan server awan.', 'success');
            }
          })
          .catch((err) => {
            console.error('Error writing initial document:', err);
            setSyncStatus('error');
          });
      }
    }, (err: any) => {
      console.warn('Firestore subscription connection issue/error:', err);
      setSyncStatus('error');
      
      // Determine user-friendly error reason
      let reason = 'Jaringan terputus atau koneksi tidak stabil';
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        reason = 'Perangkat Anda sedang luring (tidak ada internet)';
      } else if (err && err.code) {
        switch (err.code) {
          case 'permission-denied':
            reason = 'Izin ditolak (Aturan keamanan database membatasi)';
            break;
          case 'unauthenticated':
            reason = 'Sesi masuk kedaluwarsa atau tidak terautentikasi';
            break;
          case 'unavailable':
            reason = 'Server Firestore sedang sibuk / tidak merespon';
            break;
          case 'quota-exceeded':
            reason = 'Kuota pembacaan/penulisan server awan terlampaui';
            break;
          case 'not-found':
            reason = 'Dokumen basis data tidak ditemukan di server awan';
            break;
          default:
            reason = `${err.message || 'Koneksi gagal'} (${err.code})`;
        }
      } else if (err && err.message) {
        reason = err.message;
      }
      setSyncErrorReason(reason);
      
      // Auto-retry with exponential backoff delay starting at 5s, max 30s
      const nextDelay = Math.min(1000 * Math.pow(2, Math.min(retryCount, 6)) + 4000, 30000);
      console.log(`Scheduling automatic synchronization retry in ${nextDelay / 1000}s (Retry #${retryCount + 1})...`);
      
      retryTimeoutRef.current = setTimeout(() => {
        startFirestoreSync(
          currentSchools,
          currentOperators,
          currentMonthlyPagu,
          currentRab,
          currentTx,
          currentTarik,
          currentConfig,
          false,
          retryCount + 1
        );
      }, nextDelay);
    });

    firestoreUnsubscribeRef.current = unsubscribe;
  };

  // Fetch the absolute newest data from Firestore (bypassing caching/snapshots for clicking synchronization button)
  const loadDatabaseFromApi = async (isManual = true) => {
    setIsLoadingData(true);
    setSyncStatus('syncing');
    setSyncErrorReason(null);
    if (isManual) {
      addToast('Menghubungkan', 'Mengambil data terbaru dari server awan...', 'info');
    }
    try {
      const docRef = doc(db, 'app_data', 'database');
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        
        // Firestore data or default fallbacks
        const firestoreSchools = data.schools || initialSchools;
        const firestoreOperators = data.operators || initialOperators;
        const firestoreMonthlyPagu = data.monthlyPagu || initialMonthlyPagu;
        const firestoreRab = data.rabList || initialRAB;
        const firestoreTx = data.transactions || initialTransactions;
        const firestoreTarik = data.tarikTunaiList || initialTarikTunai;
        const firestoreConfig = data.systemConfig || defaultSystemConfig;

        const dbState = {
          schools: firestoreSchools,
          operators: firestoreOperators,
          monthlyPagu: firestoreMonthlyPagu,
          rabList: firestoreRab,
          transactions: firestoreTx,
          tarikTunaiList: firestoreTarik,
          systemConfig: firestoreConfig
        };
        
        // Block save useEffect from triggering on these initial loads
        isLocalChange.current = false;
        lastSyncedData.current = JSON.stringify(dbState);

        // Update React states using raw setters to prevent flagging this as a local/user change
        rawSetSchools(dbState.schools);
        rawSetOperators(dbState.operators);
        rawSetMonthlyPagu(dbState.monthlyPagu);
        rawSetRabList(dbState.rabList);
        rawSetTransactions(dbState.transactions);
        rawSetTarikTunaiList(dbState.tarikTunaiList);
        rawSetSystemConfig(dbState.systemConfig);

        // Update LocalStorage
        localStorage.setItem('perbala_schools', JSON.stringify(dbState.schools));
        localStorage.setItem('perbala_operators', JSON.stringify(dbState.operators));
        localStorage.setItem('perbala_monthly_pagu', JSON.stringify(dbState.monthlyPagu));
        localStorage.setItem('perbala_rab', JSON.stringify(dbState.rabList));
        localStorage.setItem('perbala_transactions', JSON.stringify(dbState.transactions));
        localStorage.setItem('perbala_tarik_tunai', JSON.stringify(dbState.tarikTunaiList));
        localStorage.setItem('perbala_org_name', dbState.systemConfig.org_name);
        localStorage.setItem('perbala_logo_preset', dbState.systemConfig.logo_preset);
        localStorage.setItem('perbala_logo_url', dbState.systemConfig.logo_url || '');
        localStorage.setItem('perbala_deadline_t1', dbState.systemConfig.deadline_t1);
        localStorage.setItem('perbala_deadline_t2', dbState.systemConfig.deadline_t2);

        setSyncStatus('active');
        setLastSyncTime(new Date());
        isInitialLoaded.current = true;

        if (isManual) {
          addToast('Sinkronisasi Sukses', 'Basis data berhasil disinkronkan dengan data terbaru dari awan.', 'success');
        }
      } else {
        // Document doesn't exist, create it with current states
        const defaultDb = {
          schools,
          operators,
          monthlyPagu,
          rabList,
          transactions,
          tarikTunaiList,
          systemConfig
        };
        lastSyncedData.current = JSON.stringify(defaultDb);
        await setDoc(docRef, defaultDb);
        
        setSyncStatus('active');
        setLastSyncTime(new Date());
        isInitialLoaded.current = true;
        
        if (isManual) {
          addToast('Sinkronisasi Sukses', 'Basis data berhasil diinisialisasi dan disinkronkan dengan server awan.', 'success');
        }
      }
      
      // Keep real-time snapshot subscription active
      startFirestoreSync(schools, operators, monthlyPagu, rabList, transactions, tarikTunaiList, systemConfig, false);
      setIsLoadingData(false);
    } catch (err: any) {
      console.error('Failed manual pull from Firestore:', err);
      setIsLoadingData(false);
      setSyncStatus('error');
      
      let reason = 'Gagal mengambil data terbaru dari server awan';
      if (err && err.code === 'permission-denied') {
        reason = 'Izin ditolak oleh aturan keamanan server';
      } else if (err && err.message) {
        reason = err.message;
      }
      setSyncErrorReason(reason);
      
      if (isManual) {
        addToast('Koneksi Gagal', 'Gagal menyegarkan data terbaru dari basis data awan.', 'error');
      }
      
      // Subscribe to real-time sync as fallback anyway
      startFirestoreSync(schools, operators, monthlyPagu, rabList, transactions, tarikTunaiList, systemConfig, false);
    }
  };

  // Sync simulated/local database state to the Express server as backup
  const saveDatabaseToServer = async (
    currentSchools = schools,
    currentOperators = operators,
    currentMonthlyPagu = monthlyPagu,
    currentRab = rabList,
    currentTx = transactions,
    currentTarik = tarikTunaiList,
    currentConfig = systemConfig
  ) => {
    try {
      await fetch('/api/local-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schools: currentSchools,
          operators: currentOperators,
          monthlyPagu: currentMonthlyPagu,
          rabList: currentRab,
          transactions: currentTx,
          tarikTunaiList: currentTarik,
          systemConfig: currentConfig
        })
      });
    } catch (err) {
      console.error('Failed to auto-save local database state to server backup:', err);
    }
  };

  // 1. Initial State Load on mount & Real-Time Cloud Synchronization
  useEffect(() => {
    // Fetch absolute newest database from Firestore server first, then subscribes to onSnapshot
    loadDatabaseFromApi(false);

    return () => {
      if (firestoreUnsubscribeRef.current) {
        firestoreUnsubscribeRef.current();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // 2. Persist states in LocalStorage and Firestore whenever they change (debounced)
  useEffect(() => {
    // Save to LocalStorage immediately for instant local performance (no gating required!)
    localStorage.setItem('perbala_schools', JSON.stringify(schools));
    localStorage.setItem('perbala_operators', JSON.stringify(operators));
    localStorage.setItem('perbala_monthly_pagu', JSON.stringify(monthlyPagu));
    localStorage.setItem('perbala_rab', JSON.stringify(rabList));
    localStorage.setItem('perbala_transactions', JSON.stringify(transactions));
    localStorage.setItem('perbala_tarik_tunai', JSON.stringify(tarikTunaiList));

    if (!isInitialLoaded.current) return;
    if (!isLocalChange.current) return; // STRICTLY Gated: Only save if there was a user-initiated change

    const currentDbState = {
      schools,
      operators,
      monthlyPagu,
      rabList,
      transactions,
      tarikTunaiList,
      systemConfig
    };
    const currentDbStateStr = JSON.stringify(currentDbState);

    // Skip if identical to what we last synced (to prevent write loops)
    if (currentDbStateStr === lastSyncedData.current) {
      return;
    }

    // Debounce cloud persistence by 1.5 seconds to prevent rate limiting & save collision issues
    const debounceTimer = setTimeout(() => {
      if (currentDbStateStr !== lastSyncedData.current) {
        lastSyncedData.current = currentDbStateStr;
        isLocalChange.current = false; // Reset local change flag because we are committing to save this specific state
        
        setSyncStatus('syncing');
        const docRef = doc(db, 'app_data', 'database');
        setDoc(docRef, currentDbState)
          .then(() => {
            setSyncStatus('active');
            setLastSyncTime(new Date());
          })
          .catch((err) => {
            console.error('Failed to save to Firestore:', err);
            setSyncStatus('error');
          });

        // Maintain server backup in database.json
        saveDatabaseToServer(schools, operators, monthlyPagu, rabList, transactions, tarikTunaiList, systemConfig);
      }
    }, 1500);

    return () => clearTimeout(debounceTimer);
  }, [schools, operators, monthlyPagu, rabList, transactions, tarikTunaiList, systemConfig]);

  // Toast Helpers
  const addToast = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Check filtering constraint
  const activeSchoolName = currentUser?.role !== 'Admin' ? currentUser?.instansi || '' : schoolFilter;
  const isSchoolMatch = (schName: string) => {
    if (currentUser?.role === 'Admin' && schoolFilter === 'SEMUA') return true;
    return schName.toLowerCase().trim() === activeSchoolName.toLowerCase().trim();
  };

  // Dynamic values summary computations
  const filteredSchools = schools.filter((s) => isSchoolMatch(s.nama));
  const filteredTransactions = transactions.filter((t) => isSchoolMatch(t.sekolah));
  const filteredTarikTunai = tarikTunaiList.filter((t) => isSchoolMatch(t.sekolah));
  const filteredMonthlyPagu = monthlyPagu.filter((p) => isSchoolMatch(p.sekolah));

  // Tahap Bulanan lists
  const bulanTahap1 = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];
  const bulanTahap2 = ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  // Sum total pagu bulanan
  const totalPaguT1 = filteredMonthlyPagu
    .filter((p) => bulanTahap1.includes(p.bulan))
    .reduce((sum, curr) => sum + curr.pagu, 0);

  const totalPaguT2 = filteredMonthlyPagu
    .filter((p) => bulanTahap2.includes(p.bulan))
    .reduce((sum, curr) => sum + curr.pagu, 0);

  const totalPaguTahunan = totalPaguT1 + totalPaguT2;

  // Helper to extract the month index (0-11) of a transaction
  const getTxMonthIndex = (t: Transaction): number => {
    if (!t.tanggal) return -1;
    const parts = t.tanggal.split('-');
    if (parts.length >= 2) {
      const m = parseInt(parts[1], 10);
      if (m >= 1 && m <= 12) return m - 1;
    }
    return new Date(t.tanggal).getMonth();
  };

  // Helper to get the Indonesian month name of a transaction
  const getTxMonthName = (t: Transaction): string => {
    const idx = getTxMonthIndex(t);
    const months = [...bulanTahap1, ...bulanTahap2];
    if (idx >= 0 && idx < 12) return months[idx];
    return '-';
  };

  // Realisasi Belanja & Tarik Tunai Tahap 1 (Bulan Jan-Jun)
  const approvedRealisasiT1 = filteredTransactions
    .filter((t) => t.status === 'Disetujui')
    .reduce((sum, curr) => sum + curr.total_biaya, 0);

  const totalTarikSelesai = filteredTarikTunai
    .filter((t) => t.status === 'Selesai')
    .reduce((sum, curr) => sum + curr.nilai, 0);

  const totalSiplahHabisPakai = filteredTransactions
    .filter((t) => t.kategori === 'SIPLAH' && t.status === 'Disetujui')
    .reduce((sum, curr) => sum + curr.total_biaya, 0);

  const belanjaBukuT1 = filteredTransactions
    .filter((t) => t.status === 'Disetujui' && t.kategori === 'BUKU' && getTxMonthIndex(t) < 6)
    .reduce((sum, curr) => sum + curr.total_biaya, 0);

  const belanjaAlatT1 = filteredTransactions
    .filter((t) => t.status === 'Disetujui' && t.kategori === 'ALAT' && getTxMonthIndex(t) < 6)
    .reduce((sum, curr) => sum + curr.total_biaya, 0);

  const belanjaSiplahT1 = filteredTransactions
    .filter((t) => t.status === 'Disetujui' && t.kategori === 'SIPLAH' && getTxMonthIndex(t) < 6)
    .reduce((sum, curr) => sum + curr.total_biaya, 0);

  const tarikTunaiT1 = filteredTarikTunai
    .filter((t) => t.status === 'Selesai' && bulanTahap1.map(b => b.toLowerCase().trim()).includes(t.bulan.toLowerCase().trim()))
    .reduce((sum, curr) => sum + curr.nilai, 0);

  // Realisasi Tahap 1: Penjumlahan belanja buku, alat, siplah, dan tarik tunai Jan-Jun (Total Pengeluaran)
  const realisasiTahap1 = belanjaBukuT1 + belanjaAlatT1 + belanjaSiplahT1 + tarikTunaiT1;

  // Realisasi Belanja & Tarik Tunai Tahap 2 (Bulan Jul-Des)
  const belanjaBukuT2 = filteredTransactions
    .filter((t) => t.status === 'Disetujui' && t.kategori === 'BUKU' && getTxMonthIndex(t) >= 6)
    .reduce((sum, curr) => sum + curr.total_biaya, 0);

  const belanjaAlatT2 = filteredTransactions
    .filter((t) => t.status === 'Disetujui' && t.kategori === 'ALAT' && getTxMonthIndex(t) >= 6)
    .reduce((sum, curr) => sum + curr.total_biaya, 0);

  const belanjaSiplahT2 = filteredTransactions
    .filter((t) => t.status === 'Disetujui' && t.kategori === 'SIPLAH' && getTxMonthIndex(t) >= 6)
    .reduce((sum, curr) => sum + curr.total_biaya, 0);

  const tarikTunaiT2 = filteredTarikTunai
    .filter((t) => t.status === 'Selesai' && bulanTahap2.map(b => b.toLowerCase().trim()).includes(t.bulan.toLowerCase().trim()))
    .reduce((sum, curr) => sum + curr.nilai, 0);

  // Realisasi Tahap 2: Penjumlahan belanja buku, alat, siplah, dan tarik tunai Jul-Des (Total Pengeluaran)
  const realisasiTahap2 = belanjaBukuT2 + belanjaAlatT2 + belanjaSiplahT2 + tarikTunaiT2;

  // Realisasi Global: Total pengeluaran Tahap 1 + Tahap 2
  const realisasiGlobal = realisasiTahap1 + realisasiTahap2;

  // Persentase Berjalan (0-100%)
  const realisasiTahap1Persen = totalPaguT1 > 0 ? Math.min(100, Math.max(0, (realisasiTahap1 / totalPaguT1) * 100)) : 0;
  const realisasiTahap2Persen = totalPaguT2 > 0 ? Math.min(100, Math.max(0, (realisasiTahap2 / totalPaguT2) * 100)) : 0;
  const realisasiGlobalPersen = totalPaguTahunan > 0 ? Math.min(100, Math.max(0, (realisasiGlobal / totalPaguTahunan) * 100)) : 0;

  // Sisa Anggaran: Pagu Tahunan - Approved realisasi - Tarik selesai
  const sisaAnggaranBersih = Math.max(0, totalPaguTahunan - approvedRealisasiT1 - totalTarikSelesai);

  // Perform Logged Activity (locally or noop since spreadsheet is removed)
  const logActivity = async (actionName: string, detail: string) => {
    console.log(`Activity Log: ${actionName} - ${detail}`);
  };

  // 3. Authenticate User Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoginLoading(true);

    if (apiUrl) {
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          mode: 'cors',
          body: JSON.stringify({ action: 'login', username: loginUsername, password: loginPassword })
        });
        const data = await response.json();
        setIsLoginLoading(false);
        if (data.success) {
          setCurrentUser(data.user);
          setSchoolFilter(data.user.role === 'Admin' ? 'SEMUA' : data.user.instansi);
          addToast('Login Berhasil', `Selamat datang kembali, ${data.user.nama}!`, 'success');
          loadDatabaseFromApi();
        } else {
          addToast('Login Gagal', data.message || 'Kredensial salah.', 'error');
        }
        return;
      } catch (err) {
        setIsLoginLoading(false);
      }
    }

    // Offline standard authentication
    setTimeout(() => {
      setIsLoginLoading(false);
      const matched = operators.find(
        (o) => o.username.toLowerCase() === loginUsername.toLowerCase() && o.password === loginPassword
      );
      if (matched) {
        setCurrentUser(matched);
        setSchoolFilter(matched.role === 'Admin' ? 'SEMUA' : matched.instansi);
        addToast('Login Berhasil', `Selamat datang kembali, ${matched.nama}!`, 'success');
        loadDatabaseFromApi(false);
      } else {
        addToast('Gagal Masuk', 'Username atau password salah!', 'error');
      }
    }, 600);
  };

  // Log out user
  const handleLogout = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Keluar Aplikasi',
      message: 'Apakah Anda yakin ingin mengakhiri sesi monitoring PERBALA ini?',
      onConfirm: () => {
        setCurrentUser(null);
        setLoginUsername('');
        setLoginPassword('');
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        addToast('Sesi Berakhir', 'Sistem monitoring PERBALA ditutup dengan aman.', 'info');
      }
    });
  };

  // Quick Role Switching simulator helper
  const handleRoleSwitch = (role: 'Admin' | 'Anggota') => {
    if (role === 'Admin') {
      const adminUser = operators.find((o) => o.role === 'Admin') || operators[0];
      setCurrentUser(adminUser);
      setSchoolFilter('SEMUA');
      addToast('Peran Dialihkan', `Menjelajah sebagai Administrator Utama (${adminUser.nama})`, 'info');
    } else {
      const schoolUser = operators.find((o) => o.role === 'Anggota') || {
        nama: 'RUSNOTO',
        username: 'rusnoto.prasasti@gmail.com',
        role: 'Anggota',
        instansi: 'SD NEGERI SEKARDOJA',
        status: 'Offline'
      };
      setCurrentUser(schoolUser);
      setSchoolFilter(schoolUser.instansi);
      addToast('Peran Dialihkan', `Menjelajah sebagai Operator ${schoolUser.instansi} (${schoolUser.nama})`, 'info');
    }
  };

  // Dynamic month-based data for AreaChart
  const getChartData = () => {
    const monthsList = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const abbreviations = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];

    return monthsList.map((m, idx) => {
      const pagu = filteredMonthlyPagu
        .filter((p) => p.bulan.toLowerCase().trim() === m.toLowerCase().trim())
        .reduce((sum, curr) => sum + curr.pagu, 0);

      const realisasi = filteredTransactions
        .filter((t) => {
          const tMonthIdx = new Date(t.tanggal).getMonth();
          return tMonthIdx === idx && t.status === 'Disetujui';
        })
        .reduce((sum, curr) => sum + curr.total_biaya, 0);

      return {
        name: abbreviations[idx],
        Pagu: pagu,
        Realisasi: realisasi
      };
    });
  };

  // Format money
  const formatRupiah = (num: number) => {
    return 'Rp ' + Math.round(num).toLocaleString('id-ID');
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Helper for printing clean custom report tables via a hidden iframe
  const printReport = (title: string, headers: string[], rows: any[][]) => {
    const htmlContent = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 20px; color: #333; background: white; }
            h1 { font-size: 16px; font-weight: 800; text-align: center; margin-bottom: 5px; text-transform: uppercase; color: #1e1b4b; }
            h2 { font-size: 11px; font-weight: 600; text-align: center; margin-bottom: 25px; color: #475569; }
            table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 10px; }
            th { border: 1px solid #cbd5e1; padding: 10px 8px; background-color: #f1f5f9; font-weight: bold; text-align: left; text-transform: uppercase; font-size: 9px; color: #1e293b; }
            td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; color: #334155; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .text-right { text-align: right; font-weight: bold; }
            .text-center { text-align: center; }
            .font-mono { font-family: monospace; }
            .total-row { font-weight: bold; background-color: #e2e8f0 !important; }
          </style>
        </head>
        <body>
          <div style="border-bottom: 2px solid #1e1b4b; padding-bottom: 10px; margin-bottom: 15px; text-align: center;">
            <h3 style="margin: 0; font-size: 12px; color: #4f46e5; letter-spacing: 1px; font-weight: 800;">PERHIMPUNAN OPERATOR BENDAHARA ARKAS LARANGAN</h3>
            <h1 style="margin: 5px 0 0 0;">${title}</h1>
            <h2 style="margin: 5px 0 0 0;">Laporan Penatausahaan Dana BOSP Mandiri • Tahun Anggaran 2026</h2>
          </div>
          <p style="font-size: 10px; color: #64748b; margin-bottom: 10px; font-weight: 600;">Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
          <table>
            <thead>
              <tr>
                ${headers.map(h => `<th>${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${rows.map(row => `
                <tr>
                  ${row.map((cell, idx) => {
                    const h = headers[idx].toLowerCase();
                    const isRight = h.includes('biaya') || h.includes('pagu') || h.includes('nilai') || h.includes('rupiah') || (typeof cell === 'string' && cell.startsWith('Rp '));
                    const isCenter = h.includes('id') || h.includes('volume') || h.includes('tanggal') || h.includes('bulan') || h.includes('jumlah') || h.includes('status');
                    return `<td class="${isRight ? 'text-right' : isCenter ? 'text-center' : ''}">${cell}</td>`;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div style="margin-top: 50px; display: flex; justify-content: space-between; font-size: 10px; padding: 0 40px; page-break-inside: avoid;">
            <div>
              <p>Mengetahui,</p>
              <p style="margin-top: 60px; font-weight: bold; text-decoration: underline;">Ketua Perhimpunan</p>
            </div>
            <div>
              <p>Bendahara Pengeluaran,</p>
              <p style="margin-top: 60px; font-weight: bold; text-decoration: underline;">Operator Sekolah</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    }
  };

  const handlePrintTransactionTab = (category: 'BUKU' | 'ALAT' | 'SIPLAH') => {
    const targetCat = category === 'BUKU' ? 'BUKU' : category === 'ALAT' ? 'ALAT' : 'SIPLAH';
    const title = category === 'BUKU' ? 'Laporan Belanja Modal Buku' : category === 'ALAT' ? 'Laporan Belanja Modal Alat' : 'Laporan Belanja Habis Pakai';
    let items = filteredTransactions.filter((t) => t.kategori === targetCat);
    
    if (targetCat === 'SIPLAH' && monthFilterHabisPakai !== 'SEMUA') {
      items = items.filter((t) => getTxMonthName(t).toLowerCase() === monthFilterHabisPakai.toLowerCase());
    }
    
    const headers = ['ID', 'Nama Belanja', 'Sekolah', 'ID RAB', 'Volume', 'Total Biaya', 'Tanggal', 'Bulan', 'Status'];
    const rows = items.map((tx) => [
      tx.id,
      tx.nama_barang,
      tx.sekolah,
      tx.rab_id,
      tx.jumlah.toString(),
      formatRupiah(tx.total_biaya),
      tx.tanggal,
      getTxMonthName(tx),
      tx.status || 'Disetujui'
    ]);
    
    printReport(title, headers, rows);
    logActivity('Cetak Transaksi', `Cetak laporan transaksi ${targetCat}`);
  };

  const handleExportTransactionTabCsv = (category: 'BUKU' | 'ALAT' | 'SIPLAH') => {
    const targetCat = category === 'BUKU' ? 'BUKU' : category === 'ALAT' ? 'ALAT' : 'SIPLAH';
    const reportName = category === 'BUKU' ? 'MODAL-BUKU' : category === 'ALAT' ? 'MODAL-ALAT' : 'HABIS-PAKAI';
    
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF'; // Add BOM for excel indonesian formatting
    csvContent += 'ID;Nama Belanja;Sekolah;Kategori;ID RAB;Volume;Total Biaya;Tanggal;Bulan;Status\n';
    
    let items = filteredTransactions.filter((t) => t.kategori === targetCat);
    if (targetCat === 'SIPLAH' && monthFilterHabisPakai !== 'SEMUA') {
      items = items.filter((t) => getTxMonthName(t).toLowerCase() === monthFilterHabisPakai.toLowerCase());
    }

    items.forEach((item) => {
      csvContent += `"${item.id}";"${item.nama_barang}";"${item.sekolah}";"${item.kategori}";"${item.rab_id}";"${item.jumlah}";${item.total_biaya};"${item.tanggal}";"${getTxMonthName(item)}";"${item.status || 'Disetujui'}"\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PERBALA-${reportName}-2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    logActivity('Unduh Transaksi', `Ekspor file transaksi CSV ${reportName}`);
    addToast('Ekspor Sukses', `Berkas CSV ${reportName} berhasil diunduh.`, 'success');
  };

  const handlePrintTarikTunaiTab = () => {
    const title = 'Laporan Pengajuan Tarik Tunai Mandiri';
    const headers = ['ID Tarik', 'Sekolah Pemohon', 'Bulan', 'Pagu Bulanan', 'Nilai Realisasi', 'Status', 'Verifikator'];
    
    let items = filteredTarikTunai;
    if (monthFilterTarikTunai !== 'SEMUA') {
      items = items.filter((item) => item.bulan.toLowerCase().trim() === monthFilterTarikTunai.toLowerCase().trim());
    }

    const rows = items.map((item) => [
      item.id,
      item.sekolah,
      item.bulan,
      formatRupiah(item.pagu_bulanan),
      formatRupiah(item.nilai),
      item.status,
      item.verifikator || '-'
    ]);
    
    printReport(title, headers, rows);
    logActivity('Cetak Tarik Tunai', 'Cetak laporan transaksi Tarik Tunai');
  };

  const handleExportTarikTunaiTabCsv = () => {
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
    csvContent += 'ID Tarik;Sekolah Pemohon;Bulan;Pagu Bulanan;Nilai Realisasi;Status;Verifikator\n';
    
    let items = filteredTarikTunai;
    if (monthFilterTarikTunai !== 'SEMUA') {
      items = items.filter((item) => item.bulan.toLowerCase().trim() === monthFilterTarikTunai.toLowerCase().trim());
    }

    items.forEach((item) => {
      csvContent += `"${item.id}";"${item.sekolah}";"${item.bulan}";${item.pagu_bulanan};${item.nilai};"${item.status}";"${item.verifikator || '-'}"\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PERBALA-TARIK-TUNAI-2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    logActivity('Unduh Tarik Tunai', 'Ekspor file transaksi Tarik Tunai CSV');
    addToast('Ekspor Sukses', 'Berkas CSV Tarik Tunai berhasil diunduh.', 'success');
  };

  // Export CSV download helper
  const handleExportCsv = (reportType: 'siplah' | 'tarik' | 'laporan-tahunan') => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    if (reportType === 'siplah') {
      csvContent += 'No Transaksi,Nama Belanja Habis Pakai,Sekolah,ID RAB Terikat,Volume,Nilai Transaksi,Tanggal Bayar,Status\n';
      const items = transactions.filter((t) => t.kategori === 'SIPLAH' && isSchoolMatch(t.sekolah));
      items.forEach((item) => {
        csvContent += `"${item.id}","${item.nama_barang}","${item.sekolah}","${item.rab_id}","${item.jumlah}",${item.total_biaya},"${item.tanggal}","${item.status}"\n`;
      });
    } else if (reportType === 'tarik') {
      csvContent += 'ID Tarik,Sekolah,Bulan Penyerapan,Pagu Bulanan,Nilai Realisasi,Status,Verifikator\n';
      const items = tarikTunaiList.filter((t) => isSchoolMatch(t.sekolah));
      items.forEach((item) => {
        csvContent += `"${item.id}","${item.sekolah}","${item.bulan}",${item.pagu_bulanan},${item.nilai},"${item.status}","${item.verifikator}"\n`;
      });
    } else {
      csvContent += 'NPSN,Nama Sekolah,Pagu Tahunan,Realisasi Pengadaan + Tarik,Sisa Pagu Bersih,Status Laporan\n';
      schools.filter((s) => isSchoolMatch(s.nama)).forEach((sch) => {
        const totalPagu = sch.pagu_t1 + sch.pagu_t2;
        const spent = transactions
          .filter((t) => t.sekolah === sch.nama && t.status === 'Disetujui')
          .reduce((sum, curr) => sum + curr.total_biaya, 0);
        const withdrawn = tarikTunaiList
          .filter((t) => t.sekolah === sch.nama && t.status === 'Selesai')
          .reduce((sum, curr) => sum + curr.nilai, 0);
        const totalSpent = spent + withdrawn;
        csvContent += `"${sch.npsn}","${sch.nama}",${totalPagu},${totalSpent},${totalPagu - totalSpent},"Terverifikasi"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PERBALA-${reportType.toUpperCase()}-2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logActivity('Unduh Laporan', `Ekspor file laporan CSV ${reportType}`);
    addToast('Ekspor Sukses', `Berkas CSV berhasil diunduh ke perangkat Anda.`, 'success');
  };

  // Save Settings Config
  const handleSaveConfig = async (config: SystemConfig) => {
    localStorage.setItem('perbala_org_name', config.org_name);
    localStorage.setItem('perbala_logo_preset', config.logo_preset);
    localStorage.setItem('perbala_logo_url', config.logo_url);
    localStorage.setItem('perbala_deadline_t1', config.deadline_t1);
    localStorage.setItem('perbala_deadline_t2', config.deadline_t2);
    setSystemConfig(config);

    // Save to Express server config
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemConfig: config })
      });
    } catch (err) {
      console.error('Failed to sync system config to server:', err);
    }

    if (apiUrl) {
      try {
        await fetch(apiUrl, {
          method: 'POST',
          mode: 'cors',
          body: JSON.stringify({ action: 'saveConfig', config, operatorName: currentUser?.nama })
        });
      } catch (err) {}
    }
    addToast('Setelan Tersimpan', 'Pengaturan profile organisasi kustom Anda disimpan.', 'success');
    setCurrentTab('dashboard');
  };

  const handleResetConfig = async () => {
    localStorage.removeItem('perbala_org_name');
    localStorage.removeItem('perbala_logo_preset');
    localStorage.removeItem('perbala_logo_url');
    localStorage.removeItem('perbala_deadline_t1');
    localStorage.removeItem('perbala_deadline_t2');

    setSystemConfig(defaultSystemConfig);

    // Save default system config to Express server config
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemConfig: defaultSystemConfig })
      });
    } catch (err) {
      console.error('Failed to reset system config on server:', err);
    }

    addToast('Reset Setelan', 'Pengaturan profile dikembalikan ke default.', 'info');
  };

  // School Database CRUD actions
  const handleSchoolSubmit = async (school: School) => {
    let updatedSchools = [...schools];
    if (editingSchool) {
      updatedSchools = schools.map((s) => (s.npsn === editingSchool.npsn ? school : s));
    } else {
      updatedSchools.push(school);
    }
    setSchools(updatedSchools);
    setIsSchoolModalOpen(false);
    setEditingSchool(null);

    if (apiUrl) {
      try {
        await fetch(apiUrl, {
          method: 'POST',
          mode: 'cors',
          body: JSON.stringify({ action: 'saveSchool', school, operatorName: currentUser?.nama })
        });
      } catch (err) {}
    }
    addToast('Sekolah Disimpan', `Sekolah "${school.nama}" berhasil disimpan.`, 'success');
  };

  const handleSchoolDelete = (school: School) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Sekolah',
      message: `Apakah Anda yakin ingin menghapus data sekolah "${school.nama}" dari sistem monitoring?`,
      onConfirm: async () => {
        setSchools((prev) => prev.filter((s) => s.npsn !== school.npsn));
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));

        if (apiUrl) {
          try {
            await fetch(apiUrl, {
              method: 'POST',
              mode: 'cors',
              body: JSON.stringify({ action: 'deleteSchool', npsn: school.npsn, operatorName: currentUser?.nama })
            });
          } catch (err) {}
        }
        addToast('Lembaga Dihapus', `Sekolah "${school.nama}" dikeluarkan dari sistem.`, 'warning');
      }
    });
  };

  // User Operator CRUD actions
  const handleUserSubmit = async (user: Operator) => {
    let updatedUsers = [...operators];
    if (editingUser) {
      updatedUsers = operators.map((o) => (o.username === editingUser.username ? user : o));
    } else {
      updatedUsers.push(user);
    }
    setOperators(updatedUsers);
    setIsUserModalOpen(false);
    setEditingUser(null);

    if (apiUrl) {
      try {
        await fetch(apiUrl, {
          method: 'POST',
          mode: 'cors',
          body: JSON.stringify({ action: 'saveUser', user, operatorName: currentUser?.nama })
        });
      } catch (err) {}
    }
    addToast('Operator Disimpan', `Pengguna "${user.nama}" disimpan dengan peran ${user.role}.`, 'success');
  };

  const handleUserDelete = (user: Operator) => {
    if (user.username === 'admin') {
      addToast('Aksi Dilarang', 'Akun administrator utama tidak dapat dihapus.', 'error');
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Akses',
      message: `Hapus hak akses operator "${user.nama}" untuk instansi ${user.instansi}?`,
      onConfirm: async () => {
        setOperators((prev) => prev.filter((o) => o.username !== user.username));
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));

        if (apiUrl) {
          try {
            await fetch(apiUrl, {
              method: 'POST',
              mode: 'cors',
              body: JSON.stringify({ action: 'deleteUser', username: user.username, operatorName: currentUser?.nama })
            });
          } catch (err) {}
        }
        addToast('Operator Dihapus', 'Hak akses operator berhasil dicabut.', 'warning');
      }
    });
  };

  // RAB CRUD actions
  const handleRabSubmit = async (rab: RAB) => {
    let updatedRabs = [...rabList];
    const isEdit = rabList.some((r) => r.id === rab.id);
    if (isEdit) {
      updatedRabs = rabList.map((r) => (r.id === rab.id ? rab : r));
    } else {
      updatedRabs.push(rab);
    }
    setRabList(updatedRabs);
    setIsRabModalOpen(false);
    setEditingRab(null);

    if (apiUrl) {
      try {
        await fetch(apiUrl, {
          method: 'POST',
          mode: 'cors',
          body: JSON.stringify({ action: 'saveRab', rabData: rab, operatorName: currentUser?.nama })
        });
      } catch (err) {}
    }
    addToast('RAB Disimpan', `Rencana Anggaran Belanja "${rab.nama}" disimpan.`, 'success');
  };

  const handleRabDelete = (rab: RAB) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Item RAB',
      message: `Apakah Anda yakin ingin menghapus anggaran "${rab.nama}"? Seluruh transaksi terikat akan kehilangan referensi.`,
      onConfirm: async () => {
        setRabList((prev) => prev.filter((r) => r.id !== rab.id));
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));

        if (apiUrl) {
          try {
            await fetch(apiUrl, {
              method: 'POST',
              mode: 'cors',
              body: JSON.stringify({ action: 'deleteRab', id: rab.id, operatorName: currentUser?.nama })
            });
          } catch (err) {}
        }
        addToast('RAB Dihapus', 'Item anggaran RAB dikeluarkan.', 'warning');
      }
    });
  };

  // Transaction CRUD actions
  const handleTransactionSubmit = async (tx: Transaction) => {
    let updatedTx = [...transactions];
    const isEdit = transactions.some((t) => t.id === tx.id);
    if (isEdit) {
      updatedTx = transactions.map((t) => (t.id === tx.id ? tx : t));
    } else {
      updatedTx.unshift(tx);
    }
    setTransactions(updatedTx);
    setIsTransactionModalOpen(false);
    setEditingTransaction(null);

    if (apiUrl) {
      try {
        await fetch(apiUrl, {
          method: 'POST',
          mode: 'cors',
          body: JSON.stringify({ action: 'saveTransaction', transaction: tx, operatorName: currentUser?.nama })
        });
      } catch (err) {}
    }
    addToast('Realisasi Disimpan', `Belanja pengadaan "${tx.nama_barang}" berhasil tercatat.`, 'success');
  };

  const handleTransactionDelete = (tx: Transaction) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Realisasi',
      message: `Hapus catatan transaksi realisasi pengadaan "${tx.nama_barang}"? Anggaran akan kembali dipulihkan.`,
      onConfirm: async () => {
        setTransactions((prev) => prev.filter((t) => t.id !== tx.id));
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));

        if (apiUrl) {
          try {
            await fetch(apiUrl, {
              method: 'POST',
              mode: 'cors',
              body: JSON.stringify({ action: 'deleteTransaction', id: tx.id, operatorName: currentUser?.nama })
            });
          } catch (err) {}
        }
        addToast('Realisasi Dihapus', 'Catatan pengeluaran berhasil dihapus.', 'warning');
      }
    });
  };

  // Pagu Bulanan CRUD actions
  const handlePaguBulanSubmit = async (pagu: MonthlyPagu) => {
    const isEdit = monthlyPagu.some(
      (p) =>
        p.sekolah.toLowerCase().trim() === pagu.sekolah.toLowerCase().trim() &&
        p.bulan.toLowerCase().trim() === pagu.bulan.toLowerCase().trim()
    );

    let updatedPagu = [...monthlyPagu];
    if (isEdit) {
      updatedPagu = monthlyPagu.map((p) =>
        p.sekolah.toLowerCase().trim() === pagu.sekolah.toLowerCase().trim() &&
        p.bulan.toLowerCase().trim() === pagu.bulan.toLowerCase().trim()
          ? pagu
          : p
      );
    } else {
      updatedPagu.push(pagu);
    }

    setMonthlyPagu(updatedPagu);
    setIsPaguBulanOpen(false);
    setEditingPaguBulan(null);

    if (apiUrl) {
      try {
        await fetch(apiUrl, {
          method: 'POST',
          mode: 'cors',
          body: JSON.stringify({ action: 'saveMonthlyPagu', paguData: pagu, operatorName: currentUser?.nama })
        });
      } catch (err) {}
    }
    addToast('Pagu Diperbarui', `Alokasi pagu bulan ${pagu.bulan} untuk ${pagu.sekolah} disetel.`, 'success');
  };

  const handlePaguBulanDelete = (bulan: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Alokasi Bulanan',
      message: `Hapus seluruh pagu bulan ${bulan} untuk ${activeSchoolName}?`,
      onConfirm: async () => {
        setMonthlyPagu((prev) =>
          prev.filter(
            (p) =>
              !(
                p.sekolah.toLowerCase().trim() === activeSchoolName.toLowerCase().trim() &&
                p.bulan.toLowerCase().trim() === bulan.toLowerCase().trim()
              )
          )
        );
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));

        if (apiUrl) {
          try {
            await fetch(apiUrl, {
              method: 'POST',
              mode: 'cors',
              body: JSON.stringify({ action: 'deleteMonthlyPagu', sekolah: activeSchoolName, bulan, operatorName: currentUser?.nama })
            });
          } catch (err) {}
        }
        addToast('Pagu Dihapus', `Pagu bulanan ${bulan} dihapus.`, 'warning');
      }
    });
  };

  // Tarik Tunai CRUD actions
  const handleTarikTunaiSubmit = async (tarik: TarikTunai) => {
    let updatedTarik = [...tarikTunaiList];
    const isEdit = tarikTunaiList.some((t) => t.id === tarik.id);
    if (isEdit) {
      updatedTarik = tarikTunaiList.map((t) => (t.id === tarik.id ? tarik : t));
    } else {
      updatedTarik.unshift(tarik);
    }
    setTarikTunaiList(updatedTarik);
    setIsTarikTunaiModalOpen(false);
    setEditingTarikTunai(null);

    if (apiUrl) {
      try {
        await fetch(apiUrl, {
          method: 'POST',
          mode: 'cors',
          body: JSON.stringify({ action: 'saveTarikTunai', tarikData: tarik, operatorName: currentUser?.nama })
        });
      } catch (err) {}
    }
    addToast('Pengajuan Terkirim', `Tarik tunai ${formatRupiah(tarik.nilai)} diajukan dengan status Pending.`, 'success');
  };

  const handleTarikApprove = async (id: string) => {
    const updated = tarikTunaiList.map((t) =>
      t.id === id ? { ...t, status: 'Selesai' as const, verifikator: currentUser?.nama || 'Admin' } : t
    );
    setTarikTunaiList(updated);

    if (apiUrl) {
      try {
        await fetch(apiUrl, {
          method: 'POST',
          mode: 'cors',
          body: JSON.stringify({ action: 'updateTarikTunai', id, status: 'Selesai', verifikator: currentUser?.nama })
        });
      } catch (err) {}
    }
    addToast('Pencairan Selesai', 'Status pengajuan penarikan dana disetujui & lunas.', 'success');
  };

  const handleTarikReject = async (id: string) => {
    const updated = tarikTunaiList.map((t) =>
      t.id === id ? { ...t, status: 'Ditolak' as const, verifikator: currentUser?.nama || 'Admin' } : t
    );
    setTarikTunaiList(updated);

    if (apiUrl) {
      try {
        await fetch(apiUrl, {
          method: 'POST',
          mode: 'cors',
          body: JSON.stringify({ action: 'updateTarikTunai', id, status: 'Ditolak', verifikator: currentUser?.nama })
        });
      } catch (err) {}
    }
    addToast('Pencairan Ditolak', 'Pengajuan penarikan dana berhasil ditolak.', 'warning');
  };

  const handleTarikDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Tarik Tunai',
      message: 'Hapus catatan pengajuan tarik tunai ini?',
      onConfirm: async () => {
        setTarikTunaiList((prev) => prev.filter((t) => t.id !== id));
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));

        if (apiUrl) {
          try {
            await fetch(apiUrl, {
              method: 'POST',
              mode: 'cors',
              body: JSON.stringify({ action: 'deleteTarikTunai', id, operatorName: currentUser?.nama })
            });
          } catch (err) {}
        }
        addToast('Laporan Dihapus', 'Laporan tarik tunai berhasil dikeluarkan.', 'warning');
      }
    });
  };

  // Data importers
  const handleImportSchools = (newSchools: School[]) => {
    setSchools((prev) => {
      const filtered = prev.filter((s) => !newSchools.some((n) => n.npsn === s.npsn));
      return [...filtered, ...newSchools];
    });
    setIsImportModalOpen(false);
    addToast('Impor Berhasil', `${newSchools.length} Sekolah berhasil diimpor dari spreadsheet.`, 'success');
  };

  const handleImportOperators = (newOperators: Operator[]) => {
    setOperators((prev) => {
      const filtered = prev.filter((o) => !newOperators.some((n) => n.username === o.username));
      return [...filtered, ...newOperators];
    });
    setIsImportModalOpen(false);
    addToast('Impor Berhasil', `${newOperators.length} Operator Sekolah berhasil terdaftar.`, 'success');
  };

  // Render Login page if not authenticated
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative bg-slate-50 font-sans">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 shadow-lg shadow-purple-500/30 mb-4 text-white overflow-hidden">
              {systemConfig.logo_preset === 'custom' && systemConfig.logo_url ? (
                <img src={systemConfig.logo_url} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : systemConfig.logo_preset === 'preset-school' ? (
                <SchoolIcon className="w-8 h-8" />
              ) : systemConfig.logo_preset === 'preset-coins' ? (
                <Coins className="w-8 h-8" />
              ) : systemConfig.logo_preset === 'preset-book' ? (
                <BookOpen className="w-8 h-8" />
              ) : (
                <Wallet className="w-8 h-8" />
              )}
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-wide uppercase line-clamp-2">
              {systemConfig.org_name || 'MONITORING PERBALA'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">Perhimpunan Operator Bendahara ARKAS Larangan</p>
            <span className="inline-block mt-3 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-[10px] font-black tracking-widest uppercase">
              SISTEM BOSP
            </span>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                Username / Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="Masukkan username Anda"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-800 text-xs focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-12 text-slate-800 text-xs focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-500">
                <input type="checkbox" className="rounded border-slate-200 text-purple-600 focus:ring-0 w-4 h-4" />
                <span>Ingat Sesi Saya</span>
              </label>
              <button
                type="button"
                onClick={() =>
                  addToast(
                    'Akun Demo',
                    'Daftar Akun: Admin (pass: admin123) atau rusnoto.prasasti@gmail.com (pass: Sekardoja123)',
                    'info'
                  )
                }
                className="text-purple-600 hover:underline font-bold"
              >
                Kunci Demo Sesi?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoginLoading}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white font-extrabold rounded-xl shadow-lg shadow-purple-500/30 transition-all text-xs flex items-center justify-center gap-2"
            >
              {isLoginLoading ? (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <span>Masuk Sistem PERBALA</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <Toast toasts={toasts} onClose={removeToast} />
      </div>
    );
  }

  // Pending count for Tarik Tunai
  const pendingTarikCount = tarikTunaiList.filter((t) => t.status === 'Pending').length;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 font-sans text-slate-800">
      
      {/* Sidebar component */}
      <Sidebar
        currentUser={currentUser!}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onLogout={handleLogout}
        onRoleSwitch={handleRoleSwitch}
        pendingTarikCount={pendingTarikCount}
        systemConfig={systemConfig}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          currentTab={currentTab}
          currentUser={currentUser!}
          schools={schools}
          selectedSchoolFilter={schoolFilter}
          onSchoolFilterChange={setSchoolFilter}
          onLogout={handleLogout}
          systemName={systemConfig.org_name}
          syncStatus={syncStatus}
          lastSyncTime={lastSyncTime}
          onManualSync={loadDatabaseFromApi}
          syncErrorReason={syncErrorReason}
        />

        {/* View Renderings */}
        <div id="views-wrapper" className="p-6 md:p-8 space-y-8 flex-1">
          
          {/* ================= TAB 1: DASHBOARD ================= */}
          {currentTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden">
                  <div className="space-y-1 z-10">
                    <span className="text-[9px] font-black text-slate-500 tracking-widest uppercase block">TOTAL PAGU TAHUNAN</span>
                    <h3 className="text-sm md:text-base font-extrabold text-slate-800">{formatRupiah(totalPaguTahunan)}</h3>
                    <span className="inline-block text-[8px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-bold">Januari - Desember</span>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                    <Coins className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden">
                  <div className="space-y-1 z-10">
                    <span className="text-[9px] font-black text-slate-500 tracking-widest uppercase block">REALISASI TAHAP 1</span>
                    <h3 className="text-sm md:text-base font-extrabold text-purple-700">{formatRupiah(realisasiTahap1)}</h3>
                    <span className="inline-block text-[8px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded font-bold">
                      {realisasiTahap1Persen.toFixed(1)}% Berjalan
                    </span>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden">
                  <div className="space-y-1 z-10">
                    <span className="text-[9px] font-black text-slate-500 tracking-widest uppercase block">REALISASI TAHAP 2</span>
                    <h3 className="text-sm md:text-base font-extrabold text-indigo-700">{formatRupiah(realisasiTahap2)}</h3>
                    <span className="inline-block text-[8px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-bold">
                      {realisasiTahap2Persen.toFixed(1)}% Berjalan
                    </span>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                    <ArrowDownToLine className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden">
                  <div className="space-y-1 z-10">
                    <span className="text-[9px] font-black text-slate-500 tracking-widest uppercase block">REALISASI GLOBAL</span>
                    <h3 className="text-sm md:text-base font-extrabold text-emerald-700">{formatRupiah(realisasiGlobal)}</h3>
                    <span className="inline-block text-[8px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                      {realisasiGlobalPersen.toFixed(1)}% Berjalan
                    </span>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden">
                  <div className="space-y-1 z-10">
                    <span className="text-[9px] font-black text-slate-500 tracking-widest uppercase block">SISA PAGU BERSIH</span>
                    <h3 className="text-sm md:text-base font-extrabold text-blue-600">{formatRupiah(sisaAnggaranBersih)}</h3>
                    <span className="inline-block text-[8px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-bold">Kas Tersedia</span>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                    <Hourglass className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden">
                  <div className="space-y-1 z-10">
                    <span className="text-[9px] font-black text-slate-500 tracking-widest uppercase block">Lembaga Terdaftar</span>
                    <h3 className="text-sm md:text-base font-extrabold text-slate-700">{filteredSchools.length} Sekolah</h3>
                    <span className="inline-block text-[8px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-bold">Mitra Aktif BOSP</span>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Chart & Deadlines Visual Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-sm">
                  <div>
                    <h4 className="text-xs font-black text-slate-500 tracking-widest uppercase mb-1">
                      Grafik Anggaran vs Realisasi Bulanan
                    </h4>
                    <p className="text-[11px] text-slate-400">Komparasi alokasi pagu bulanan (Jan-Des)</p>
                  </div>

                  <div className="h-56 w-full pr-4 text-xs font-bold">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorPagu" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0f766e" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#0f766e" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 9 }} tickFormatter={(val) => `${val / 1000000}M`} />
                        <Tooltip formatter={(value: any) => formatRupiah(Number(value))} />
                        <Area type="monotone" dataKey="Pagu" stroke="#a855f7" fillOpacity={1} fill="url(#colorPagu)" strokeWidth={2} />
                        <Area type="monotone" dataKey="Realisasi" stroke="#0f766e" fillOpacity={1} fill="url(#colorReal)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between space-y-6 shadow-sm">
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-500 tracking-widest uppercase">Target & Progress Serapan</h4>
                    
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>Realisasi Tahap 1 (Bulan Jan-Jun)</span>
                        <span>{realisasiTahap1Persen.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-purple-600 h-full rounded-full transition-all"
                          style={{ width: `${realisasiTahap1Persen}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                        <span>Realisasi T1: {formatRupiah(realisasiTahap1)}</span>
                        <span>Pagu T1: {formatRupiah(totalPaguT1)}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>Realisasi Tahap 2 (Bulan Jul-Des)</span>
                        <span>{realisasiTahap2Persen.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all"
                          style={{ width: `${realisasiTahap2Persen}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                        <span>Realisasi T2: {formatRupiah(realisasiTahap2)}</span>
                        <span>Pagu T2: {formatRupiah(totalPaguT2)}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>Realisasi Global (Tahunan)</span>
                        <span>{realisasiGlobalPersen.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all"
                          style={{ width: `${realisasiGlobalPersen}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                        <span>Realisasi Global: {formatRupiah(realisasiGlobal)}</span>
                        <span>Total Pagu: {formatRupiah(totalPaguTahunan)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Deadline warning indicators */}
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl space-y-3">
                    <span className="text-[10px] font-black text-rose-700 uppercase tracking-widest flex items-center gap-1.5">
                      <AlarmClock className="w-4 h-4 text-rose-600" /> BATAS WAKTU PELAPORAN
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="bg-white p-2 rounded-lg border border-rose-100/60 font-semibold text-slate-600">
                        <span className="block text-[9px] text-slate-400">Semester 1:</span>
                        <span className="text-slate-800 font-extrabold">
                          {new Date(systemConfig.deadline_t1).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-rose-100/60 font-semibold text-slate-600">
                        <span className="block text-[9px] text-slate-400">Semester 2:</span>
                        <span className="text-slate-800 font-extrabold">
                          {new Date(systemConfig.deadline_t2).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Realisasi Transactions list */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800 tracking-wide">Aktivitas Belanja Terbaru</h4>
                    <p className="text-xs text-slate-500">Daftar transaksi realisasi pengadaan barang sekolah</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsTransactionModalOpen(true)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
                    >
                      <Plus className="w-4 h-4" /> Tambah Transaksi
                    </button>
                    <button
                      onClick={loadDatabaseFromApi}
                      className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl transition"
                      title="Sync data dari Google Sheets"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoadingData ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Filter buttons */}
                <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">Filter Kategori:</span>
                  {['SEMUA', 'BUKU', 'ALAT', 'SIPLAH'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setDashboardFilterCategory(cat)}
                      className={`px-3 py-1 text-xs font-bold rounded-full transition ${
                        dashboardFilterCategory === cat
                          ? 'bg-purple-600 text-white'
                          : 'bg-white text-slate-500 hover:text-slate-800 border border-slate-200'
                      }`}
                    >
                      {cat === 'SEMUA' ? 'Semua' : cat}
                    </button>
                  ))}
                </div>

                {/* Transactions Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                        <th className="py-3.5 px-6">ID Belanja</th>
                        <th className="py-3.5 px-6">Nama Barang / Belanja</th>
                        <th className="py-3.5 px-6">Sekolah</th>
                        <th className="py-3.5 px-6">Kategori</th>
                        <th className="py-3.5 px-6 text-center">Volume</th>
                        <th className="py-3.5 px-6 text-right">Total Biaya</th>
                        <th className="py-3.5 px-6 text-center">Tanggal</th>
                        <th className="py-3.5 px-6 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
                      {filteredTransactions
                        .filter((tx) => dashboardFilterCategory === 'SEMUA' || tx.kategori === dashboardFilterCategory)
                        .slice(0, 5)
                        .map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-50 transition duration-150">
                            <td className="py-3.5 px-6 font-mono text-slate-500">{tx.id}</td>
                            <td className="py-3.5 px-6 text-slate-800 font-bold">{tx.nama_barang}</td>
                            <td className="py-3.5 px-6 text-slate-500">{tx.sekolah}</td>
                            <td className="py-3.5 px-6">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-wider ${
                                tx.kategori === 'BUKU'
                                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                  : tx.kategori === 'ALAT'
                                  ? 'bg-cyan-100 text-cyan-700 border border-cyan-200'
                                  : 'bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200'
                              }`}>
                                {tx.kategori}
                              </span>
                            </td>
                            <td className="py-3.5 px-6 text-center text-slate-500">{tx.jumlah}</td>
                            <td className="py-3.5 px-6 text-right font-black text-emerald-700">{formatRupiah(tx.total_biaya)}</td>
                            <td className="py-3.5 px-6 text-center font-mono text-slate-400">{tx.tanggal}</td>
                            <td className="py-3.5 px-6 text-center">
                              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded text-[9px] font-bold">
                                Terbayar
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: DATA SEKOLAH ================= */}
          {currentTab === 'data-sekolah' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">Daftar Lembaga Sekolah Mitra</h3>
                  <p className="text-xs text-slate-500">Manajemen rincian data lembaga dan limit pagu</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setImportType('schools');
                      setIsImportModalOpen(true);
                    }}
                    className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" /> Impor Sekolah
                  </button>
                  <button
                    onClick={() => {
                      setEditingSchool(null);
                      setIsSchoolModalOpen(true);
                    }}
                    className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Tambah Sekolah
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                      <th className="py-3 px-4">NPSN</th>
                      <th className="py-3 px-4">Nama Sekolah</th>
                      <th className="py-3 px-4">Kecamatan</th>
                      <th className="py-3 px-4 text-center">Jumlah Siswa</th>
                      <th className="py-3 px-4 text-right">Pagu / Siswa</th>
                      <th className="py-3 px-4 text-right">Pagu T1 (50%)</th>
                      <th className="py-3 px-4 text-right">Pagu T2 (50%)</th>
                      <th className="py-3 px-4 text-right">Total Pagu</th>
                      <th className="py-3 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600 font-semibold">
                    {schools.map((sch) => {
                      const totalPagu = sch.pagu_t1 + sch.pagu_t2;
                      return (
                        <tr key={sch.npsn} className="hover:bg-slate-50 transition duration-150">
                          <td className="py-3 px-4 font-mono font-bold text-slate-500">{sch.npsn}</td>
                          <td className="py-3 px-4 text-slate-800 font-bold">{sch.nama}</td>
                          <td className="py-3 px-4 text-slate-500">{sch.kecamatan}</td>
                          <td className="py-3 px-4 text-center">{sch.jumlah_siswa}</td>
                          <td className="py-3 px-4 text-right font-bold">{formatRupiah(sch.pagu_per_siswa)}</td>
                          <td className="py-3 px-4 text-right text-amber-700 font-bold">{formatRupiah(sch.pagu_t1)}</td>
                          <td className="py-3 px-4 text-right text-indigo-700 font-bold">{formatRupiah(sch.pagu_t2)}</td>
                          <td className="py-3 px-4 text-right text-emerald-700 font-black">{formatRupiah(totalPagu)}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingSchool(sch);
                                  setIsSchoolModalOpen(true);
                                }}
                                className="p-1.5 hover:bg-amber-100 hover:text-amber-700 text-slate-400 rounded-lg transition"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleSchoolDelete(sch)}
                                className="p-1.5 hover:bg-rose-100 hover:text-rose-700 text-slate-400 rounded-lg transition"
                                title="Hapus"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= TAB 3: DATA ANGGOTA ================= */}
          {currentTab === 'data-anggota' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">Daftar Operator Sistem</h3>
                  <p className="text-xs text-slate-500">Manajemen hak akses & operator dinas / sekolah</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setImportType('operators');
                      setIsImportModalOpen(true);
                    }}
                    className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" /> Impor Operator
                  </button>
                  <button
                    onClick={() => {
                      setEditingUser(null);
                      setIsUserModalOpen(true);
                    }}
                    className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Tambah Operator
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                      <th className="py-3 px-4">Nama Lengkap</th>
                      <th className="py-3 px-4">Username / Email</th>
                      <th className="py-3 px-4">Kata Sandi</th>
                      <th className="py-3 px-4">Role / Peran</th>
                      <th className="py-3 px-4">Instansi</th>
                      <th className="py-3 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600 font-semibold">
                    {operators.map((o) => (
                      <tr key={o.username} className="hover:bg-slate-50 transition duration-150">
                        <td className="py-3 px-4 text-slate-800 font-bold">{o.nama}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{o.username}</td>
                        <td className="py-3 px-4 font-mono text-slate-400">••••••••</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-wider ${
                            o.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {o.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-medium">{o.instansi}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingUser(o);
                                setIsUserModalOpen(true);
                              }}
                              className="p-1.5 hover:bg-amber-100 hover:text-amber-700 text-slate-400 rounded-lg transition"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleUserDelete(o)}
                              className="p-1.5 hover:bg-rose-100 hover:text-rose-700 text-slate-400 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= TAB 4: PAGU ANGGARAN ================= */}
          {currentTab === 'pagu-anggaran' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <Coins className="text-purple-600 w-5 h-5" /> Atur Pagu Anggaran Utama
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Total pagu anggaran tahunan terkunci dan terdistribusi secara otomatis berdasarkan total akumulasi rencana pagu bulanan (Pagu Tiap Bulan) sekolah mitra aktif.
                </p>

                <div className="space-y-4 pt-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                      Total Pagu Tahunan (Rp)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={formatRupiah(totalPaguTahunan)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 font-black text-sm cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                      Alokasi Pagu Semester 1 / Tahap 1 (Bulan Jan - Jun)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={formatRupiah(totalPaguT1)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 font-black text-xs cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                      Alokasi Pagu Semester 2 / Tahap 2 (Bulan Jul - Des)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={formatRupiah(totalPaguT2)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 font-black text-xs cursor-not-allowed"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={loadDatabaseFromApi}
                      className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex justify-center items-center gap-2 transition"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Sinkronkan Ulang Seluruh Pagu</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-500 tracking-widest uppercase mb-4">Informasi Saringan Pagu</h4>
                  <div className="space-y-3.5 text-xs font-semibold">
                    <div className="flex justify-between border-b border-slate-100 pb-2.5">
                      <span className="text-slate-500">Lembaga Terfilter:</span>
                      <span className="text-slate-800 font-black">{activeSchoolName === 'SEMUA' ? 'Semua Sekolah' : activeSchoolName}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2.5">
                      <span className="text-slate-500">Total Pagu Kuota Terfilter:</span>
                      <span className="text-purple-700 font-black">{formatRupiah(totalPaguTahunan)}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2.5">
                      <span className="text-slate-500">Pagu Semester 1 (Tahap 1):</span>
                      <span className="text-amber-700 font-black">{formatRupiah(totalPaguT1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Pagu Semester 2 (Tahap 2):</span>
                      <span className="text-blue-700 font-black">{formatRupiah(totalPaguT2)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs text-emerald-800 font-bold">Koneksi Sesi Keuangan Aktif & Aman</span>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 5: PAGU TIAP BULAN ================= */}
          {currentTab === 'pagu-tiap-bulan' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                    <CalendarRange className="text-purple-600 w-5 h-5" /> Alokasi Pagu Bulanan Sekolah
                  </h3>
                  <p className="text-xs text-slate-505 font-medium">Distribusi penyerapan kuota dana sekolah se-Kabupaten tahun 2026</p>
                </div>
                <button
                  onClick={() => {
                    setEditingPaguBulan(null);
                    setIsPaguBulanOpen(true);
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Atur Pagu Bulanan
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[
                  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
                ].map((m) => {
                  const mPagus = filteredMonthlyPagu.filter((p) => p.bulan.toLowerCase().trim() === m.toLowerCase().trim());
                  const sumPagu = mPagus.reduce((sum, curr) => sum + curr.pagu, 0);

                  return (
                    <div key={m} className="p-4 bg-white border border-slate-200/80 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-sm space-y-3">
                      <div className="absolute top-0 left-0 w-1 h-full bg-purple-600"></div>
                      <div>
                        <span className="block text-[11px] font-black text-slate-400 uppercase tracking-wider">{m}</span>
                        <h4 className="text-xs font-bold text-slate-500 mt-0.5">{mPagus.length} Lembaga Tercatat</h4>
                        <span className="text-base font-extrabold text-slate-800 block mt-1">{formatRupiah(sumPagu)}</span>
                      </div>
                      <div className="flex items-center gap-1 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setEditingPaguBulan(m);
                            setIsPaguBulanOpen(true);
                          }}
                          className="px-2.5 py-1 text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition"
                        >
                          Edit Pagu
                        </button>
                        <button
                          onClick={() => handlePaguBulanDelete(m)}
                          className="px-2.5 py-1 text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= TAB 6, 7, 8: RAB KATEGORI (BUKU, ALAT, SIPLAH) ================= */}
          {(currentTab === 'anggaran-modal-buku' || currentTab === 'anggaran-modal-alat' || currentTab === 'anggaran-habis-pakai') && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">
                    Rencana Anggaran Belanja (RAB) - {currentTab === 'anggaran-modal-buku' ? 'Modal Buku' : currentTab === 'anggaran-modal-alat' ? 'Modal Alat' : 'Habis Pakai'}
                  </h3>
                  <p className="text-xs text-slate-500">Rincian alokasi sub-anggaran per satuan pengadaan barang</p>
                </div>
                <button
                  onClick={() => {
                    setEditingRab(null);
                    setIsRabModalOpen(true);
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Tambah Anggaran (RAB)
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                      <th className="py-3 px-4">ID RAB</th>
                      <th className="py-3 px-4">Nama Anggaran (RAB)</th>
                      <th className="py-3 px-4">Sekolah</th>
                      <th className="py-3 px-4">Kategori</th>
                      <th className="py-3 px-4 text-right">Alokasi Anggaran</th>
                      <th className="py-3 px-4 text-right">Realisasi Selesai</th>
                      <th className="py-3 px-4 text-right">Sisa Anggaran</th>
                      <th className="py-3 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600 font-semibold">
                    {rabList
                      .filter((r) => {
                        const targetCategory = currentTab === 'anggaran-modal-buku' ? 'BUKU' : currentTab === 'anggaran-modal-alat' ? 'ALAT' : 'SIPLAH';
                        return r.kategori === targetCategory && isSchoolMatch(r.sekolah);
                      })
                      .map((rab) => {
                        const rSpent = transactions
                          .filter((t) => t.rab_id === rab.id && t.status === 'Disetujui')
                          .reduce((sum, curr) => sum + curr.total_biaya, 0);
                        const rRemaining = rab.alokasi - rSpent;

                        return (
                          <tr key={rab.id} className="hover:bg-slate-50 transition duration-150">
                            <td className="py-3 px-4 font-mono font-bold text-slate-500">{rab.id}</td>
                            <td className="py-3 px-4 text-slate-800 font-bold">{rab.nama}</td>
                            <td className="py-3 px-4 text-slate-500">{rab.sekolah}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-[9px] font-bold">
                                {rab.kategori}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-black text-slate-800">{formatRupiah(rab.alokasi)}</td>
                            <td className="py-3 px-4 text-right font-bold text-amber-700">{formatRupiah(rSpent)}</td>
                            <td className="py-3 px-4 text-right font-black text-teal-700">{formatRupiah(rRemaining)}</td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => {
                                    setEditingRab(rab);
                                    setIsRabModalOpen(true);
                                  }}
                                  className="p-1.5 hover:bg-amber-100 hover:text-amber-700 text-slate-400 rounded-lg transition"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleRabDelete(rab)}
                                  className="p-1.5 hover:bg-rose-100 hover:text-rose-700 text-slate-400 rounded-lg transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= TAB 9, 10, 11: BELANJA KATEGORI (BUKU, ALAT, SIPLAH) ================= */}
          {(currentTab === 'belanja-modal-buku' || currentTab === 'belanja-modal-alat' || currentTab === 'belanja-habis-pakai') && (
            <div className="space-y-6">
              {/* Dynamic calculations specifically for selected tab category */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <span className="block text-[10px] font-black text-slate-400 tracking-widest uppercase">Pagu Sekolah</span>
                  {(() => {
                    const targetCat = currentTab === 'belanja-modal-buku' ? 'BUKU' : currentTab === 'belanja-modal-alat' ? 'ALAT' : 'SIPLAH';
                    const totalPaguKategori = rabList
                      .filter((r) => r.kategori === targetCat && isSchoolMatch(r.sekolah))
                      .reduce((sum, curr) => sum + curr.alokasi, 0);
                    return <h3 className="text-xl font-extrabold text-slate-800 mt-1">{formatRupiah(totalPaguKategori)}</h3>;
                  })()}
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <span className="block text-[10px] font-black text-slate-400 tracking-widest uppercase">Belanja Kategori Ini</span>
                  {(() => {
                    const targetCat = currentTab === 'belanja-modal-buku' ? 'BUKU' : currentTab === 'belanja-modal-alat' ? 'ALAT' : 'SIPLAH';
                    const sum = filteredTransactions
                      .filter((t) => {
                        if (t.kategori !== targetCat || t.status !== 'Disetujui') return false;
                        if (currentTab === 'belanja-habis-pakai' && monthFilterHabisPakai !== 'SEMUA') {
                          return getTxMonthName(t).toLowerCase() === monthFilterHabisPakai.toLowerCase();
                        }
                        return true;
                      })
                      .reduce((sum, curr) => sum + curr.total_biaya, 0);
                    return <h3 className="text-xl font-extrabold text-amber-700 mt-1">{formatRupiah(sum)}</h3>;
                  })()}
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <span className="block text-[10px] font-black text-slate-400 tracking-widest uppercase">Batas Kas Tersedia</span>
                  {(() => {
                    const targetCat = currentTab === 'belanja-modal-buku' ? 'BUKU' : currentTab === 'belanja-modal-alat' ? 'ALAT' : 'SIPLAH';
                    const totalPaguKategori = rabList
                      .filter((r) => r.kategori === targetCat && isSchoolMatch(r.sekolah))
                      .reduce((sum, curr) => sum + curr.alokasi, 0);
                    const sumAllTime = filteredTransactions
                      .filter((t) => t.kategori === targetCat && t.status === 'Disetujui')
                      .reduce((sum, curr) => sum + curr.total_biaya, 0);
                    const sisaLimit = totalPaguKategori - sumAllTime;
                    return <h3 className="text-xl font-extrabold text-teal-700 mt-1">{formatRupiah(sisaLimit)}</h3>;
                  })()}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800">
                      Rincian Transaksi - {currentTab === 'belanja-modal-buku' ? 'Modal Buku' : currentTab === 'belanja-modal-alat' ? 'Modal Alat' : 'Habis Pakai'}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">Berdasarkan data kuitansi pengadaan barang belanja sekolah</p>
                  </div>
                  <div className="flex items-center flex-wrap gap-2">
                    {currentTab === 'belanja-habis-pakai' && (
                      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700">
                        <span className="text-slate-400 font-medium">Bulan:</span>
                        <select
                          value={monthFilterHabisPakai}
                          onChange={(e) => setMonthFilterHabisPakai(e.target.value)}
                          className="bg-transparent border-none text-slate-800 font-black focus:outline-none cursor-pointer"
                        >
                          <option value="SEMUA">Semua Bulan</option>
                          {[...bulanTahap1, ...bulanTahap2].map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const cat = currentTab === 'belanja-modal-buku' ? 'BUKU' : currentTab === 'belanja-modal-alat' ? 'ALAT' : 'SIPLAH';
                        handlePrintTransactionTab(cat);
                      }}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200/80"
                      title="Cetak Laporan Transaksi"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-500" /> Cetak
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const cat = currentTab === 'belanja-modal-buku' ? 'BUKU' : currentTab === 'belanja-modal-alat' ? 'ALAT' : 'SIPLAH';
                        handleExportTransactionTabCsv(cat);
                      }}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200/80"
                      title="Unduh CSV Transaksi"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" /> Unduh
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTransaction(null);
                        setIsTransactionModalOpen(true);
                      }}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-purple-500/10"
                    >
                      <Plus className="w-4 h-4" /> Realisasi Baru
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                        <th className="py-3 px-4">ID</th>
                        <th className="py-3 px-4">Nama Belanja</th>
                        <th className="py-3 px-4">Sekolah</th>
                        <th className="py-3 px-4">Kategori</th>
                        <th className="py-3 px-4">ID RAB</th>
                        <th className="py-3 px-4 text-center">Volume</th>
                        <th className="py-3 px-4 text-right">Total Biaya</th>
                        <th className="py-3 px-4 text-center">Tanggal</th>
                        <th className="py-3 px-4 text-center">Bulan</th>
                        <th className="py-3 px-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600 font-semibold">
                      {filteredTransactions
                        .filter((t) => {
                          const targetCat = currentTab === 'belanja-modal-buku' ? 'BUKU' : currentTab === 'belanja-modal-alat' ? 'ALAT' : 'SIPLAH';
                          if (t.kategori !== targetCat) return false;
                          if (currentTab === 'belanja-habis-pakai' && monthFilterHabisPakai !== 'SEMUA') {
                            return getTxMonthName(t).toLowerCase() === monthFilterHabisPakai.toLowerCase();
                          }
                          return true;
                        })
                        .map((tx) => {
                          const isExpanded = expandedTxId === tx.id;
                          const relatedRab = rabList.find((r) => r.id === tx.rab_id);
                          return (
                            <React.Fragment key={tx.id}>
                              <tr className={`hover:bg-slate-50 transition duration-150 ${isExpanded ? 'bg-purple-50/20 border-l-4 border-l-purple-500' : ''}`}>
                                <td className="py-3 px-4 font-mono font-bold text-slate-500">{tx.id}</td>
                                <td className="py-3 px-4 text-slate-800 font-bold">{tx.nama_barang}</td>
                                <td className="py-3 px-4 text-slate-500">{tx.sekolah}</td>
                                <td className="py-3 px-4">
                                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[9px] font-bold">
                                    {tx.kategori}
                                  </span>
                                </td>
                                <td className="py-3 px-4 font-mono text-slate-500">{tx.rab_id}</td>
                                <td className="py-3 px-4 text-center">{tx.jumlah}</td>
                                <td className="py-3 px-4 text-right font-black text-emerald-700">{formatRupiah(tx.total_biaya)}</td>
                                <td className="py-3 px-4 text-center font-mono text-slate-400">{tx.tanggal}</td>
                                <td className="py-3 px-4 text-center">
                                  <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px] font-bold">
                                    {getTxMonthName(tx)}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => setExpandedTxId(isExpanded ? null : tx.id)}
                                      className={`p-1.5 rounded-lg transition ${
                                        isExpanded
                                          ? 'bg-purple-100 text-purple-700'
                                          : 'hover:bg-purple-50 hover:text-purple-600 text-slate-400'
                                      }`}
                                      title={isExpanded ? 'Sembunyikan Rincian' : 'Tampilkan Rincian'}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingTransaction(tx);
                                        setIsTransactionModalOpen(true);
                                      }}
                                      className="p-1.5 hover:bg-amber-100 hover:text-amber-700 text-slate-400 rounded-lg transition"
                                      title="Edit"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleTransactionDelete(tx)}
                                      className="p-1.5 hover:bg-rose-100 hover:text-rose-700 text-slate-400 rounded-lg transition"
                                      title="Hapus"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr className="bg-slate-50/50">
                                  <td colSpan={10} className="p-0">
                                    <div className="p-5 border-t border-b border-slate-100/80 space-y-4">
                                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                        {/* Left Side: General Info & Audit Trail */}
                                        <div className="flex-1 space-y-3">
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-slate-700 uppercase tracking-wide">KUITANSI REQUISITION / DETAIL TRANSAKSI</span>
                                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-black rounded-full uppercase tracking-widest">
                                              Approved
                                            </span>
                                          </div>
                                          
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-slate-600 text-[11px]">
                                            <div>
                                              <span className="text-[10px] text-slate-400 block font-bold">KODE TRANSAKSI</span>
                                              <span className="font-mono font-black text-slate-800">{tx.id}</span>
                                            </div>
                                            <div>
                                              <span className="text-[10px] text-slate-400 block font-bold">TANGGAL BAYAR / REALISASI</span>
                                              <span className="font-bold text-slate-800">{tx.tanggal}</span>
                                            </div>
                                            <div>
                                              <span className="text-[10px] text-slate-400 block font-bold">ASAL SEKOLAH (NPSN)</span>
                                              <span className="font-bold text-slate-800">{tx.sekolah} <span className="font-mono text-slate-400">({tx.npsn})</span></span>
                                            </div>
                                            <div>
                                              <span className="text-[10px] text-slate-400 block font-bold">KATEGORI ANGGARAN</span>
                                              <span className="font-bold text-indigo-700">{tx.kategori === 'BUKU' ? 'Modal Buku (Perpustakaan/Bos)' : tx.kategori === 'ALAT' ? 'Belanja Modal Alat (Inventaris)' : 'Belanja Habis Pakai / SIPLAH'}</span>
                                            </div>
                                            <div>
                                              <span className="text-[10px] text-slate-400 block font-bold">TERIKAT DENGAN REFERENSI RAB</span>
                                              <span className="font-semibold text-slate-800">
                                                ID: <span className="font-mono font-bold text-purple-600">[{tx.rab_id}]</span> {relatedRab ? relatedRab.nama : 'RAB tidak ditemukan'}
                                              </span>
                                            </div>
                                            <div>
                                              <span className="text-[10px] text-slate-400 block font-bold">JUMLAH KELUARAN (VOLUME)</span>
                                              <span className="font-bold text-slate-800">{tx.jumlah}</span>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Right Side: Elegant Invoice/Receipt Card */}
                                        <div className="w-full md:w-80 bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm space-y-3 shrink-0">
                                          <div className="border-b border-dashed border-slate-200 pb-3">
                                            <div className="flex justify-between items-center">
                                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">BUKTI PENGELUARAN</span>
                                              <Printer className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-pointer" onClick={() => window.print()} />
                                            </div>
                                            <h4 className="text-xs font-black text-slate-800 mt-1 truncate">{tx.nama_barang}</h4>
                                          </div>
                                          
                                          <div className="space-y-1.5 text-[11px]">
                                            <div className="flex justify-between">
                                              <span className="text-slate-400 font-medium">Beban Pagu (RAB)</span>
                                              <span className="text-slate-700 font-semibold">{relatedRab ? formatRupiah(relatedRab.alokasi) : '-'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-slate-400 font-medium">Volume</span>
                                              <span className="text-slate-700 font-semibold">{tx.jumlah}</span>
                                            </div>
                                            <div className="border-t border-slate-100 pt-2 flex justify-between items-center">
                                              <span className="text-slate-800 font-black">TOTAL PENCAIRAN</span>
                                              <span className="text-xs font-black text-emerald-700">{formatRupiah(tx.total_biaya)}</span>
                                            </div>
                                          </div>

                                          <div className="text-[9px] text-slate-400 bg-slate-50 border border-slate-100 p-2 rounded-lg font-bold text-center">
                                            Status: TERBAYAR SAH & DISINKRONISASI
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 12: TRANSAKSI TARIK TUNAI ================= */}
          {currentTab === 'transaksi-tarik-tunai' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                    <ArrowDownToLine className="text-amber-600 w-5 h-5" /> Pengajuan Tarik Tunai Mandiri
                  </h3>
                  <p className="text-xs text-slate-500">Mencairkan kuota anggaran tunai per bulan berdasarkan pagu terdaftar</p>
                </div>
                  <div className="flex items-center flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700">
                      <span className="text-slate-400 font-medium">Bulan:</span>
                      <select
                        value={monthFilterTarikTunai}
                        onChange={(e) => setMonthFilterTarikTunai(e.target.value)}
                        className="bg-transparent border-none text-slate-800 font-black focus:outline-none cursor-pointer"
                      >
                        <option value="SEMUA">Semua Bulan</option>
                        {[...bulanTahap1, ...bulanTahap2].map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={handlePrintTarikTunaiTab}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200/80"
                      title="Cetak Laporan Tarik Tunai"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-500" /> Cetak
                    </button>
                    <button
                      type="button"
                      onClick={handleExportTarikTunaiTabCsv}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200/80"
                      title="Unduh CSV Tarik Tunai"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" /> Unduh
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTarikTunai(null);
                        setIsTarikTunaiModalOpen(true);
                      }}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                    >
                      <Plus className="w-4 h-4" /> Ajukan Tarik Tunai
                    </button>
                  </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                      <th className="py-3 px-4">ID Tarik</th>
                      <th className="py-3 px-4">Sekolah Pemohon</th>
                      <th className="py-3 px-4">Bulan</th>
                      <th className="py-3 px-4 text-right">Pagu Bulanan</th>
                      <th className="py-3 px-4 text-right">Jumlah Tarik</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Verifikator</th>
                      <th className="py-3 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600 font-semibold">
                    {filteredTarikTunai
                      .filter((item) => {
                        if (monthFilterTarikTunai !== 'SEMUA') {
                          return item.bulan.toLowerCase().trim() === monthFilterTarikTunai.toLowerCase().trim();
                        }
                        return true;
                      })
                      .map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition duration-150">
                        <td className="py-3 px-4 font-mono font-bold text-slate-500">{item.id}</td>
                        <td className="py-3 px-4 text-slate-800 font-bold">{item.sekolah}</td>
                        <td className="py-3 px-4 text-slate-600 font-bold">{item.bulan}</td>
                        <td className="py-3 px-4 text-right">{formatRupiah(item.pagu_bulanan)}</td>
                        <td className="py-3 px-4 text-right font-black text-emerald-700">{formatRupiah(item.nilai)}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-wider ${
                            item.status === 'Selesai'
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : item.status === 'Ditolak'
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-amber-100 text-amber-700 border border-amber-200'
                          }`}>
                            {item.status === 'Selesai' ? 'Lunas / Selesai' : item.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-slate-400 font-bold">{item.verifikator}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {item.status === 'Selesai' && currentUser?.role !== 'Admin' ? (
                              <button
                                onClick={() => {
                                  setEditingTarikTunai(item);
                                  setIsTarikTunaiModalOpen(true);
                                }}
                                className="p-1.5 hover:bg-purple-100 hover:text-purple-700 text-purple-600 rounded-lg transition"
                                title="Lihat Rincian (Terkunci)"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingTarikTunai(item);
                                    setIsTarikTunaiModalOpen(true);
                                  }}
                                  className="p-1.5 hover:bg-amber-100 hover:text-amber-700 text-slate-400 rounded-lg transition"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleTarikDelete(item.id)}
                                  className="p-1.5 hover:bg-rose-100 hover:text-rose-700 text-slate-400 rounded-lg transition"
                                  title="Hapus"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= TAB 13: VALIDASI TARIK TUNAI (ADMIN) ================= */}
          {currentTab === 'validasi-tarik-tunai' && currentUser.role === 'Admin' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-slate-800">Panel Validasi Tarik Tunai</h3>
                <p className="text-xs text-slate-500">Persetujuan pencairan anggaran tunai kolektif sekolah se-Kabupaten</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                      <th className="py-3 px-4">ID Tarik</th>
                      <th className="py-3 px-4">Sekolah Pemohon</th>
                      <th className="py-3 px-4">Bulan</th>
                      <th className="py-3 px-4 text-right">Pagu Bulanan</th>
                      <th className="py-3 px-4 text-right">Nilai Tarik</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Tindakan Validasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600 font-semibold">
                    {tarikTunaiList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition duration-150">
                        <td className="py-3 px-4 font-mono font-bold text-slate-500">{item.id}</td>
                        <td className="py-3 px-4 text-slate-800 font-bold">{item.sekolah}</td>
                        <td className="py-3 px-4 font-bold text-slate-600">{item.bulan}</td>
                        <td className="py-3 px-4 text-right">{formatRupiah(item.pagu_bulanan)}</td>
                        <td className="py-3 px-4 text-right font-black text-emerald-700">{formatRupiah(item.nilai)}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-wider ${
                            item.status === 'Selesai'
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : item.status === 'Ditolak'
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-amber-100 text-amber-700 border border-amber-200'
                          }`}>
                            {item.status === 'Selesai' ? 'Disetujui / Lunas' : item.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {item.status === 'Pending' ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleTarikApprove(item.id)}
                                className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-bold transition"
                              >
                                Setujui
                              </button>
                              <button
                                onClick={() => handleTarikReject(item.id)}
                                className="px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[10px] font-bold transition"
                              >
                                Tolak
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-medium">Verifikator: {item.verifikator}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= TAB 14: REKAP MODAL BUKU & ALAT ================= */}
          {currentTab === 'rekap-modal' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-slate-800">Rekap Presentase Pembelanjaan Modal</h3>
                <p className="text-xs text-slate-500">Komparasi alokasi realisasi dana belanja Modal Buku dengan Modal Alat</p>
              </div>

              {(() => {
                const totalBuku = filteredTransactions
                  .filter((t) => t.kategori === 'BUKU' && t.status === 'Disetujui')
                  .reduce((sum, curr) => sum + curr.total_biaya, 0);

                const totalAlat = filteredTransactions
                  .filter((t) => t.kategori === 'ALAT' && t.status === 'Disetujui')
                  .reduce((sum, curr) => sum + curr.total_biaya, 0);

                const sumModal = Math.max(1, totalBuku + totalAlat);
                const pctBuku = ((totalBuku / sumModal) * 100).toFixed(1);
                const pctAlat = ((totalAlat / sumModal) * 100).toFixed(1);

                return (
                  <div className="space-y-6 text-xs font-semibold max-w-xl">
                    <div className="space-y-2">
                      <div className="flex justify-between text-slate-600 font-bold">
                        <span>Belanja Modal Buku</span>
                        <span className="text-slate-800 font-black">{formatRupiah(totalBuku)} ({pctBuku}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                        <div className="bg-purple-600 h-full rounded-full" style={{ width: `${pctBuku}%` }} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-slate-600 font-bold">
                        <span>Belanja Modal Alat</span>
                        <span className="text-slate-800 font-black">{formatRupiah(totalAlat)} ({pctAlat}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                        <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${pctAlat}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ================= TAB 15: REKAP HABIS PAKAI SIPLAH ================= */}
          {currentTab === 'rekap-habis-pakai' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                  <span className="block text-[10px] font-black text-slate-400 tracking-widest uppercase">
                    Total Belanja SIPLAH Habis Pakai
                  </span>
                  <h3 className="text-2xl font-black text-slate-800">{formatRupiah(totalSiplahHabisPakai)}</h3>
                  <p className="text-[10px] text-slate-500">Akumulasi realisasi transaksi belanja habis pakai melalui SIPLah</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="block text-[10px] font-black text-slate-400 tracking-widest uppercase">
                      Presentase Realisasi SIPLAH
                    </span>
                    <h3 className="text-2xl font-black text-slate-800">
                      {totalPaguTahunan > 0 ? ((totalSiplahHabisPakai / totalPaguTahunan) * 100).toFixed(1) : '0.0'}%
                    </h3>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
                    <div
                      className="bg-fuchsia-500 h-full rounded-full"
                      style={{ width: `${totalPaguTahunan > 0 ? (totalSiplahHabisPakai / totalPaguTahunan) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800">Rekapitulasi Belanja Habis Pakai SIPLah</h3>
                    <p className="text-xs text-slate-500">Seluruh rincian transaksi belanja penatausahaan kategori SIPLAH</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrint}
                      className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Printer className="w-4 h-4" /> Cetak Laporan
                    </button>
                    <button
                      onClick={() => handleExportCsv('siplah')}
                      className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Download className="w-4 h-4" /> Unduh CSV
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                        <th className="py-3 px-4">No Transaksi</th>
                        <th className="py-3 px-4">Nama Belanja Habis Pakai</th>
                        <th className="py-3 px-4">Sekolah</th>
                        <th className="py-3 px-4 font-mono">ID RAB Terikat</th>
                        <th className="py-3 px-4 text-center">Volume</th>
                        <th className="py-3 px-4 text-right">Nilai Transaksi</th>
                        <th className="py-3 px-4 text-center">Tanggal Bayar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600 font-semibold font-semibold">
                      {filteredTransactions
                        .filter((t) => t.kategori === 'SIPLAH' && t.status === 'Disetujui')
                        .map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50 transition duration-150">
                            <td className="py-3 px-4 font-mono font-bold text-slate-500">{item.id}</td>
                            <td className="py-3 px-4 text-slate-800 font-bold">{item.nama_barang}</td>
                            <td className="py-3 px-4 text-slate-500">{item.sekolah}</td>
                            <td className="py-3 px-4 font-mono text-slate-400">{item.rab_id}</td>
                            <td className="py-3 px-4 text-center">{item.jumlah}</td>
                            <td className="py-3 px-4 text-right font-black text-emerald-700">{formatRupiah(item.total_biaya)}</td>
                            <td className="py-3 px-4 text-center font-mono text-slate-400">{item.tanggal}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 16: VALIDASI LIMIT PAGU ================= */}
          {currentTab === 'validasi-pagu' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-slate-800">Validasi Batas Pengeluaran vs Pagu</h3>
                <p className="text-xs text-slate-500 font-medium">Memantau realisasi sekolah agar tidak melewati batas pagu tahunan</p>
              </div>

              <div className="space-y-4 max-w-2xl">
                {schools.map((sch) => {
                  const totalPagu = sch.pagu_t1 + sch.pagu_t2;
                  const spent = transactions
                    .filter((t) => t.sekolah === sch.nama && t.status === 'Disetujui')
                    .reduce((sum, curr) => sum + curr.total_biaya, 0);

                  const pct = totalPagu > 0 ? ((spent / totalPagu) * 100).toFixed(1) : '0.0';
                  const isOver = spent > totalPagu;

                  return (
                    <div
                      key={sch.npsn}
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 transition ${
                        isOver ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200 shadow-sm'
                      }`}
                    >
                      <div className="flex-1 w-full space-y-1.5">
                        <h4 className="font-bold text-slate-800 text-xs">{sch.nama}</h4>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isOver ? 'bg-rose-600' : 'bg-purple-600'}`}
                            style={{ width: `${Math.min(100, parseFloat(pct))}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                          <span>Realisasi: {formatRupiah(spent)}</span>
                          <span>Pagu Limit: {formatRupiah(totalPagu)}</span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        {isOver ? (
                          <span className="px-2.5 py-1 bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-black">
                            Overbudget!
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-black">
                            Aman ({pct}%)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= TAB 17: LAPORAN TAHUNAN ================= */}
          {currentTab === 'laporan-tahunan' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">Laporan Neraca Tahunan Terintegrasi</h3>
                  <p className="text-xs text-slate-505">Kompilasi rekapitulasi data keuangan seluruh sekolah se-Kabupaten tahun 2026</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Printer className="w-4 h-4" /> Cetak Laporan
                  </button>
                  <button
                    onClick={() => handleExportCsv('laporan-tahunan')}
                    className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" /> Ekspor CSV
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                      <th className="py-3 px-4">NPSN</th>
                      <th className="py-3 px-4">Nama Sekolah</th>
                      <th className="py-3 px-4 text-right">Pagu Tahunan</th>
                      <th className="py-3 px-4 text-right">Realisasi (Realisasi + Tarik)</th>
                      <th className="py-3 px-4 text-right">Sisa Pagu Bersih</th>
                      <th className="py-3 px-4 text-center">Status Laporan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600 font-semibold font-semibold">
                    {schools
                      .filter((s) => isSchoolMatch(s.nama))
                      .map((sch) => {
                        const totalPagu = sch.pagu_t1 + sch.pagu_t2;
                        const spent = transactions
                          .filter((t) => t.sekolah === sch.nama && t.status === 'Disetujui')
                          .reduce((sum, curr) => sum + curr.total_biaya, 0);
                        const withdrawn = tarikTunaiList
                          .filter((t) => t.sekolah === sch.nama && t.status === 'Selesai')
                          .reduce((sum, curr) => sum + curr.nilai, 0);

                        const totalSpent = spent + withdrawn;
                        const remaining = totalPagu - totalSpent;

                        return (
                          <tr key={sch.npsn} className="hover:bg-slate-50 transition duration-150">
                            <td className="py-3 px-4 font-mono font-bold text-slate-505">{sch.npsn}</td>
                            <td className="py-3 px-4 text-slate-800 font-bold">{sch.nama}</td>
                            <td className="py-3 px-4 text-right font-bold text-slate-800">{formatRupiah(totalPagu)}</td>
                            <td className="py-3 px-4 text-right text-emerald-700 font-bold">{formatRupiah(totalSpent)}</td>
                            <td className="py-3 px-4 text-right text-blue-700 font-bold">{formatRupiah(remaining)}</td>
                            <td className="py-3 px-4 text-center">
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[9px] font-bold">
                                Terverifikasi
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= TAB 18: PENGATURAN SYSTEM ================= */}
          {currentTab === 'pengaturan' && currentUser.role === 'Admin' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 max-w-lg">
              <div>
                <h3 className="text-base font-extrabold text-slate-800">Pengaturan Profil Instansi & Organisasi</h3>
                <p className="text-xs text-slate-500">Personalisasi logo, nama lembaga, & batas waktu pelaporan</p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveConfig(systemConfig);
                }}
                className="space-y-4 text-xs font-semibold"
              >
                <div>
                  <label className="block text-slate-600 mb-1.5">Nama Organisasi / Dinas Lembaga</label>
                  <input
                    type="text"
                    required
                    value={systemConfig.org_name}
                    onChange={(e) => setSystemConfig({ ...systemConfig, org_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1.5">Logo / Icon Organisasi</label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-3">
                    {[
                      { id: 'preset-wallet', label: 'Wallet', icon: <Wallet className="w-5 h-5 text-purple-600" /> },
                      { id: 'preset-school', label: 'Sekolah', icon: <SchoolIcon className="w-5 h-5 text-amber-600" /> },
                      { id: 'preset-coins', label: 'Koin', icon: <Coins className="w-5 h-5 text-emerald-600" /> },
                      { id: 'preset-book', label: 'Buku', icon: <BookOpen className="w-5 h-5 text-blue-600" /> },
                      { id: 'custom', label: 'Kustom', icon: <Upload className="w-5 h-5 text-slate-600" /> }
                    ].map((p) => {
                      const active = systemConfig.logo_preset === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSystemConfig({ ...systemConfig, logo_preset: p.id })}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                            active
                              ? 'border-purple-600 bg-purple-50 text-purple-800 ring-2 ring-purple-100'
                              : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                          }`}
                        >
                          {p.icon}
                          <span className="text-[10px] mt-1 font-bold">{p.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {systemConfig.logo_preset === 'custom' && (
                    <div className="space-y-3">
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const files = e.dataTransfer.files;
                          if (files && files.length > 0) {
                            const file = files[0];
                            if (file.type.startsWith('image/')) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                setSystemConfig({
                                  ...systemConfig,
                                  logo_url: reader.result as string
                                });
                              };
                              reader.readAsDataURL(file);
                            }
                          }
                        }}
                        className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center bg-slate-50 hover:bg-slate-100/70 transition cursor-pointer relative"
                        onClick={() => {
                          const fileInput = document.getElementById('logo-file-input');
                          if (fileInput) fileInput.click();
                        }}
                      >
                        <input
                          id="logo-file-input"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const files = e.target.files;
                            if (files && files.length > 0) {
                              const file = files[0];
                              const reader = new FileReader();
                              reader.onload = () => {
                                setSystemConfig({
                                  ...systemConfig,
                                  logo_url: reader.result as string
                                });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        {systemConfig.logo_url ? (
                          <div className="flex flex-col items-center gap-2">
                            <img
                              src={systemConfig.logo_url}
                              alt="Logo Kustom"
                              className="w-16 h-16 object-cover rounded-xl border border-slate-200"
                              referrerPolicy="no-referrer"
                            />
                            <span className="text-[10px] text-purple-600 font-bold underline">Ubah Gambar</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex justify-center text-slate-400">
                              <Upload className="w-6 h-6" />
                            </div>
                            <p className="text-[11px] text-slate-600 font-bold">Tarik & lepas gambar di sini, atau klik untuk memilih</p>
                            <p className="text-[9px] text-slate-400">Format PNG, JPG, JPEG (Maks. 2MB)</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 mb-1.5">Batas Waktu Tahap 1</label>
                    <input
                      type="date"
                      required
                      value={systemConfig.deadline_t1}
                      onChange={(e) => setSystemConfig({ ...systemConfig, deadline_t1: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1.5">Batas Waktu Tahap 2</label>
                    <input
                      type="date"
                      required
                      value={systemConfig.deadline_t2}
                      onChange={(e) => setSystemConfig({ ...systemConfig, deadline_t2: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl transition"
                  >
                    Simpan Perubahan
                  </button>
                  <button
                    type="button"
                    onClick={handleResetConfig}
                    className="px-4 py-3 bg-slate-100 text-slate-500 rounded-xl hover:text-slate-800 transition"
                  >
                    Reset Default
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

        {/* Footer info brand */}
        <footer className="mt-auto py-5 text-center text-[11px] text-slate-400 border-t border-slate-200 bg-white">
          <p>© 2026 Laporan Monitoring PERBALA. Hak Cipta Dilindungi Undang-Undang.</p>
          <p className="mt-1 text-[9px] font-bold">
            Database Sync State:{' '}
            <span className="text-emerald-600">
              Sinkronisasi Awan Real-Time Aktif
            </span>
          </p>
        </footer>
      </main>

      {/* ================= MODAL COMPONENTS MOUNTING ================= */}
      
      {/* School Add/Edit Modal */}
      <SchoolModal
        isOpen={isSchoolModalOpen}
        initialData={editingSchool}
        onSubmit={handleSchoolSubmit}
        onCancel={() => {
          setIsSchoolModalOpen(false);
          setEditingSchool(null);
        }}
      />

      {/* User Add/Edit Modal */}
      <UserModal
        isOpen={isUserModalOpen}
        initialData={editingUser}
        schools={schools}
        onSubmit={handleUserSubmit}
        onCancel={() => {
          setIsUserModalOpen(false);
          setEditingUser(null);
        }}
      />

      {/* RAB Add/Edit Modal */}
      <RabModal
        isOpen={isRabModalOpen}
        initialData={editingRab}
        schools={schools}
        currentUser={currentUser}
        onSubmit={handleRabSubmit}
        onCancel={() => {
          setIsRabModalOpen(false);
          setEditingRab(null);
        }}
      />

      {/* Realisasi Transaction Add/Edit Modal */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        initialData={editingTransaction}
        schools={schools}
        currentUser={currentUser}
        rabList={rabList}
        transactions={transactions}
        onSubmit={handleTransactionSubmit}
        onCancel={() => {
          setIsTransactionModalOpen(false);
          setEditingTransaction(null);
        }}
      />

      {/* Tarik Tunai submission modal */}
      <TarikTunaiModal
        isOpen={isTarikTunaiModalOpen}
        initialData={editingTarikTunai}
        schools={schools}
        currentUser={currentUser!}
        monthlyPagu={monthlyPagu}
        tarikTunaiList={tarikTunaiList}
        transactions={transactions}
        onSubmit={handleTarikTunaiSubmit}
        onCancel={() => {
          setIsTarikTunaiModalOpen(false);
          setEditingTarikTunai(null);
        }}
      />

      {/* Monthly Pagu modal */}
      <PaguBulanModal
        isOpen={isPaguBulanModalOpen}
        initialBulan={editingPaguBulan}
        schools={schools}
        currentUser={currentUser}
        monthlyPagu={monthlyPagu}
        onSubmit={handlePaguBulanSubmit}
        onCancel={() => {
          setIsPaguBulanOpen(false);
          setEditingPaguBulan(null);
        }}
      />

      {/* TSV Data Importer Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        type={importType}
        onImportSchools={handleImportSchools}
        onImportOperators={handleImportOperators}
        onCancel={() => setIsImportModalOpen(false)}
      />

      {/* Confirmation Actions Dialog Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Toast Notifications Panel */}
      <Toast toasts={toasts} onClose={removeToast} />
    </div>
  );

  // Helper local states for modal open/close to maintain naming
  function setIsPaguBulanOpen(isOpen: boolean) {
    setIsPaguBulanModalOpen(isOpen);
  }
}
