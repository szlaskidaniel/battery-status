
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
      //json.Curr = 1000;
      //json.Timestamp = new Date(Date.now() - 15 * 60 * 1000).toISOString();

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
  // Offline logic
  let isOffline = false;
  let timestampAgeSec = null;
  if (!data || !data.Timestamp) {
    isOffline = true;
  } else {
    const now = Date.now();
    const updated = Date.parse(data.Timestamp);
    timestampAgeSec = Math.floor((now - updated) / 1000);
    if (timestampAgeSec > 180) {
      isOffline = true;
    }
  }
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
          <div className="battery" style={{
            position: 'relative',
            marginTop: '8px',
            width: '220px',
            height: '64px',
            borderRadius: '18px',
            border: '2.5px solid #222',
            background: 'linear-gradient(180deg, #23272f 80%, #181a1f 100%)',
            boxShadow: '0 4px 24px 0 #000a, 0 1px 0 #fff1 inset',
            overflow: 'visible',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
          }}>
            {/* Battery fill or empty if offline */}
            <div
              className="battery-fill"
              style={{
                height: 'calc(100% - 8px)',
                width: isOffline ? '0%' : `calc(${soc}% - 8px)`,
                marginLeft: '4px',
                marginTop: '4px',
                borderRadius: '14px',
                background: isOffline
                  ? 'none'
                  : soc >= 75
                    ? 'linear-gradient(90deg, #4caf50 60%, #388e3c 100%)'
                    : soc >= 50
                    ? 'linear-gradient(90deg, #ffeb3b 60%, #fbc02d 100%)'
                    : soc >= 25
                    ? 'linear-gradient(90deg, #ff9800 60%, #f57c00 100%)'
                    : 'linear-gradient(90deg, #f44336 60%, #b71c1c 100%)',
                boxShadow: isOffline ? 'none' : '0 2px 12px 0 #0006',
                transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                zIndex: 1,
              }}
            />
            {/* Battery cap/terminal */}
            <div style={{
              position: 'absolute',
              right: '-14px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '7px',
              height: '22px',
              borderRadius: '4px',
              background: 'linear-gradient(180deg, #444 60%, #222 100%)',
              border: '2px solid #222',
              boxShadow: '0 2px 8px #0006',
              zIndex: 3,
            }} />
            {/* Always visible SOC label, absolutely centered */}
            {/* SOC label or Offline warning */}
            {isOffline ? (
              <span
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: '1.3rem',
                  fontWeight: 600,
                  color: '#ff9800',
                  padding: '6px 18px',
                  zIndex: 10,
                  
                  letterSpacing: '0.04em',
                }}
              >
                Offline
              </span>
            ) : (
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
                  zIndex: 4,
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
            )}
          </div>
          {/* Current and Voltage below battery */}
          <div className="text-center" style={{ fontSize: '0.8rem', marginTop: '4px' }} >
            <span style={{ opacity: 0.6, marginRight: 8 }}>{isOffline ? '--' : volt.toFixed(1)} V</span>
            <span style={{ opacity: 0.6 }}>{isOffline ? '--' : curr.toFixed(1)} A</span>
          </div>
          {/* Centered power/ETA/remaining display below battery */}
          {!isOffline && curr !== 0 && (
            <div style={{
              textAlign: 'center',
              fontSize: '1.4em',
              fontWeight: 400,
              marginTop: '16px',
              color: curr > 0 ? '#4caf50' : '#fbc02d',
              opacity: 0.85,
              letterSpacing: '0.04em',
              minHeight: '1.2em',
            }}>
              {curr > 0
                ? `+${Math.abs(power) >= 1000
                    ? `${(power / 1000).toFixed(2)} kW`
                    : `${power} W`}`
                : (() => {
                    let powerStr = `-${Math.abs(power) >= 1000
                      ? `${(Math.abs(power) / 1000).toFixed(2)} kW`
                      : `${Math.abs(power)} W`}`;
                    return powerStr;
                  })()
              }
            </div>
          )}
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
          
        }}>
        </div>
        {/* Remaining/ETA info at the bottom, only when discharging */}
        {(curr < 0) && (() => {
          const socMin = 15;
          const usableKWh = BATTERY_CAPACITY_KWH * (soc - socMin) / 100;
          const hours = Math.abs(usableKWh / (power / 1000));
          const min = hours * 60;
          if (min > 0) {
            const eta = new Date(Date.now() + min * 60000);
            const h = eta.getHours().toString().padStart(2, '0');
            const m = eta.getMinutes().toString().padStart(2, '0');
            return (
              <div style={{
                width: '100%',
                textAlign: 'center',
                fontSize: '0.85em',
                color: 'rgba(255, 180, 60, 0.85)',
                paddingTop: '8px',
                marginBottom: '16px',
                fontWeight: 500,
                letterSpacing: '0.02em',
              }}>
                {min > 120 ? `${hours.toFixed(1)} h` : `${min.toFixed(0)} min`} remaining · ETA: {h}:{m}
              </div>
            );
          }
          return null;
        })()}
      
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
      <div style={{ textAlign: 'left', marginLeft: '8px' }}>
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
