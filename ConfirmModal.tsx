/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">{title}</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition-colors"
              >
                Ya, Lanjutkan
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
