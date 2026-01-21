import React from 'react';
import { Video } from 'lucide-react';
import './DashboardWidgets.css';

const MeetingPanel = () => {
    const startMeeting = () => {
        window.open('https://meet.new', '_blank');
    };

    return (
        <div className="dashboard-widget-card meeting-container">
            <div className="meeting-header" style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ padding: '8px', background: 'rgba(100, 255, 218, 0.1)', borderRadius: '50%' }}>
                        <Video size={20} color="#64ffda" />
                    </div>
                    <h3 style={{ margin: 0 }}>Quick Meet</h3>
                </div>
                <p className="meeting-text">Start an instant high-quality video conference.</p>
            </div>

            <button onClick={startMeeting} className="start-meet-btn">
                Start Instant Meeting
            </button>
        </div>
    );
};

export default MeetingPanel;
