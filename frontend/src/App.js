import React, { useState, useEffect } from "react";
import axios from "axios";
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
  const [selectedAccount, setSelectedAccount] = useState("");
  const [summary, setSummary] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [accountOptions, setAccountOptions] = useState([]);
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
    fetchAccountOptions();
  };

  const fetchEntries = async () => {
    const response = await axios.get(`${API_URL}/ledger`);
    setEntries(response.data);
  };

  const fetchSummary = async (account) => {
    const response = await axios.get(`${API_URL}/ledger/summary/${account}`);
    setSummary(response.data);
    const accEntries = await axios.get(`${API_URL}/ledger/${account}`);
    setEntries(accEntries.data);
  };

  const fetchAccountOptions = async () => {
    const response = await axios.get(`${API_URL}/ledger`);
    const accounts = [...new Set(response.data.map(e => e.accountName))];
    setAccountOptions(accounts);
  };

  const handleEdit = (entry) => {
    setFormData({
      accountName: entry.accountName,
      amountDue: entry.amountDue,
      amountReceived: entry.amountReceived,
      reference: entry.reference,
      date: entry.date.slice(0, 10)
    });
    setEditingId(entry._id);
  };

  const handlePrintLedger = () => {
    const printWindow = window.open("", "_blank");
    const htmlContent = `
      <html>
        <head><title>Ledger</title></head>
        <body>
          <table border="1"><thead><tr><th>Account</th><th>Due</th><th>Received</th><th>Reference</th><th>Date</th></tr></thead><tbody>
          ${entries.map(e => `<tr><td>${e.accountName}</td><td>${e.amountDue}</td><td>${e.amountReceived}</td><td>${e.reference}</td><td>${e.date?.slice(0,10)}</td></tr>`).join("")}
          </tbody></table>
          <script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};}</script>
        </body>
      </html>`;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
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

  useEffect(() => {
    fetchEntries();
    fetchAccountOptions();
  }, []);

  return (
    <div className="container">
      <h1>Ledger Management</h1>

      <form onSubmit={handleSubmit}>
        <select name="accountName" value={formData.accountName} onChange={handleChange} required>
          <option value="">Select Account</option>
          {accountOptions.map((opt, idx) => (
            <option key={idx} value={opt}>{opt}</option>
          ))}
        </select>
        <input name="reference" placeholder="Reference" value={formData.reference} onChange={handleChange} />
        <input name="amountDue" type="number" placeholder="Amount Due" value={formData.amountDue} onChange={handleChange} />
        <input name="amountReceived" type="number" placeholder="Amount Received" value={formData.amountReceived} onChange={handleChange} />
        <input name="date" type="date" value={formData.date} onChange={handleChange} required />
        <button type="submit">{editingId ? "Update Entry" : "Add Entry"}</button>
      </form>

      <select value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)} onBlur={() => fetchSummary(selectedAccount)}>
        <option value="">View Account Summary</option>
        {accountOptions.map((opt, idx) => (
          <option key={idx} value={opt}>{opt}</option>
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
