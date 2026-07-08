/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface ToastProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

export default function Toast({ toasts, onClose }: ToastProps) {
  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          let Icon = Info;
          let iconColor = 'text-purple-600 bg-purple-500/10 border-purple-500/20';
          let borderColor = 'border-purple-500/30';

          if (toast.type === 'success') {
            Icon = CheckCircle;
            iconColor = 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20';
            borderColor = 'border-emerald-500/30';
          } else if (toast.type === 'warning') {
            Icon = AlertTriangle;
            iconColor = 'text-amber-600 bg-amber-500/10 border-amber-500/20';
            borderColor = 'border-amber-500/30';
          } else if (toast.type === 'error') {
            Icon = XCircle;
            iconColor = 'text-rose-600 bg-rose-500/10 border-rose-500/20';
            borderColor = 'border-rose-500/30';
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className={`pointer-events-auto w-full bg-white border ${borderColor} shadow-2xl rounded-xl p-4 flex items-start gap-3`}
            >
              <div className={`p-2 rounded-lg border ${iconColor}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-slate-800">{toast.title}</h4>
                <p className="text-xs text-slate-500 mt-1 break-words">{toast.message}</p>
              </div>
              <button
                onClick={() => onClose(toast.id)}
                className="flex-shrink-0 text-slate-400 hover:text-slate-600 p-0.5 rounded-lg hover:bg-slate-50 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
