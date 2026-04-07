"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function Home() {
  const TOTAL_SETS = 23;
  const CAGES_PER_SET = 16;

  const emptyData = () =>
    Array.from({ length: TOTAL_SETS }, () =>
      Array(CAGES_PER_SET).fill("0")
    );

  const createSensorSet = () =>
    Array.from({ length: 3 }, () => ({
      ammonia: "",
      temperature: "",
      humidity: ""
    }));

  const emptySensors = () => ({
    morning: createSensorSet(),
    noon: createSensorSet(),
    afternoon: createSensorSet()
  });

  const [authorized, setAuthorized] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [date, setDate] = useState("");

  const [sensors, setSensors] = useState(emptySensors());

  const [currentSet, setCurrentSet] = useState(0);
  const [activeTab, setActiveTab] = useState("entry");

  const [eggData, setEggData] = useState(emptyData());
  const [history, setHistory] = useState({});

  const [analysisTab, setAnalysisTab] = useState("overview");
  const [envTab, setEnvTab] = useState("overview");
  const [entrySubTab, setEntrySubTab] = useState("eggs");

  const accessKey = "MTIzNDU=";

  const SENSOR_TIMES = {
    morning: 8,      // 8AM
    noon: 12,        // 12PM
    afternoon: 16    // 4PM
  };

  const decode = (value) => {
    try {
      return atob(value);
    } catch {
      return "";
    }
  };

  const getCurrentHour = () => new Date().getHours();

  const formatHour = (hour) => {
    const suffix = hour >= 12 ? "PM" : "AM";
    const formatted = hour % 12 === 0 ? 12 : hour % 12;
    return `${formatted}${suffix}`;
  };

  const getSensorLabel = (timeKey) => {
    return `${formatHour(SENSOR_TIMES[timeKey])} Sensor`;
  };

  const formatPHP = (value) => {
    if (!value) return "";
    return `₱${Number(value).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const parsePHP = (value) => {
    if (!value) return "";
    return value.replace(/[₱,\s]/g, "");
  };

  const handleLogin = () => {
    if (input === decode(accessKey)) {
      setAuthorized(true);
      setError("");
    } else {
      setError("Incorrect code");
    }
  };

  const handleChange = (setIndex, cageIndex, value) => {
    const updated = [...eggData];
    updated[setIndex][cageIndex] = value;
    setEggData(updated);
  };

  const handleSensorChange = (time, index, field, value) => {
    const updated = { ...sensors };
    updated[time][index][field] = value;
    setSensors(updated);
  };  

  const handleClear = () => {
    setEggData(emptyData());
    setSensors(emptySensors());
  };

  const totalEggs = eggData.flat().reduce(
    (sum, val) => sum + (parseInt(val) || 0),
    0
  );

  const [oneTime, setOneTime] = useState({
    batchStartDate: "",
    initialAgeWeeks: "",
    housingCost: "",
    cageCost: "",
    chickenCost: ""
  });

  const [ageWeeks, setAgeWeeks] = useState("");

  useEffect(() => {
    const savedHistory = localStorage.getItem("eggHistory");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }

    const savedOneTime = localStorage.getItem("oneTimeData");
    if (savedOneTime) {
      const parsed = JSON.parse(savedOneTime);

      const formatIfNeeded = (val) => {
        if (!val) return "";
        // already formatted
        if (String(val).includes("₱")) return val;
        return formatPHP(val);
      };

      setOneTime({
        ...parsed,
        housingCost: formatIfNeeded(parsed.housingCost),
        cageCost: formatIfNeeded(parsed.cageCost),
        chickenCost: formatIfNeeded(parsed.chickenCost)
      });
    }

  }, []);

  useEffect(() => {
    localStorage.setItem("eggHistory", JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem("oneTimeData", JSON.stringify(oneTime));
  }, [oneTime]);

  useEffect(() => {
    if (!date) return;
    const entry = history[date];
    if (entry) {
      setEggData(entry.eggData.map(set => [...set]));
      if (Array.isArray(entry.sensors)) {
        setSensors({
          morning: entry.sensors.map(s => ({ ...s })),
          noon: createSensorSet(),
          afternoon: createSensorSet()
        });
      } else {
        setSensors({
          morning: entry.sensors.morning.map(s => ({ ...s })),
          noon: entry.sensors.noon.map(s => ({ ...s })),
          afternoon: entry.sensors.afternoon.map(s => ({ ...s }))
        });
      }
    } else {
      setEggData(emptyData());
      setSensors(emptySensors());
    }

    // 🔥 AUTO-CALCULATE AGE FROM BATCH (NEW LOGIC)
    if (oneTime.batchStartDate && oneTime.initialAgeWeeks && date) {
      const start = new Date(oneTime.batchStartDate);
      const current = new Date(date);

      const diffDays = Math.floor(
        (current - start) / (1000 * 60 * 60 * 24)
      );

      const weeksPassed = Math.floor(diffDays / 7);

      const calculatedAge =
        parseInt(oneTime.initialAgeWeeks || 0) + weeksPassed;

      setAgeWeeks(String(Math.max(calculatedAge, 0)));
    } else {
      setAgeWeeks("");
    }

    // ✅ ALWAYS RESET TO SET 1
    setCurrentSet(0);
  }, [date]);  

  const handleSave = () => {
    if (!date) {
      alert("Please select a date");
      return;
    }
    
    // Validate sensors
    const currentHour = getCurrentHour();

    // Determine which sensor groups are REQUIRED
    const requiredTimes = ["morning"]; // always required

    if (currentHour >= SENSOR_TIMES.noon && currentHour < SENSOR_TIMES.afternoon) {
      requiredTimes.push("noon");
    }

    if (currentHour >= SENSOR_TIMES.afternoon) {
      requiredTimes.push("noon", "afternoon");
    }

    // Validate ONLY required ones
    for (const time of requiredTimes) {
      for (let i = 0; i < sensors[time].length; i++) {
        const s = sensors[time][i];

        if (
          s.ammonia === "" ||
          s.temperature === "" ||
          s.humidity === ""
        ) {
          alert(`Please complete all fields for ${getSensorLabel(time)} Sensor ${i + 1}`);
          return;
        }
      }
    }

    // ✅ DEEP COPY (FIX)
    const eggDataCopy = eggData.map(set => [...set]);
    const sensorsCopy = {
      morning: sensors.morning.map(s => ({ ...s })),
      noon: sensors.noon.map(s => ({ ...s })),
      afternoon: sensors.afternoon.map(s => ({ ...s }))
    };

    setHistory((prev) => ({
      ...prev,
      [date]: {
        eggData: eggDataCopy,
        sensors: sensorsCopy
      }
    }));

    alert("Saved locally ✔");
  };

  const loadEntry = (selectedDate) => {
    const entry = history[selectedDate];
    if (entry) {
      // ✅ DEEP COPY (SAFE LOAD)
      setEggData(entry.eggData.map(set => [...set]));
      setSensors({
        morning: entry.sensors.morning.map(s => ({ ...s })),
        noon: entry.sensors.noon.map(s => ({ ...s })),
        afternoon: entry.sensors.afternoon.map(s => ({ ...s }))
      });
      setDate(selectedDate);
      setActiveTab("entry");
      setCurrentSet(0);
      setEntrySubTab("eggs");      
    }
  };

  // =========================
  // 🔥 ANALYSIS LOGIC (SAFE)
  // =========================

  const analysisData = Object.keys(history)
    .sort()
    .map((date) => {
      const total = history[date].eggData
        .flat()
        .reduce((s, v) => s + (parseInt(v) || 0), 0);

      const getAllSensors = (entry) => {
        if (Array.isArray(entry.sensors)) {
          // OLD DATA
          return entry.sensors;
        }

        // NEW DATA
        return [
          ...entry.sensors.morning,
          ...entry.sensors.noon,
          ...entry.sensors.afternoon
        ];
      };

      const allSensors = getAllSensors(history[date]);

      const avgTemp =
        allSensors.reduce(
          (sum, s) => sum + parseFloat(s.temperature || 0),
          0
        ) / allSensors.length;

      return { date, total, avgTemp };
    });

  const bestDay = analysisData.length
    ? analysisData.reduce((a, b) => (b.total > a.total ? b : a))
    : null;

  const worstDay = analysisData.length
    ? analysisData.reduce((a, b) => (b.total < a.total ? b : a))
    : null;

  const drops = [];
  for (let i = 1; i < analysisData.length; i++) {
    const prev = analysisData[i - 1];
    const curr = analysisData[i];

    if (curr.total < prev.total * 0.9) {
      drops.push(`${curr.date} dropped vs ${prev.date}`);
    }
  }

  const avg = (arr) =>
    arr.length
      ? Math.round(arr.reduce((s, d) => s + d.total, 0) / arr.length)
      : 0;

  const highTemp = analysisData.filter(d => d.avgTemp > 30);
  const normalTemp = analysisData.filter(d => d.avgTemp <= 30);

  const highTempAvg = avg(highTemp);
  const normalTempAvg = avg(normalTemp);

  // 7-day moving average
  const movingAvg = analysisData.map((_, i, arr) => {
    const slice = arr.slice(Math.max(0, i - 6), i + 1);
    return {
      date: arr[i].date,
      avg: Math.round(
        slice.reduce((s, d) => s + d.total, 0) / slice.length
      )
    };
  });

  // Consistency (standard deviation)
  const totals = analysisData.map(d => d.total);
  const mean = avg(analysisData);
  const variance =
    totals.length > 0
      ? totals.reduce((s, t) => s + Math.pow(t - mean, 2), 0) / totals.length
      : 0;

  const stdDev = Math.round(Math.sqrt(variance));

  // Ammonia impact
  const ammoniaData = Object.keys(history).map(date => {
    const entry = history[date];
    const allSensors = [
      ...entry.sensors.morning,
      ...entry.sensors.noon,
      ...entry.sensors.afternoon
    ];
    const avgAmmonia =
      allSensors.reduce(
        (sum, s) => sum + parseFloat(s.ammonia || 0),
        0
      ) / allSensors.length;
    const total = entry.eggData
      .flat()
      .reduce((s, v) => s + (parseInt(v) || 0), 0);

    return { date, total, avgAmmonia };
  });

  const highAmmonia = ammoniaData.filter(d => d.avgAmmonia > 25);
  const lowAmmonia = ammoniaData.filter(d => d.avgAmmonia <= 25);

  const highAmmoniaAvg = avg(highAmmonia);
  const lowAmmoniaAvg = avg(lowAmmonia);

  // Humidity impact
  const humidityData = Object.keys(history).map(date => {
    const entry = history[date];
    const allSensors = [
      ...entry.sensors.morning,
      ...entry.sensors.noon,
      ...entry.sensors.afternoon
    ];
    const avgHumidity =
      allSensors.reduce(
        (sum, s) => sum + parseFloat(s.humidity || 0),
        0
      ) / allSensors.length;
    const total = entry.eggData
      .flat()
      .reduce((s, v) => s + (parseInt(v) || 0), 0);
    return { date, total, avgHumidity };
  });

  // You can adjust threshold later (e.g., 60–70 ideal range)
  const highHumidity = humidityData.filter(d => d.avgHumidity > 70);
  const normalHumidity = humidityData.filter(d => d.avgHumidity <= 70);

  const highHumidityAvg = avg(highHumidity);
  const normalHumidityAvg = avg(normalHumidity);

  // Combined environment dataset (for charts)
  const envChartData = Object.keys(history)
    .sort()
    .map(date => {
      const entry = history[date];

      const total = entry.eggData
        .flat()
        .reduce((s, v) => s + (parseInt(v) || 0), 0);

      const allSensors = [
        ...entry.sensors.morning,
        ...entry.sensors.noon,
        ...entry.sensors.afternoon
      ];

      const avgTemp =
        allSensors.reduce(
          (s, x) => s + parseFloat(x.temperature || 0),
          0
        ) / allSensors.length;

      const avgHumidity =
        allSensors.reduce(
          (s, x) => s + parseFloat(x.humidity || 0),
          0
        ) / allSensors.length;

      const avgAmmonia =
        allSensors.reduce(
          (s, x) => s + parseFloat(x.ammonia || 0),
          0
        ) / allSensors.length;

      return {
        date,
        eggs: total,
        temp: Number(avgTemp.toFixed(2)),
        humidity: Number(avgHumidity.toFixed(2)),
        ammonia: Number(avgAmmonia.toFixed(2))
      };
    });

  // Multi-day decline detection (strong alert)
  const sustainedDrops = [];
  for (let i = 2; i < analysisData.length; i++) {
    if (
      analysisData[i].total < analysisData[i - 1].total &&
      analysisData[i - 1].total < analysisData[i - 2].total
    ) {
      sustainedDrops.push(analysisData[i].date);
    }
  }

  // =========================
  // 🔥 ADVANCED INSIGHTS
  // =========================

  // 🧠 Predict tomorrow (simple trend-based)
  const prediction = (() => {
    if (analysisData.length < 3) return null;

    const last3 = analysisData.slice(-3);
    const trend =
      (last3[2].total - last3[0].total) / 2;

    const predicted =
      Math.round(last3[2].total + trend);

    return Math.max(predicted, 0);
  })();

  // 🐔 Per-set performance (identify weak sets)
  const setPerformance = Array.from({ length: TOTAL_SETS }, (_, setIndex) => {
    let total = 0;
    let days = 0;

    Object.values(history).forEach(entry => {
      if (entry.eggData[setIndex]) {
        total += entry.eggData[setIndex].reduce(
          (s, v) => s + (parseInt(v) || 0),
          0
        );
        days++;
      }
    });

    return {
      set: setIndex + 1,
      avg: days ? Math.round(total / days) : 0
    };
  }).sort((a, b) => b.avg - a.avg);

  const weakestSets = setPerformance.slice(-3);

  // 🔥 Feed efficiency placeholder (ready for future)
  const feedEfficiency = (() => {
    // future: eggs / feed input
    // for now use total eggs as baseline
    if (!analysisData.length) return null;

    const avgEggs = avg(analysisData);

    return {
      efficiency: avgEggs,
      note: "Feed tracking not added yet"
    };
  })();

  // =========================

  if (!authorized) {
    return (
      <main style={{ padding: "20px", maxWidth: "400px", margin: "auto" }}>
        <div style={{ border: "1px solid #ddd", borderRadius: "12px", padding: "20px" }}>
          <h2 style={{ textAlign: "center" }}>🔒 Access</h2>

          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter code"
            style={{
              padding: "12px",
              width: "100%",
              marginBottom: "10px",
              borderRadius: "8px",
              border: "1px solid #ccc"
            }}
          />

          <button
            onClick={handleLogin}
            style={{
              width: "100%",
              padding: "12px",
              background: "#2563eb",
              color: "white",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            Enter
          </button>

          {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: "20px", maxWidth: "650px", margin: "auto" }}>
      <div style={{ border: "1px solid #ddd", borderRadius: "12px", padding: "20px" }}>
        <h1 style={{ textAlign: "center" }}>🐔 Carol's Fresh Farm Eggs</h1>

        {/* TABS */}
        <div style={{ display: "flex", marginBottom: "15px" }}>
          {[
            { key: "entry", label: "Daily Entry" },
            { key: "oneTime", label: "One Time Entry" },
            { key: "history", label: "History" },
            { key: "analysis", label: "Analysis" }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                padding: "10px",
                border: "none",
                cursor: "pointer",
                background:
                  activeTab === tab.key ? "#2563eb" : "#e5e7eb",
                color: activeTab === tab.key ? "white" : "black",
                fontWeight: "bold"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "entry" && (
          <>
            {/* DATE + TOTAL */}
            <div style={{ marginBottom: "15px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <label style={{ fontWeight: "bold" }}>📅 Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={{
                    padding: "6px",
                    borderRadius: "6px",
                    border: "1px solid #ccc"
                  }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                <span style={{ fontWeight: "bold" }}>Total Eggs: {totalEggs}</span>
                <span style={{ marginLeft: "15px", fontWeight: "bold" }}>   Age: {ageWeeks ? `${ageWeeks} weeks` : "-"}</span>
              </div>

            </div>

            {/* 🔥 ENTRY SUB-TABS */}
            <div style={{ display: "flex", marginBottom: "15px" }}>
              {[
                { key: "eggs", label: "Egg Entry" },
                { key: "morning", label: getSensorLabel("morning") },
                { key: "noon", label: getSensorLabel("noon") },
                { key: "afternoon", label: getSensorLabel("afternoon") }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setEntrySubTab(tab.key)}
                  style={{
                    flex: 1,
                    padding: "8px",
                    border: "none",
                    cursor: "pointer",
                    background: entrySubTab === tab.key ? "#2563eb" : "#e5e7eb",
                    color: entrySubTab === tab.key ? "white" : "black"
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* EGGS GRID */}
            {entrySubTab === "eggs" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
                  {eggData[currentSet].map((value, cageIndex) => (
                    <div key={cageIndex}>
                      <label style={{ fontSize: "12px" }}>
                        Cage {cageIndex + 1}
                      </label>
                      <select
                        value={value}
                        onChange={(e) =>
                          handleChange(currentSet, cageIndex, e.target.value)
                        }
                        style={{
                          width: "100%",
                          padding: "8px",
                          borderRadius: "6px",
                          border: "1px solid #ccc"
                        }}
                      >
                        {[0, 1, 2, 3, 4].map((num) => (
                          <option key={num} value={num}>
                            {num}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                {/* EGGS GRID NAVIGATION */}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "15px" }}>
                  <button onClick={() => setCurrentSet(Math.max(0, currentSet - 1))}
                    style={{ padding: "10px 15px", borderRadius: "8px", border: "none", background: "#6b7280", color: "white" }}>
                    ⬅ Prev Set
                  </button>

                  <div>Set {currentSet + 1} / {TOTAL_SETS}</div>

                  <button onClick={() => setCurrentSet(Math.min(TOTAL_SETS - 1, currentSet + 1))}
                    style={{ padding: "10px 15px", borderRadius: "8px", border: "none", background: "#2563eb", color: "white" }}>
                    Next Set ➡
                  </button>
                </div>
              </>
            )}

            {/* 🔥 SENSOR TABS */}
            {["morning", "noon", "afternoon"].map(time => {
              if (entrySubTab !== time) return null;

              const labelMap = {
                morning: getSensorLabel("morning"),
                noon: getSensorLabel("noon"),
                afternoon: getSensorLabel("afternoon")
              };

              return (
                <div key={time}>
                  <h4 style={{ marginBottom: "10px", fontWeight: "bold" }}>{labelMap[time]}</h4>

                  {sensors[time].map((sensor, index) => (
                    <div key={index} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      marginBottom: "8px"
                    }}>
                      <span style={{ minWidth: "70px", fontWeight: "bold" }}>
                        Sensor {index + 1}:
                      </span>

                      <input
                        type="number"
                        step="0.01"
                        placeholder="Ammonia"
                        value={sensor.ammonia}
                        onChange={(e) =>
                          handleSensorChange(time, index, "ammonia", e.target.value)
                        }
                        style={{ width: "95px" }}
                      />

                      <input
                        type="number"
                        step="0.01"
                        placeholder="Temp (C)"
                        value={sensor.temperature}
                        onChange={(e) =>
                          handleSensorChange(time, index, "temperature", e.target.value)
                        }
                        style={{ width: "95px" }}
                      />

                      <input
                        type="number"
                        step="0.01"
                        placeholder="Humidity"
                        value={sensor.humidity}
                        onChange={(e) =>
                          handleSensorChange(time, index, "humidity", e.target.value)
                        }
                        style={{ width: "95px" }}
                      />
                    </div>
                  ))}
                </div>
              );
            })}

            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
              <button onClick={handleClear}
                style={{ flex: 1, padding: "10px", borderRadius: "8px", background: "#ef4444", color: "white" }}>
                Clear
              </button>

              <button onClick={handleSave}
                style={{ flex: 1, padding: "10px", borderRadius: "8px", background: "#10b981", color: "white" }}>
                Save
              </button>
            </div>
          </>
        )}

        {/* ONE-TIME ENTRY */}
        {activeTab === "oneTime" && (
          <div>
            <h3 style={{ marginBottom: "15px", fontWeight: "bold" }}>📌 Batch Setup</h3>

            {/* Batch Start */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
              <label style={{ width: "180px", textAlign: "right", marginRight: "10px", fontWeight: "bold" }}>
                📅 Batch Start Date
              </label>
              <input
                type="date"
                value={oneTime.batchStartDate}
                onChange={(e) =>
                  setOneTime({ ...oneTime, batchStartDate: e.target.value })
                }
                style={{
                  width: "220px",
                  padding: "6px",
                  borderRadius: "6px",
                  border: "1px solid #ccc"
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
              <label style={{ width: "180px", textAlign: "right", marginRight: "10px", fontWeight: "bold" }}>
                Initial Age (weeks)
              </label>
              <input
                type="number"
                value={oneTime.initialAgeWeeks}
                onChange={(e) =>
                  setOneTime({ ...oneTime, initialAgeWeeks: e.target.value })
                }
                style={{
                  width: "220px",
                  padding: "6px",
                  borderRadius: "6px",
                  border: "1px solid #ccc"
                }}
              />
            </div>

            <hr style={{ margin: "15px 0" }} />

            <h3 style={{ marginBottom: "15px", fontWeight: "bold" }}>💰 One-Time Costs</h3>

            {[
              { key: "housingCost", label: "Housing Cost" },
              { key: "cageCost", label: "Cage Cost" },
              { key: "chickenCost", label: "Chicken Cost" }
            ].map(({ key, label }) => (
              <div key={key} style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                <label style={{ width: "180px", textAlign: "right", marginRight: "10px", fontWeight: "bold" }}>
                  {label}
                </label>

                <div style={{ position: "relative", width: "220px" }}>
                  <input
                    type="text"
                    value={oneTime[key]}
                    onChange={(e) =>
                      setOneTime({ ...oneTime, [key]: e.target.value })
                    }
                    onFocus={(e) => {
                      setOneTime({
                        ...oneTime,
                        [key]: parsePHP(oneTime[key])
                      });
                    }}
                    onBlur={(e) => {
                      const raw = parsePHP(oneTime[key]);
                      if (!raw) return;

                      setOneTime({
                        ...oneTime,
                        [key]: formatPHP(raw)
                      });
                    }}
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      borderRadius: "6px",
                      border: "1px solid #ccc"
                    }}
                  />

                </div>

              </div>
            ))}
          </div>
        )}

        {/* HISTORY */}
        {activeTab === "history" && (
          <div>
            {Object.keys(history)
              .sort((a, b) => b.localeCompare(a))
              .map((d) => {
                const total = history[d].eggData.flat().reduce(
                  (s, v) => s + (parseInt(v) || 0), 0
                );

                return (
                  <div key={d}
                    onClick={() => loadEntry(d)}
                    style={{
                      padding: "12px",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      marginBottom: "10px",
                      cursor: "pointer"
                    }}>
                    📅 {d} — {total} eggs
                  </div>
                );
              })}
          </div>
        )}

        {activeTab === "analysis" && (
          <div style={{ border: "1px dashed #ccc", padding: "20px", borderRadius: "8px" }}>

            {/* 🔥 ANALYSIS TABS */}
            <div style={{ display: "flex", marginBottom: "15px" }}>
              {[
                { key: "overview", label: "Overview" },
                { key: "trends", label: "Trends" },
                { key: "alerts", label: "Alerts" },
                { key: "environment", label: "Environment" },
                { key: "performance", label: "Performance" }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setAnalysisTab(tab.key)}
                  style={{
                    flex: 1,
                    padding: "8px",
                    border: "none",
                    cursor: "pointer",
                    background: analysisTab === tab.key ? "#2563eb" : "#e5e7eb",
                    color: analysisTab === tab.key ? "white" : "black"
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* OVERVIEW */}
            {analysisTab === "overview" && (
              <>
                <h3>📊 Production Trend</h3>
                <div style={{ width: "100%", height: "250px", minHeight: "250px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analysisData}>
                      <XAxis dataKey="date" hide />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="total" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <hr style={{ margin: "15px 0" }} />

                <h3>📊 Daily Totals</h3>
                {analysisData.map(d => (
                  <div key={d.date}>
                    {d.date} — {d.total} eggs
                  </div>
                ))}

                <hr style={{ margin: "15px 0" }} />

                <h3>🥇 Performance</h3>
                {bestDay && (
                  <>
                    <div>Best Day: {bestDay.date} ({bestDay.total} eggs)</div>
                    <div>Worst Day: {worstDay.date} ({worstDay.total} eggs)</div>
                  </>
                )}
              </>
            )}

            {/* TRENDS */}
            {analysisTab === "trends" && (
              <>
                <h3>📈 Trend (7-Day Avg)</h3>
                {movingAvg.map(d => (
                  <div key={d.date}>
                    {d.date} — {d.avg} avg eggs
                  </div>
                ))}

                <hr style={{ margin: "15px 0" }} />

                <h3>📊 Consistency</h3>
                <div>Std Dev: {stdDev}</div>
                <div>
                  {stdDev < 10
                    ? "Very stable production ✅"
                    : stdDev < 25
                    ? "Moderate fluctuation ⚠"
                    : "Unstable production 🚨"}
                </div>
              </>
            )}

            {/* ALERTS */}
            {analysisTab === "alerts" && (
              <>
                <h3>⚠️ Alerts</h3>
                {drops.length === 0 ? (
                  <div>No major drops detected</div>
                ) : (
                  drops.map((d, i) => <div key={i}>⚠ {d}</div>)
                )}

                <hr style={{ margin: "15px 0" }} />

                <h3>🚨 Strong Alerts</h3>
                {sustainedDrops.length === 0 ? (
                  <div>No sustained decline</div>
                ) : (
                  sustainedDrops.map((d, i) => (
                    <div key={i}>🚨 3-day decline detected ending {d}</div>
                  ))
                )}
              </>
            )}

            {/* ENVIRONMENT */}
            {analysisTab === "environment" && (
              <>
                {/* 🔥 ENV SUB-TABS */}
                <div style={{ display: "flex", marginBottom: "15px" }}>
                  {[
                    { key: "overview", label: "Overview" },
                    { key: "temp", label: "Temp Chart" },
                    { key: "humidity", label: "Humidity Chart" },
                    { key: "ammonia", label: "Ammonia Chart" }
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setEnvTab(tab.key)}
                      style={{
                        flex: 1,
                        padding: "8px",
                        border: "none",
                        cursor: "pointer",
                        background: envTab === tab.key ? "#2563eb" : "#e5e7eb",
                        color: envTab === tab.key ? "white" : "black"
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* ========================= */}
                {/* OVERVIEW (INSIGHTS) */}
                {/* ========================= */}
                {envTab === "overview" && (
                  <>
                    <h3>🌡 Temperature Insight</h3>
                    <div>High Temp Avg: {highTempAvg} eggs</div>
                    <div>Normal Temp Avg: {normalTempAvg} eggs</div>

                    <hr style={{ margin: "15px 0" }} />

                    <h3>💧 Humidity Impact</h3>
                    <div>High Humidity Avg: {highHumidityAvg} eggs</div>
                    <div>Normal Humidity Avg: {normalHumidityAvg} eggs</div>

                    <hr style={{ margin: "15px 0" }} />

                    <h3>🧪 Ammonia Impact</h3>
                    <div>High Ammonia Avg: {highAmmoniaAvg} eggs</div>
                    <div>Low Ammonia Avg: {lowAmmoniaAvg} eggs</div>
                  </>
                )}

                {/* ========================= */}
                {/* TEMP CHART */}
                {/* ========================= */}
                {envTab === "temp" && (
                  <>
                    <h3>🌡 Temperature vs Eggs</h3>
                    <div style={{ width: "100%", height: "250px", minHeight: "250px" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={envChartData}>
                          <XAxis dataKey="date" hide />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="eggs" name="Eggs" />
                          <Line type="monotone" dataKey="temp" name="Temp (°C)" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}

                {/* ========================= */}
                {/* HUMIDITY CHART */}
                {/* ========================= */}
                {envTab === "humidity" && (
                  <>
                    <h3>💧 Humidity vs Eggs</h3>
                    <div style={{ width: "100%", height: "250px", minHeight: "250px" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={envChartData}>
                          <XAxis dataKey="date" hide />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="eggs" name="Eggs" />
                          <Line type="monotone" dataKey="humidity" name="Humidity" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}

                {/* ========================= */}
                {/* AMMONIA CHART */}
                {/* ========================= */}
                {envTab === "ammonia" && (
                  <>
                    <h3>🧪 Ammonia vs Eggs</h3>
                    <div style={{ width: "100%", height: "250px", minHeight: "250px" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={envChartData}>
                          <XAxis dataKey="date" hide />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="eggs" name="Eggs" />
                          <Line type="monotone" dataKey="ammonia" name="Ammonia" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}
              </>
            )}

            {/* PERFORMANCE */}
            {analysisTab === "performance" && (
              <>
                <h3>🐔 Set Performance</h3>

                <div style={{ marginBottom: "10px" }}>
                  <strong>Top 3 Sets</strong>
                  {setPerformance.slice(0, 3).map(s => (
                    <div key={s.set}>
                      Set {s.set} — {s.avg} avg eggs
                    </div>
                  ))}
                </div>

                <div>
                  <strong>Weakest Sets ⚠</strong>
                  {weakestSets.map(s => (
                    <div key={s.set}>
                      Set {s.set} — {s.avg} avg eggs
                    </div>
                  ))}
                </div>

                <hr style={{ margin: "15px 0" }} />

                <h3>🧠 Prediction</h3>
                {prediction === null ? (
                  <div>Not enough data</div>
                ) : (
                  <div>Tomorrow Estimate: {prediction} eggs</div>
                )}

                <hr style={{ margin: "15px 0" }} />

                <h3>🔥 Feed Efficiency</h3>
                {feedEfficiency ? (
                  <>
                    <div>Baseline: {feedEfficiency.efficiency} eggs/day</div>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      {feedEfficiency.note}
                    </div>
                  </>
                ) : (
                  <div>No data</div>
                )}
              </>
            )}

          </div>
        )}

      </div>
    </main>
  );
}