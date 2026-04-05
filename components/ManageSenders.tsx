import React, { useState } from 'react';
import { PREDEFINED_SENDERS } from '../constants';

interface ManageSendersProps {
    senders: string[];
    onAdd: (name: string) => void;
    onDelete: (name: string) => void;
}

/**
 * ManageSenders Component
 * @description Manage income sender list with validation for duplicates and empty entries
 * @param {string[]} senders - List of all senders (default + custom)
 * @param {Function} onAdd - Callback to add new sender
 * @param {Function} onDelete - Callback to delete custom sender
 * @returns Sender management interface with form and list
 */
export const ManageSenders: React.FC<ManageSendersProps> = ({ senders, onAdd, onDelete }) => {
    const [newSender, setNewSender] = useState('');
    const [error, setError] = useState('');

    const handleAdd = () => {
        if (!newSender.trim()) {
            setError('Sender name cannot be empty');
            return;
        }
        if (senders.includes(newSender)) {
            setError('Sender already exists');
            return;
        }
        onAdd(newSender);
        setNewSender('');
        setError('');
    };

    const isDefault = (sender: string) => PREDEFINED_SENDERS.includes(sender);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-100 mb-6">Manage Senders</h1>

                <div className="bg-slate-800/50 rounded-lg p-6 mb-8">
                    <h2 className="text-xl font-semibold text-slate-100 mb-4">Add New Sender</h2>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newSender}
                            onChange={(e) => {
                                setNewSender(e.target.value);
                                setError('');
                            }}
                            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                            placeholder="Enter sender name"
                            className="flex-1 px-4 py-2 bg-slate-700 text-slate-100 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                        />
                        <button
                            onClick={handleAdd}
                            className="px-6 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors"
                        >
                            Add
                        </button>
                    </div>
                    {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                </div>

                <div className="space-y-3">
                    <h2 className="text-xl font-semibold text-slate-100">Senders List</h2>
                    <div className="space-y-2">
                        {senders.length === 0 ? (
                            <p className="text-slate-400">No senders added yet</p>
                        ) : (
                            senders.map((sender) => (
                                <div
                                    key={sender}
                                    className="flex items-center justify-between bg-slate-800/50 p-4 rounded border border-slate-700"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-slate-100">{sender}</span>
                                        {isDefault(sender) && (
                                            <span className="px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded">
                                                Default
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => onDelete(sender)}
                                        disabled={isDefault(sender)}
                                        className={`px-4 py-2 rounded font-medium transition-colors ${isDefault(sender)
                                            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                            : 'bg-red-600 text-white hover:bg-red-700'
                                            }`}
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
