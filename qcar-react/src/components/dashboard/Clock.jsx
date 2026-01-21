import React, { useState, useEffect } from 'react';
import './DashboardWidgets.css';

const Clock = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatTime = (date) => {
        return date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' });
    };

    // Add seconds separately if desired, or just keep H:M for cleanliness
    // For now, let's do HH:MM:SS
    const timeString = time.toLocaleTimeString([], { hour12: false });

    const formatDate = (date) => {
        return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    };

    return (
        <div className="dashboard-widget-card clock-container">
            <div className="clock-time">{timeString}</div>
            <div className="clock-date">{formatDate(time)}</div>
        </div>
    );
};

export default Clock;
