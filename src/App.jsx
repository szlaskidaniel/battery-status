
import { useEffect, useState } from 'react';
import './App.css';

const DATA_URL = 'https://pylontech-force-h2-battery.s3.eu-central-1.amazonaws.com/status.json';

function BatteryStatus() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(DATA_URL);
      let json = await res.json();
      

      setData(json);
    } catch {
      setData(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30 * 1000); // 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Countdown state for refresh indicator
  const [countdown, setCountdown] = useState(30); // seconds
  useEffect(() => {
    setCountdown(30);;
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
               <div className="footer">Pylontech Battery Force H2 Status</div>
    
        <div className="flex items-center" style={{ flexDirection: 'column' }}>
          <div className="battery" style={{ position: 'relative', marginTop: '12px' }}>
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
                  soc >= 75
                    ? 'linear-gradient(90deg, #4caf50 60%, #388e3c 100%)'
                    : soc >= 50
                    ? 'linear-gradient(90deg, #ffeb3b 60%, #fbc02d 100%)'
                    : soc >= 25
                    ? 'linear-gradient(90deg, #ff9800 60%, #f57c00 100%)'
                    : 'linear-gradient(90deg, #f44336 60%, #b71c1c 100%)',
                transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
              }}
            />
            {/* Always visible SOC label, absolutely centered */}
            <span
              className="soc-label"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
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
                zIndex: 2,
              }}
            >
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', lineHeight: 1 }}>{soc}%</span>
              <span style={{
                fontSize: '0.85rem',
                fontWeight: 400,
                opacity: 0.45,
                letterSpacing: '0.04em',
                marginTop: '2px',
                textTransform: 'lowercase',
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
          {/* Current and Voltage below battery */}
          <div className="text-center" style={{ fontSize: '0.8rem', marginTop: '4px' }} >
            <span style={{ opacity: 0.6, marginRight: 8 }}>{volt.toFixed(1)} V</span>
            <span style={{ opacity: 0.6 }}>{curr.toFixed(1)} A</span>
          </div>
        </div>
        
        {/* Modern info bar for power, remaining, ETA */}
        <div className="battery-info-bar " style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          gap: '1.5em',
          margin: '24px 0 8px 0',
          fontSize: '1rem',
          fontWeight: 300,
          letterSpacing: '0.02em',
          marginBottom: '64px',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, opacity: 0.85, fontSize: '1.4em', marginTop: '6px' }}>
            <span style={{ fontSize: '0.9em' }}>⚡</span>
            {Math.abs(power) >= 1000
              ? `${(power / 1000).toFixed(2)} kW`
              : `${power} W`}
          </span>
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', opacity: 0.7, fontSize: '0.9em', minWidth: '90px' }}>
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
      
    </div>
    {/* Bottom bar with Last update (left) and circular timer (right) */}
    <div style={{
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: '0.7em',
      opacity: 0.55,
      marginBottom: '8px',
      pointerEvents: 'none',
      padding: '0 12px',
    }}>
      <div style={{ textAlign: 'left' }}>
        {data?.Timestamp ? (() => {
          const now = Date.now();
          const updated = Date.parse(data.Timestamp);
          const diffMs = now - updated;
          const diffSec = Math.floor(diffMs / 1000);
          if (diffSec < 60) return `Last updated: ${diffSec} sec ago`;
          if (diffSec < 3600) return `Last updated: ${Math.floor(diffSec / 60)} min ago`;
          if (diffSec < 86400) return `Last updated: ${Math.floor(diffSec / 3600)} h ago`;
          return `Last updated: ${Math.floor(diffSec / 86400)} days ago`;
        })() : ''}
      </div>
      <div style={{ textAlign: 'right' }}>
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
            strokeDashoffset={((countdown / 30) * (2 * Math.PI * 12)).toString()}
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
  </div>
  );
}

export default BatteryStatus;
