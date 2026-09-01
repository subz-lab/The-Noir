import React, { useState, useEffect } from 'react';
import DataTable from './DataTable';
import StatusBadge from './StatusBadge';
import { ShieldAlert, Filter, Download, Zap } from 'lucide-react';
import { fetchSOARPlaybooks, executePlaybook } from '../api';

/**
 * Enterprise Incident Panel for SOC Triage.
 * Uses the Atomic DataTable for clean, scalable data presentation.
 */
const IncidentPanel = ({ incidents = [] }) => {
    const [playbooks, setPlaybooks] = useState([]);
    const [executingId, setExecutingId] = useState(null);

    useEffect(() => {
        fetchSOARPlaybooks().then(setPlaybooks).catch(console.error);
    }, []);

    const handleExecute = async (incidentId, playbookId, incidentData) => {
        setExecutingId(incidentId);
        try {
            await executePlaybook(playbookId, incidentData);
            // Optionally could fire a toast here
        } catch (e) {
            console.error("Failed executing playbook:", e);
        } finally {
            setTimeout(() => setExecutingId(null), 1000);
        }
    };

    const columns = [
        {
            header: 'Severity',
            key: 'severity',
            width: '100px',
            render: (val) => <StatusBadge type={val}>{val}</StatusBadge>
        },
        { header: 'Incident ID', key: 'id', width: '120px' },
        { header: 'Vector', key: 'type', width: '150px' },
        {
            header: 'Origin IP',
            key: 'source_ip',
            render: (val) => <span className="font-mono text-blue-400">{val}</span>
        },
        { header: 'Status', key: 'status', width: '120px' },
        {
            header: 'Timestamp',
            key: 'timestamp',
            render: (val) => <span className="text-[10px] text-white/30 italic">{val}</span>
        },
        {
            header: 'Actions',
            key: 'actions',
            width: '160px',
            render: (_, row) => (
                <div className="flex gap-2 relative group">
                    {playbooks.length > 0 ? (
                        <div className="relative inline-block z-10 w-full group/dropdown">
                            <button className="flex w-full items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white border border-blue-500/20 hover:border-blue-500 transition-colors text-[10px] font-bold uppercase tracking-wider relative overflow-hidden">
                                {executingId === row.id ? (
                                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Zap className="w-3 h-3" /> Execute
                                    </>
                                )}
                            </button>
                            {/* Dropdown Menu */}
                            <div className="absolute right-0 top-full mt-1 w-48 bg-[#0a0a0c] border border-white/10 rounded-lg shadow-xl shadow-black/50 opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all pointer-events-none group-hover/dropdown:pointer-events-auto origin-top-right transform scale-95 group-hover/dropdown:scale-100">
                                <div className="p-1 uppercase text-[8px] font-bold text-white/30 tracking-widest text-center border-b border-white/5 mb-1">Select Playbook</div>
                                {playbooks.map(pb => (
                                    <button
                                        key={pb.id}
                                        onClick={() => handleExecute(row.id, pb.id, row)}
                                        className="w-full text-left px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full ${pb.is_active ? 'bg-emerald-500' : 'bg-white/20'}`} />
                                        {pb.name} 
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                         <span className="text-[10px] text-white/20 uppercase tracking-widest inline-block px-3 py-1.5 border border-white/5 rounded-md">No Playbooks</span>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-center gap-3">
                    <ShieldAlert className="w-5 h-5 text-rose-500" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-tight font-outfit">Active Incidents</h3>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/40">
                        <Filter className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/40">
                        <Download className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={incidents}
                className="flex-1"
            />
        </div>
    );
};

export default IncidentPanel;
