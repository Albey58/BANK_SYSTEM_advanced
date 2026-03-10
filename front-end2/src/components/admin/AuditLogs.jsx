import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Activity, RefreshCcw } from 'lucide-react';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/admin/audit-logs');
            setLogs(response.data.logs || []);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch audit logs:', err);
            setError('Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    if (loading) return <div style={{ fontWeight: 'bold', padding: '1rem', border: '3px solid #000' }}>Loading audit logs...</div>;
    if (error) return <div style={{ background: '#ff0000', color: '#fff', fontWeight: 'bold', padding: '1rem', border: '3px solid #000' }}>{error}</div>;

    return (
        <div className="neo-card" style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '3px solid #000', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: '#000', padding: '0.5rem', border: '3px solid #000' }}>
                        <Activity size={24} color="#fff" strokeWidth={3} />
                    </div>
                    <h3 style={{ textTransform: 'uppercase', fontWeight: 900, fontSize: '1.5rem', margin: 0 }}>System Audit Logs</h3>
                </div>
                <button 
                    onClick={fetchLogs} 
                    className="neo-btn" 
                    style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 'auto' }}
                    title="Refresh Logs"
                >
                    <RefreshCcw size={16} />
                </button>
            </div>
            
            <div style={{ overflowX: 'auto', border: '3px solid #000' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace' }}>
                    <thead style={{ background: '#000', color: '#fff', textTransform: 'uppercase', fontWeight: 900 }}>
                        <tr>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Time</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Action</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Table</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Record ID</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Change</th>
                        </tr>
                    </thead>
                    <tbody style={{ background: '#fff', color: '#000' }}>
                        {logs.length > 0 ? (
                            logs.map((log) => (
                                <tr key={log.log_id} style={{ borderBottom: '1px solid #000' }}>
                                    <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                                        {new Date(log.changed_at).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{ 
                                            background: log.action_type === 'INSERT' ? '#00ff00' : log.action_type === 'DELETE' ? '#ff0000' : '#00ffff',
                                            color: log.action_type === 'DELETE' ? '#fff' : '#000',
                                            padding: '2px 6px',
                                            fontWeight: 'bold',
                                            textTransform: 'uppercase',
                                            fontSize: '0.8rem',
                                            border: '2px solid #000'
                                        }}>
                                            {log.action_type}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{log.table_name}</td>
                                    <td style={{ padding: '1rem', fontFamily: 'monospace' }} title={log.record_id}>
                                        {log.record_id?.substring(0, 8)}...
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right', fontFamily: 'monospace' }}>
                                        {log.old_value !== null && (
                                            <span style={{ color: '#ff0000', marginRight: '0.5rem' }}>
                                                {parseFloat(log.old_value).toFixed(2)}
                                            </span>
                                        )}
                                        {log.old_value !== null && log.new_value !== null && (
                                            <span style={{ fontWeight: 'bold' }}>→</span>
                                        )}
                                        {log.new_value !== null && (
                                            <span style={{ color: '#00b300', marginLeft: '0.5rem', fontWeight: 'bold' }}>
                                                {parseFloat(log.new_value).toFixed(2)}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', fontStyle: 'italic' }}>
                                    No audit logs found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AuditLogs;
