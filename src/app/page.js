"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const TOTAL_SETS = 23;
  const CAGES_PER_SET = 16;

  const emptyData = () =>
    Array.from({ length: TOTAL_SETS }, () =>
      Array(CAGES_PER_SET).fill("0")
    );

  const [authorized, setAuthorized] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [date, setDate] = useState("");

  const [currentSet, setCurrentSet] = useState(0);
  const [activeTab, setActiveTab] = useState("entry");

  const [eggData, setEggData] = useState(emptyData());
  const [history, setHistory] = useState({});

  const accessKey = "MTIzNDU=";

  const decode = (value) => {
    try {
      return atob(value);
    } catch {
      return "";
    }
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

  const handleClear = () => {
    setEggData(emptyData());
  };

  const totalEggs = eggData.flat().reduce(
    (sum, val) => sum + (parseInt(val) || 0),
    0
  );

  // ✅ LOAD HISTORY
  useEffect(() => {
    const savedHistory = localStorage.getItem("eggHistory");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // ✅ SAVE HISTORY
  useEffect(() => {
    localStorage.setItem("eggHistory", JSON.stringify(history));
  }, [history]);

  // ✅ SAVE CURRENT ENTRY
  const handleSave = () => {
    if (!date) {
      alert("Please select a date");
      return;
    }

    setHistory((prev) => ({
      ...prev,
      [date]: { eggData }
    }));

    alert("Saved locally ✔");
  };

  // ✅ LOAD FROM HISTORY
  const loadEntry = (selectedDate) => {
    const entry = history[selectedDate];
    if (entry) {
      setEggData(entry.eggData);
      setDate(selectedDate);
      setActiveTab("entry");
    }
  };

  // 🔒 LOGIN
  if (!authorized) {
    return (
      <main style={{ padding: "20px", maxWidth: "400px", margin: "auto" }}>
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: "12px",
            padding: "20px"
          }}
        >
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

  // 🐔 MAIN UI
  return (
    <main style={{ padding: "20px", maxWidth: "650px", margin: "auto" }}>
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "12px",
          padding: "20px"
        }}
      >
        <h1 style={{ textAlign: "center" }}>🐔 Egg Farm</h1>

        {/* TABS */}
        <div style={{ display: "flex", marginBottom: "15px" }}>
          {[
            { key: "entry", label: "Egg Entry" },
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

        {/* ENTRY TAB */}
        {activeTab === "entry" && (
          <>
            {/* DATE */}
            <div style={{ marginBottom: "15px" }}>
              <label style={{ fontWeight: "bold" }}>📅 Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginTop: "5px",
                  borderRadius: "8px",
                  border: "1px solid #ccc"
                }}
              />
            </div>

            {/* GRID */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "10px"
              }}
            >
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

            {/* PAGINATION */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "20px"
              }}
            >
              <button
                disabled={currentSet === 0}
                onClick={() => setCurrentSet(currentSet - 1)}
                style={{
                  padding: "10px 15px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#6b7280",
                  color: "white",
                  cursor: "pointer"
                }}
              >
                ⬅ Prev
              </button>

              <div style={{ fontWeight: "bold" }}>
                Set {currentSet + 1} / {TOTAL_SETS}
              </div>

              <button
                disabled={currentSet === TOTAL_SETS - 1}
                onClick={() => setCurrentSet(currentSet + 1)}
                style={{
                  padding: "10px 15px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#2563eb",
                  color: "white",
                  cursor: "pointer"
                }}
              >
                Next ➡
              </button>
            </div>

            {/* ACTIONS */}
            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "15px"
              }}
            >
              <button
                onClick={handleClear}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#ef4444",
                  color: "white",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                Clear
              </button>

              <button
                onClick={handleSave}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#10b981",
                  color: "white",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                Save
              </button>
            </div>

            {/* TOTAL */}
            <h3 style={{ textAlign: "center", marginTop: "15px" }}>
              Total Eggs: {totalEggs}
            </h3>
          </>
        )}

        {/* HISTORY TAB */}
        {activeTab === "history" && (
          <div>
            {Object.keys(history).length === 0 && (
              <p style={{ textAlign: "center" }}>No records yet</p>
            )}

            {Object.keys(history)
              .sort((a, b) => b.localeCompare(a))
              .map((d) => (
                <div
                  key={d}
                  onClick={() => loadEntry(d)}
                  style={{
                    padding: "12px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    marginBottom: "10px",
                    cursor: "pointer"
                  }}
                >
                  📅 {d}
                </div>
              ))}
          </div>
        )}

        {/* ANALYSIS TAB */}
        {activeTab === "analysis" && (
          <div
            style={{
              border: "1px dashed #ccc",
              padding: "20px",
              borderRadius: "8px",
              textAlign: "center"
            }}
          >
            📈 Analysis feature coming soon
          </div>
        )}
      </div>
    </main>
  );
}