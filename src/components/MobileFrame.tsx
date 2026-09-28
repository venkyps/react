import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, Wifi, Battery, Signal } from 'lucide-react';

interface MobileFrameProps {
  children: React.ReactNode;
  isFrameEnabled: boolean;
  onToggleFrame: () => void;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({
  children,
  isFrameEnabled,
  onToggleFrame,
}) => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!isFrameEnabled) {
    return (
      <div className="full-screen-wrapper">
        {children}
      </div>
    );
  }

  return (
    <div className="frame-outer-container">
      {/* Outer framing wrapper */}
      <div className="mobile-phone-device">
        {/* Dynamic Island / Notch */}
        <div className="phone-notch">
          <div className="camera-lens" />
          <div className="speaker-earpiece" />
        </div>

        {/* Status Bar */}
        <div className="phone-status-bar">
          <div className="status-left">
            <span className="time-text">{time || '09:41'}</span>
          </div>
          <div className="status-right">
            <Signal size={13} className="status-icon" />
            <Wifi size={13} className="status-icon" />
            <Battery size={15} className="status-icon" />
          </div>
        </div>

        {/* App Viewport */}
        <div className="phone-screen-content">
          {children}
        </div>

        {/* Bottom Home Indicator Bar */}
        <div className="phone-home-bar">
          <div className="indicator" />
        </div>
      </div>

      {/* Quick toggle float button on desktop view */}
      <button 
        className="frame-toggle-btn"
        onClick={onToggleFrame}
        title="Switch to full screen mode"
      >
        <Monitor size={16} />
        <span>Full Screen</span>
      </button>
    </div>
  );
};
