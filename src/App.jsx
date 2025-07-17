
import { useEffect, useState } from 'react';
import './App.css';

const DATA_URL = 'https://raw.githubusercontent.com/szlaskidaniel/battery-status/data/status.json';

function BatteryStatus() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(DATA_URL);
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15 * 1000); // 15 seconds
    return () => clearInterval(interval);
  }, []);

  // Countdown state for refresh indicator
  const [countdown, setCountdown] = useState(15); // seconds
  useEffect(() => {
    setCountdown(15);
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [data]);

  const soc = data?.SOC ?? 0;
  const volt = data?.Volt ?? 0;
  const curr = data?.Curr ?? 0;
  const power = data?.Power ?? 0;

  // Battery constants
  const BATTERY_CAPACITY_KWH = 14.2;

  // SVG circle calculations
  

  return (
    <div style={{ position: 'relative' }}>
      <div className="battery-app">
        
        <div className="remaining mb-0">
          {loading
            ? '...'
            : curr < 0
              ? (() => {
                  const socMin = 15;
                  // kWh left to discharge
                  const usableKWh = BATTERY_CAPACITY_KWH * (soc - socMin) / 100;
                  // time in hours = kWh / (W / 1000)
                  const hours = Math.abs(usableKWh / (power / 1000));
                  const min = hours * 60;
                  if (min > 120) {
                    return `${hours.toFixed(1)} h remaining`;
                  }
                  return `${min.toFixed(0)} min remaining`;
                })()
              : ''}
        </div>
        {/* ETA below battery if remaining time is shown */}
        {(!loading && curr < 0) && (() => {
          const socMin = 15;
          const usableKWh = BATTERY_CAPACITY_KWH * (soc - socMin) / 100;
          const hours = Math.abs(usableKWh / (power / 1000));
          const min = hours * 60;
          if (min > 0) {
            const eta = new Date(Date.now() + min * 60000);
            const h = eta.getHours().toString().padStart(2, '0');
            const m = eta.getMinutes().toString().padStart(2, '0');
            return (
              <div style={{ textAlign: 'center', fontSize: '0.8em', opacity: 0.7, marginBottom: 4 }}>
                ETA: {h}:{m}
              </div>
            );
          }
          return null;
        })()}
      
        <div className="battery-container flex items-center">
          <div className="battery" style={{ position: 'relative' }}>
            {/* Battery fill */}
            <div
              className="battery-fill"
              style={{
                width: `${soc}%`,
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                background:
                  soc >= 80
                    ? 'linear-gradient(90deg, #4caf50 60%, #388e3c 100%)'
                    : soc >= 50
                    ? 'linear-gradient(90deg, #ffeb3b 60%, #fbc02d 100%)'
                    : soc >= 20
                    ? 'linear-gradient(90deg, #ff9800 60%, #f57c00 100%)'
                    : 'linear-gradient(90deg, #f44336 60%, #b71c1c 100%)',
                transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
              }}
            >
              <span className="soc-label">
                {soc}% {loading
                  ? ''
                  : curr > 0
                    ? 'Charging'
                    : curr === 0
                      ? 'Idle'
                      : 'Discharging'}
              </span>
            </div>
          </div>
            {/* Current and Voltage below battery */}
        <div style={{ textAlign: 'center', marginTop: 0 }} className="text-xs" >
          <span style={{ opacity: 0.6, marginRight: 8 }}>{volt} V</span>
          <span style={{ opacity: 0.6 }}>{curr} A</span>
        </div>
        </div>
        
        <div className="battery-info">
          <span>⚡ {power} W</span>
      
        </div>
        
        <div className="footer">Pylontech Battery Force H2 Status</div>
      </div>
      {/* Circular countdown indicator - top right of battery-app */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32">
          <circle
            cx="16"
            cy="16"
            r={12}
            fill="none"
            stroke="#fff"
            strokeOpacity="0.08"
            strokeWidth="2"
          />
          <circle
            cx="16"
            cy="16"
            r={12}
            fill="none"
            stroke="#fff"
            strokeOpacity="0.25"
            strokeWidth="2"
            strokeDasharray={(2 * Math.PI * 12).toString()}
            strokeDashoffset={((countdown / 15) * (2 * Math.PI * 12)).toString()}
            style={{
              transition: 'stroke-dashoffset 1s linear',
              transform: 'rotate(-90deg)',
              transformOrigin: 'center',
            }}
          />
          <text
            x="16"
            y="20"
            textAnchor="middle"
            fontSize="9"
            fill="#fff"
            opacity="0.5"
            fontFamily="inherit"
          >
            {countdown}s
          </text>
        </svg>
      </div>
    </div>
  );
}

export default BatteryStatus;
