
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
      <div className="battery-app" style={{ marginTop: '24px' }}>
               
    
        <div className="flex items-center" style={{ flexDirection: 'column' }}>
          <div className="battery" style={{ position: 'relative', marginTop: '24px' }}>
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
              <span
                className="soc-label"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5em',
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 'max-content',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: soc > 50 && soc < 80 ? '#222' : '#e6e3e3fa',
                  textShadow: soc > 50 && soc < 80 ? 'none' : '0 2px 8px #000a',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                }}
              >
                <span>{soc}%</span>
                <span style={{
                  fontSize: '1.05rem',
                  fontWeight: 500,
                  opacity: 0.7,
                  letterSpacing: '0.04em',
                }}>
                  {loading
                    ? ''
                    : curr > 0
                      ? 'charging'
                      : curr === 0
                        ? 'idle'
                        : 'discharging'}
                </span>
              </span>
            </div>
          </div>
          {/* Current and Voltage below battery */}
          <div className="text-xs text-center" >
            <span style={{ opacity: 0.6, marginRight: 8 }}>{volt.toFixed(1)} V</span>
            <span style={{ opacity: 0.6 }}>{curr.toFixed(1)} A</span>
          </div>
        </div>
        
        {/* Modern info bar for power, remaining, ETA */}
        <div className="battery-info-bar" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          gap: '1.5em',
          margin: '16px 0 8px 0',
          fontSize: '1rem',
          fontWeight: 300,
          letterSpacing: '0.02em',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, opacity: 0.85 }}>
            <span style={{ fontSize: '1em' }}>⚡</span> {power} W
          </span>
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.7, fontSize: '0.9em', minWidth: '90px' }}>
            <span>
              {loading
                ? '...'
                : curr < 0
                  ? (() => {
                      const socMin = 15;
                      const usableKWh = BATTERY_CAPACITY_KWH * (soc - socMin) / 100;
                      const hours = Math.abs(usableKWh / (power / 1000));
                      const min = hours * 60;
                      if (min > 120) {
                        return `${hours.toFixed(1)} h remaining`;
                      }
                      return `${min.toFixed(0)} min remaining`;
                    })()
                  : ''}
            </span>
            <span>
              {(!loading && curr < 0) && (() => {
                const socMin = 15;
                const usableKWh = BATTERY_CAPACITY_KWH * (soc - socMin) / 100;
                const hours = Math.abs(usableKWh / (power / 1000));
                const min = hours * 60;
                if (min > 0) {
                  const eta = new Date(Date.now() + min * 60000);
                  const h = eta.getHours().toString().padStart(2, '0');
                  const m = eta.getMinutes().toString().padStart(2, '0');
                  return `ETA: ${h}:${m}`;
                }
                return '';
              })()}
            </span>
          </span>
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
