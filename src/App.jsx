
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
    const interval = setInterval(fetchData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const soc = data?.SOC ?? 0;
  const volt = data?.Volt ?? 0;
  const curr = data?.Curr ?? 0;
  const power = data?.Power ?? 0;

  return (
    <div className="battery-app">
      <h2 className="charging">
       Battery
      </h2>
      <div className="remaining">{loading ? '...' :   curr > 0 && `${((100-soc)*60/(power/volt)).toFixed(0)} min remaining`}</div>
      <div className="battery-container flex items-center">
        <div className="battery" style={{position: 'relative'}}>
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
        {/* <div className="battery-labels">
          <span>SOC %</span>
        </div> */}
      </div>
      <div className="battery-info">
        <span>⚡ {power} W</span>
        <span>{volt} V</span>
        <span>{curr} A</span>
      </div>
      <div className="footer">Pylontech Battery Force H2 Status</div>
    </div>
  );
}

export default BatteryStatus;
