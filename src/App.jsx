import React, { useEffect, useState } from "react";

const GITHUB_RAW_URL =
  "https://raw.githubusercontent.com/szlaskidaniel/battery-status/data/status.json";

function Battery({ soc }) {
  return (
    <div
      style={{
        background: "#222",
        borderRadius: "20px",
        padding: "32px",
        maxWidth: "400px",
        margin: "40px auto",
        boxShadow: "0 8px 32px #0008",
        color: "#fff",
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      <div style={{ fontSize: "1.5em", marginBottom: "16px" }}>Battery Status</div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            width: "220px",
            height: "60px",
            border: "4px solid #444",
            borderRadius: "12px",
            position: "relative",
            background: "#111",
            marginRight: "12px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "0",
              top: "0",
              height: "100%",
              width: `${soc}%`,
              background:
                soc > 20
                  ? "linear-gradient(90deg, #27ae60 70%, #16a085 100%)"
                  : "linear-gradient(90deg, #e74c3c 70%, #c0392b 100%)",
              borderRadius: "8px 0 0 8px",
              transition: "width 0.5s",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: "-18px",
              top: "18px",
              width: "16px",
              height: "24px",
              background: "#444",
              borderRadius: "4px",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "0",
              top: "0",
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: "1.3em",
              color: "#fff",
              textShadow: "0 2px 8px #000a",
            }}
          >
            {soc}%
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, unit }) {
  return (
    <div style={{ margin: "0 18px", textAlign: "center" }}>
      <div style={{ fontSize: "1.1em", color: "#aaa" }}>{label}</div>
      <div style={{ fontSize: "1.5em", fontWeight: "bold", color: "#fff" }}>
        {value} <span style={{ fontSize: "0.8em", color: "#27ae60" }}>{unit}</span>
      </div>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let timer;
    const fetchData = async () => {
      try {
        const res = await fetch(GITHUB_RAW_URL);
        const json = await res.json();
        setData(json);
      } catch {
        setData(null);
      }
    };
    fetchData();
    timer = setInterval(fetchData, 15000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #181c24 0%, #232a36 100%)",
        padding: "0",
        margin: "0",
      }}
    >
      <Battery soc={data?.SOC ?? "--"} />
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "32px",
          marginTop: "-20px",
        }}
      >
        <Stat label="Voltage" value={data?.Volt ?? "--"} unit="V" />
        <Stat label="Current" value={data?.Curr ?? "--"} unit="A" />
        <Stat label="Power" value={data?.Power ?? "--"} unit="W" />
      </div>
      <div style={{ textAlign: "center", marginTop: "40px", color: "#666" }}>
        <small>
          Last update: {new Date().toLocaleTimeString()}
          <br />
          Data from GitHub: <a href={GITHUB_RAW_URL} style={{ color: "#27ae60" }}>status.json</a>
        </small>
      </div>
    </div>
  );
}
