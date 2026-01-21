import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart2, Edit2 } from 'lucide-react';
import './DashboardWidgets.css';

const DEFAULT_ACTIVITY = [
    { name: 'Mon', tasks: 4 },
    { name: 'Tue', tasks: 3 },
    { name: 'Wed', tasks: 7 },
    { name: 'Thu', tasks: 5 },
    { name: 'Fri', tasks: 8 },
    { name: 'Sat', tasks: 2 },
    { name: 'Sun', tasks: 4 },
];

const DEFAULT_DISTRIBUTION = [
    { name: 'Frontend', value: 45 },
    { name: 'Backend', value: 30 },
    { name: 'Design', value: 15 },
    { name: 'Testing', value: 10 },
];

const COLORS = ['#64ffda', '#0088FE', '#FFBB28', '#FF8042'];

const ProjectStats = () => {
    const [activityData, setActivityData] = useState(DEFAULT_ACTIVITY);
    const [distributionData, setDistributionData] = useState(DEFAULT_DISTRIBUTION);
    const [isEditing, setIsEditing] = useState(false);

    // For editing form
    const [editValues, setEditValues] = useState(DEFAULT_ACTIVITY.map(d => d.tasks));

    useEffect(() => {
        const docRef = doc(db, 'project_stats', 'overview');
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.activityData) setActivityData(data.activityData);
                if (data.distributionData) setDistributionData(data.distributionData);
            } else {
                // Create default if not exists
                setDoc(docRef, {
                    activityData: DEFAULT_ACTIVITY,
                    distributionData: DEFAULT_DISTRIBUTION
                });
            }
        });

        return () => unsubscribe();
    }, []);

    const handleUpdate = async () => {
        const newActivity = activityData.map((item, index) => ({
            ...item,
            tasks: parseInt(editValues[index]) || 0
        }));

        try {
            await setDoc(doc(db, 'project_stats', 'overview'), {
                activityData: newActivity,
                distributionData: distributionData // Keep existing distribution for now
            }, { merge: true });
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating stats:", error);
        }
    };

    return (
        <div className="dashboard-widget-card stats-container">
            <div className="widget-header" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <BarChart2 size={18} color="#64ffda" />
                    <span>Project Progress</span>
                </div>
                <button className="update-stats-btn" onClick={() => {
                    setEditValues(activityData.map(d => d.tasks));
                    setIsEditing(true);
                }}>
                    <Edit2 size={12} style={{ marginRight: '5px' }} /> Update
                </button>
            </div>

            <div className="stats-grid">
                {/* Activity Chart */}
                <div className="chart-wrapper">
                    <div className="chart-title">Weekly Activity</div>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={activityData}>
                            <defs>
                                <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#64ffda" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#64ffda" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" tick={{ fill: '#8892b0', fontSize: 10 }} stroke="rgba(255,255,255,0.1)" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#112240', borderColor: '#64ffda', color: '#fff' }}
                                itemStyle={{ color: '#64ffda' }}
                            />
                            <Area type="monotone" dataKey="tasks" stroke="#64ffda" fillOpacity={1} fill="url(#colorTasks)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Distribution Chart */}
                <div className="chart-wrapper">
                    <div className="chart-title">Task Distribution</div>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={distributionData}
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {distributionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#112240', borderColor: '#ffffff20', color: '#fff' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Edit Modal */}
            {isEditing && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3 style={{ color: '#fff', marginBottom: '1rem' }}>Update Activity Data</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            {activityData.map((item, index) => (
                                <div key={item.name} style={{ display: 'flex', flexDirection: 'column' }}>
                                    <label style={{ color: '#8892b0', fontSize: '0.8rem' }}>{item.name}</label>
                                    <input
                                        type="number"
                                        value={editValues[index]}
                                        onChange={(e) => {
                                            const newVals = [...editValues];
                                            newVals[index] = e.target.value;
                                            setEditValues(newVals);
                                        }}
                                        className="todo-input"
                                    />
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button className="start-meet-btn" onClick={handleUpdate}>Save Changes</button>
                            <button className="modal-close-btn" onClick={() => setIsEditing(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectStats;
