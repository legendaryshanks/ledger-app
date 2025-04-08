import React, { useState, useEffect } from "react";
import axios from "axios";
import Papa from "papaparse";
import './App.css';

function App() {
  const [formData, setFormData] = useState({
    accountName: "",
    amountDue: "",
    amountReceived: "",
    reference: "",
    date: ""
  });
  const [entries, setEntries] = useState([]);
  const [accountOptions, setAccountOptions] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [summary, setSummary] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await axios.put(`${API_URL}/ledger/${editingId}`, formData);
    } else {
      await axios.post(`${API_URL}/ledger`, formData);
    }
    setFormData({ accountName: "", amountDue: "", amountReceived: "", reference: "", date: "" });
    setEditingId(null);
    fetchEntries();
  };

  const fetchEntries = async () => {
    const res = await axios.get(`${API_URL}/ledger`);
    setEntries(res.data);
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  useEffect(() => {
    const uniqueAccounts = [...new Set(entries.map(e => e.accountName))];
    setAccountOptions(uniqueAccounts);
  }, [entries]);

  const fetchSummary = async (account) => {
    if (!account) return;
    const sum = await axios.get(`${API_URL}/ledger/summary/${account}`);
    setSummary(sum.data);
    const accEntries = await axios.get(`${API_URL}/ledger/${account}`);
    setEntries(accEntries.data);
  };

  const handleEdit = (entry) => {
    setFormData({ ...entry, date: entry.date.slice(0, 10) });
    setEditingId(entry._id);
  };

  const handlePrintLedger = () => {
    const win = window.open("", "_blank");
    const content = `
    <html><head><title>Ledger</title></head><body>
    <table border="1"><thead><tr><th>Account</th><th>Due</th><th>Received</th><th>Reference</th><th>Date</th></tr></thead><tbody>
    ${entries.map(e => `<tr><td>${e.accountName}</td><td>${e.amountDue}</td><td>${e.amountReceived}</td><td>${e.reference}</td><td>${e.date?.slice(0,10)}</td></tr>`).join("")}
    </tbody></table><script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};}</script></body></html>`;
    win.document.write(content); win.document.close();
  };

  const handleDownloadCSV = () => {
    if (!entries.length) return alert("No data.");
    const headers = ["Account Name,Amount Due,Amount Received,Reference,Date"];
    const rows = entries.map(e => `${e.accountName},${e.amountDue},${e.amountReceived},${e.reference},${e.date?.slice(0,10)}`);
    const csv = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const uri = encodeURI(csv);
    const link = document.createElement("a");
    link.href = uri; link.download = "ledger_data.csv";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const cleaned = results.data.filter(row => row.accountName);
        await axios.post(`${API_URL}/ledger/bulk`, cleaned);
        alert(`${cleaned.length} entries uploaded`);
        fetchEntries();
      }
    });
  };

  return (
    <div className="container">
      <h1>Ledger Management</h1>

      <form onSubmit={handleSubmit}>
        <input
          list="accountOptions"
          name="accountName"
          placeholder="Enter or select account"
          value={formData.accountName}
          onChange={handleChange}
          required
        />
        <datalist id="accountOptions">
          {accountOptions.map((name, idx) => (
            <option key={idx} value={name} />
          ))}
        </datalist>

        <input name="reference" placeholder="Reference" value={formData.reference} onChange={handleChange} />
        <input name="amountDue" type="text" inputMode="numeric" pattern="[0-9]*" placeholder="Amount Due" value={formData.amountDue} onChange={handleChange} />
        <input name="amountReceived" type="text" inputMode="numeric" pattern="[0-9]*" placeholder="Amount Received" value={formData.amountReceived} onChange={handleChange} />
        <input name="date" type="date" value={formData.date} onChange={handleChange} required />
        <button type="submit">{editingId ? "Update Entry" : "Add Entry"}</button>
      </form>

      <div style={{ margin: '20px 0' }}>
        <label><strong>📥 Upload CSV (Bulk Entries): </strong></label>
        <input type="file" accept=".csv" onChange={handleCSVUpload} />
      </div>

      <select
        value={selectedAccount}
        onChange={(e) => {
          setSelectedAccount(e.target.value);
          fetchSummary(e.target.value);
        }}
      >
        <option value="">Select account for summary</option>
        {accountOptions.map((name, idx) => (
          <option key={idx} value={name}>{name}</option>
        ))}
      </select>

      {summary && <div className="summary">
        <h3>Summary for {summary.accountName}</h3>
        <p>Total Due: ₹{summary.totalDue}</p>
        <p>Total Received: ₹{summary.totalReceived}</p>
        <p>Balance: ₹{summary.balance}</p>
      </div>}

      <div>
        <button onClick={handlePrintLedger}>Print Ledger</button>
        <button onClick={handleDownloadCSV}>Download CSV</button>
      </div>

      <table>
        <thead><tr><th>Account</th><th>Due</th><th>Received</th><th>Reference</th><th>Date</th><th>Action</th></tr></thead>
        <tbody>
          {entries.map((e, i) => (
            <tr key={i}>
              <td>{e.accountName}</td><td>{e.amountDue}</td><td>{e.amountReceived}</td><td>{e.reference}</td><td>{e.date?.slice(0,10)}</td>
              <td><button onClick={() => handleEdit(e)}>Edit</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;