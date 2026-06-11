'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Megaphone, Trash2, X } from 'lucide-react';

const iconMap = {
    warning: AlertTriangle,
    campaign: Megaphone,
    delete: Trash2,
};

const colorMap = {
    red: {
        bg: 'bg-red-50',
        iconBg: 'bg-red-100',
        iconText: 'text-red-600',
        button: 'bg-red-500 hover:bg-red-600 shadow-red-500/30',
    },
    blue: {
        bg: 'bg-blue-50',
        iconBg: 'bg-blue-100',
        iconText: 'text-blue-600',
        button: 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/30',
    },
    orange: {
        bg: 'bg-orange-50',
        iconBg: 'bg-orange-100',
        iconText: 'text-orange-600',
        button: 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30',
    },
    green: {
        bg: 'bg-emerald-50',
        iconBg: 'bg-emerald-100',
        iconText: 'text-emerald-600',
        button: 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30',
    },
};

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Konfirmasi',
    message = 'Apakah Anda yakin?',
    icon = 'warning',
    color = 'red',
    confirmText = 'Ya, Lanjutkan',
    cancelText = 'Batal',
}) {
    const IconComponent = iconMap[icon] || AlertTriangle;
    const colors = colorMap[color] || colorMap.red;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    >
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            <X size={18} />
                        </button>

                        <div className="p-6 text-center">
                            {/* Icon */}
                            <div className={`mx-auto w-14 h-14 ${colors.iconBg} rounded-full flex items-center justify-center mb-4`}>
                                <IconComponent size={28} className={colors.iconText} />
                            </div>

                            {/* Title */}
                            <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>

                            {/* Message */}
                            <p className="text-sm text-gray-500 mb-6">{message}</p>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-2.5 px-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors text-sm"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={() => {
                                        onConfirm();
                                        onClose();
                                    }}
                                    className={`flex-1 py-2.5 px-4 text-white rounded-xl font-semibold shadow-lg transition-all text-sm ${colors.button}`}
                                >
                                    {confirmText}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
