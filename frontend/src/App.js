import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import './App.css';

const socket = io();

const typeEnum = {
  0x00: 'CALL_START',
  0x01: 'CALL_END',
  0x02: 'CALL_ALERT',
  0x03: 'ACK_RSP',
  0x04: 'NEW_CONNECTION',
  0x05: 'UNLINK',
  0x06: 'CONNECTION',
};

const digitalModeEnum = {
  0x00: 'NXDN',
  0x01: 'P25',
  0x02: 'YSF',
  0x03: 'M17',
  0xFF: 'UNKNOWN',
};

const modeOptions = [
  { value: 'P25', label: 'P25' },
  { value: 'NXDN', label: 'NXDN' },
  { value: 'YSF', label: 'YSF' },
  { value: 'M17', label: 'M17' },
];

function App() {
  const [reports, setReports] = useState([]);
  const [p25Connections, setP25Connections] = useState([]);
  const [nxdnConnections, setNXDNConnections] = useState([]);
  const [ysfConnections, setYSFConnections] = useState([]);
  const [m17Connections, setM17Connections] = useState([]);
  const [darkMode, setDarkMode] = useState(
      JSON.parse(localStorage.getItem('darkMode')) || false
  );
  const [logsEnabled, setLogsEnabled] = useState(true);
  const [visibleModes, setVisibleModes] = useState(
      JSON.parse(localStorage.getItem('visibleModes')) || ['P25', 'NXDN', 'YSF', 'M17']
  );
  const [reportFilterModes, setReportFilterModes] = useState(
      JSON.parse(localStorage.getItem('reportFilterModes')) || ['P25', 'NXDN', 'YSF', 'M17']
  );

  useEffect(() => {
    socket.on('initialData', (data) => {
      const normalReports = [];
      let latestP25Connections = [];
      let latestNXDNConnections = [];
      let latestYSFConnections = [];
      let latestM17Connections = [];

      data.reverse().forEach((report) => {
        if (report.Type === 6) {
          if (report.Mode === 0x01) {
            latestP25Connections = parseP25Connections(report.Extra);
          } else if (report.Mode === 0x00) {
            latestNXDNConnections = parseNXDNConnections(report.Extra);
          } else if (report.Mode === 0x02) {
            latestYSFConnections = parseYSFConnections(report.Extra);
          } else if (report.Mode === 0x03) {
            latestM17Connections = parseM17Connections(report.Extra);
          }
        } else {
          normalReports.push(report);
        }
      });

      setReports(normalReports.slice(0, 5));
      setP25Connections(latestP25Connections);
      setNXDNConnections(latestNXDNConnections);
      setYSFConnections(latestYSFConnections);
      setM17Connections(latestM17Connections);
    });

    socket.on('newReport', (report) => {
      if (report.Type === 6) {
        if (report.Mode === 0x01) {
          const newP25Connections = parseP25Connections(report.Extra);
          setP25Connections((prevConnections) =>
              updateConnections(prevConnections, newP25Connections)
          );
        } else if (report.Mode === 0x00) {
          const newNXDNConnections = parseNXDNConnections(report.Extra);
          setNXDNConnections((prevConnections) =>
              updateConnections(prevConnections, newNXDNConnections)
          );
        } else if (report.Mode === 0x02) {
          const newYSFConnections = parseYSFConnections(report.Extra);
          setYSFConnections((prevConnections) =>
              updateConnections(prevConnections, newYSFConnections)
          );
        } else if (report.Mode === 0x03) {
          const newM17Connections = parseM17Connections(report.Extra);
          setM17Connections((prevConnections) =>
              updateConnections(prevConnections, newM17Connections)
          );
        }
      } else if (logsEnabled) {
        setReports((prevReports) => {
          const updatedReports = [report, ...prevReports];
          return updatedReports.slice(0, 5);
        });
      }
    });

    return () => {
      socket.off('initialData');
      socket.off('newReport');
    };
  }, [logsEnabled]);

  const getTypeName = (value) => typeEnum[value] || 'UNKNOWN';
  const getModeName = (value) => digitalModeEnum[value] || 'UNKNOWN';

  const parseP25Connections = (extra) => {
    try {
      const connectionsList = JSON.parse(extra);
      return connectionsList.map((conn) => ({
        CallSign: conn.CallSign,
        Address: conn.Address,
        SrcId: conn.TransmissionState.SrcId,
        DstId: conn.TransmissionState.DstId,
      }));
    } catch (e) {
      console.error('Failed to parse P25 connections:', e);
      return [];
    }
  };

  const parseM17Connections = (extra) => {
    try {
      const connectionsList = JSON.parse(extra);
      return connectionsList.map((conn) => ({
        CallSign: conn.CallSign,
        Address: conn.Address,
        Module: conn.Module,
        Transmitting: conn.Transmitting,
      }));
    } catch (e) {
      console.error('Failed to parse M17 connections:', e);
      return [];
    }
  };

  const parseNXDNConnections = (extra) => {
    try {
      const connectionsList = JSON.parse(extra);
      return connectionsList.map((conn) => ({
        CallSign: conn.CallSign,
        Address: conn.Address,
        Transmitting: conn.Transmitting,
      }));
    } catch (e) {
      console.error('Failed to parse NXDN connections:', e);
      return [];
    }
  };

  const parseYSFConnections = (extra) => {
    try {
      const connectionsList = JSON.parse(extra);
      return connectionsList.map((conn) => ({
        CallSign: conn.CallSign,
        Address: conn.Address,
        Transmitting: conn.Transmitting,
      }));
    } catch (e) {
      console.error('Failed to parse YSF connections:', e);
      return [];
    }
  };

  const updateConnections = (prevConnections, newConnections) => {
    const updatedConnections = newConnections.map((newConn) => {
      const existingConn = prevConnections.find(
          (conn) => conn.CallSign === newConn.CallSign && conn.Address === newConn.Address
      );

      if (existingConn) {
        return {
          ...newConn,
          SrcId: newConn.SrcId > 0 ? newConn.SrcId : existingConn.SrcId,
          DstId: newConn.DstId > 0 ? newConn.DstId : existingConn.DstId,
        };
      }

      return newConn;
    });

    return updatedConnections;
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    localStorage.setItem('darkMode', JSON.stringify(!darkMode));
  };

  const toggleLogs = () => {
    setLogsEnabled((prev) => !prev);
  };

  const handleModeVisibilityChange = (option) => {
    const updatedModes = visibleModes.includes(option.value)
        ? visibleModes.filter((mode) => mode !== option.value)
        : [...visibleModes, option.value];
    setVisibleModes(updatedModes);
    localStorage.setItem('visibleModes', JSON.stringify(updatedModes));
  };

  const handleReportFilterChange = (option) => {
    const updatedModes = reportFilterModes.includes(option.value)
        ? reportFilterModes.filter((mode) => mode !== option.value)
        : [...reportFilterModes, option.value];
    setReportFilterModes(updatedModes);
    localStorage.setItem('reportFilterModes', JSON.stringify(updatedModes));
  };

  const filteredReports = reports.filter((report) =>
      reportFilterModes.includes(getModeName(report.Mode))
  );

  return (
      <div className={`App ${darkMode ? 'dark-mode' : ''}`}>
        <header className="App-header">
          <h1>MMDVM Reflector Monitor</h1>
          <div className="button-container">
            <button className="btn-login">Login</button>
            <button className="btn-stop-log" onClick={toggleLogs}>
              {logsEnabled ? 'Stop Logs' : 'Start Logs'}
            </button>
            <button className="btn-toggle" onClick={toggleDarkMode}>
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </header>
        <div className="content-container">
          <div className="filter-container">
            <div className="filter-button">
              Filter Connections
              <div className="filter-dropdown">
                {modeOptions.map((option) => (
                    <div key={option.value}>
                      <input
                          type="checkbox"
                          checked={visibleModes.includes(option.value)}
                          onChange={() => handleModeVisibilityChange(option)}
                      />
                      {option.label}
                    </div>
                ))}
              </div>
            </div>
            <div className="filter-button">
              Filter Reports
              <div className="filter-dropdown">
                {modeOptions.map((option) => (
                    <div key={option.value}>
                      <input
                          type="checkbox"
                          checked={reportFilterModes.includes(option.value)}
                          onChange={() => handleReportFilterChange(option)}
                      />
                      {option.label}
                    </div>
                ))}
              </div>
            </div>
          </div>
          <div className="log-box">
            <h2>Reports</h2>
            <div className="table-container">
              <table>
                <thead>
                <tr>
                  <th>Mode</th>
                  <th>Type</th>
                  <th>Src ID</th>
                  <th>Dst ID</th>
                  <th>Peer</th>
                  <th>Time</th>
                </tr>
                </thead>
                <tbody>
                {filteredReports.map((report, index) => (
                    <tr key={index}>
                      <td>{getModeName(report.Mode)}</td>
                      <td>{getTypeName(report.Type)}</td>
                      <td>{report.SrcId}</td>
                      <td>{report.DstId}</td>
                      <td>{report.Peer || 'N/A'}</td>
                      <td>
                        {report.DateTime !== '0001-01-01T00:00:00'
                            ? new Date(report.DateTime).toLocaleString()
                            : 'Invalid Date'}
                      </td>
                    </tr>
                ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* P25 Connections Table */}
          {visibleModes.includes('P25') && (
              <div className="connection-box">
                <h2>P25 Connections</h2>
                <div className="table-container">
                  <table>
                    <thead>
                    <tr>
                      <th>CallSign</th>
                      <th>Address</th>
                      <th>Last Src ID</th>
                      <th>Last Dst ID</th>
                    </tr>
                    </thead>
                    <tbody>
                    {p25Connections.length > 0 ? (
                        p25Connections.map((conn, index) => (
                            <tr key={index}>
                              <td>{conn.CallSign}</td>
                              <td>{conn.Address}</td>
                              <td>{conn.SrcId}</td>
                              <td>{conn.DstId}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                          <td colSpan="4">No active connections</td>
                        </tr>
                    )}
                    </tbody>
                  </table>
                </div>
              </div>
          )}

          {/* NXDN Connections Table */}
          {visibleModes.includes('NXDN') && (
              <div className="connection-box">
                <h2>NXDN Connections</h2>
                <div className="table-container">
                  <table>
                    <thead>
                    <tr>
                      <th>CallSign</th>
                      <th>Address</th>
                      <th>Transmitting</th>
                    </tr>
                    </thead>
                    <tbody>
                    {nxdnConnections.length > 0 ? (
                        nxdnConnections.map((conn, index) => (
                            <tr key={index}>
                              <td>{conn.CallSign}</td>
                              <td>{conn.Address}</td>
                              <td>{conn.Transmitting ? 'Yes' : 'No'}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                          <td colSpan="3">No active connections</td>
                        </tr>
                    )}
                    </tbody>
                  </table>
                </div>
              </div>
          )}

          {/* YSF Connections Table */}
          {visibleModes.includes('YSF') && (
              <div className="connection-box">
                <h2>YSF Connections</h2>
                <div className="table-container">
                  <table>
                    <thead>
                    <tr>
                      <th>CallSign</th>
                      <th>Address</th>
                      <th>Transmitting</th>
                    </tr>
                    </thead>
                    <tbody>
                    {ysfConnections.length > 0 ? (
                        ysfConnections.map((conn, index) => (
                            <tr key={index}>
                              <td>{conn.CallSign}</td>
                              <td>{conn.Address}</td>
                              <td>{conn.Transmitting ? 'Yes' : 'No'}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                          <td colSpan="3">No active connections</td>
                        </tr>
                    )}
                    </tbody>
                  </table>
                </div>
              </div>
          )}

          {/* M17 Connections Table */}
          {visibleModes.includes('M17') && (
              <div className="connection-box">
                <h2>M17 Connections</h2>
                <div className="table-container">
                  <table>
                    <thead>
                    <tr>
                      <th>CallSign</th>
                      <th>Address</th>
                      <th>Module</th>
                      <th>Transmitting</th>
                    </tr>
                    </thead>
                    <tbody>
                    {m17Connections.length > 0 ? (
                        m17Connections.map((conn, index) => (
                            <tr key={index}>
                              <td>{conn.CallSign}</td>
                              <td>{conn.Address}</td>
                              <td>{conn.Module}</td>
                              <td>{conn.Transmitting ? 'True' : 'False'}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                          <td colSpan="4">No active connections</td>
                        </tr>
                    )}
                    </tbody>
                  </table>
                </div>
              </div>
          )}
        </div>
      </div>
  );
}

export default App;
