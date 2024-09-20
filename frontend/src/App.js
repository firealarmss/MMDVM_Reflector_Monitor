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
  0xFF: 'UNKNOWN',
};

function App() {
  const [reports, setReports] = useState([]);
  const [connections, setConnections] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [logsEnabled, setLogsEnabled] = useState(true);

  useEffect(() => {
    socket.on('initialData', (data) => {
      const normalReports = [];
      let latestConnections = [];

      data.reverse().forEach((report) => {
        if (report.Type === 6) {
          latestConnections = parseConnections(report.Extra);
        } else {
          normalReports.push(report);
        }
      });

      setReports(normalReports.slice(0, 5));
      setConnections(latestConnections);
    });

    socket.on('newReport', (report) => {
      if (report.Type === 6) {
        const newConnections = parseConnections(report.Extra);
        setConnections((prevConnections) => updateConnections(prevConnections, newConnections));
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

  const parseConnections = (extra) => {
    try {
      const connectionsList = JSON.parse(extra);
      return connectionsList.map((conn) => ({
        CallSign: conn.CallSign,
        Address: conn.Address,
        SrcId: conn.TransmissionState.SrcId,
        DstId: conn.TransmissionState.DstId,
      }));
    } catch (e) {
      console.error('Failed to parse connections:', e);
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
  };

  const toggleLogs = () => {
    setLogsEnabled((prev) => !prev);
  };

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
                {reports.map((report, index) => (
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

          <div className="connection-box">
            <h2>Connections</h2>
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
                {connections.length > 0 ? (
                    connections.map((conn, index) => (
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
        </div>
      </div>
  );
}

export default App;
