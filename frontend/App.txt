import React, { useState, useEffect } from "react";
import axios from "axios";

export default function LedgerApp() {
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
    const response = await axios.get(`${API_URL}/ledger`);
    setEntries(response.data);
  };

  const fetchSummary = async (account) => {
    const response = await axios.get(`${API_URL}/ledger/summary/${account}`);
    setSummary(response.data);
    const accEntries = await axios.get(`${API_URL}/ledger/${account}`);
    setEntries(accEntries.data);
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
        <head>
          <title>Ledger</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: center; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h2>Ledger</h2>
          <table>
            <thead>
              <tr>
                <th>Account</th>
                <th>Due</th>
                <th>Received</th>
                <th>Reference</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${entries.map(entry => `
                <tr>
                  <td>${entry.accountName}</td>
                  <td>${entry.amountDue}</td>
                  <td>${entry.amountReceived}</td>
                  <td>${entry.reference}</td>
                  <td>${entry.date?.slice(0, 10)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleDownloadCSV = () => {
    if (entries.length === 0) {
      alert("No ledger entries to export.");
      return;
    }

    const headers = ["Account Name,Amount Due,Amount Received,Reference,Date"];
    const rows = entries.map(entry => (
      `${entry.accountName},${entry.amountDue},${entry.amountReceived},${entry.reference},${entry.date?.slice(0, 10)}`
    ));
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = "ledger_data.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Ledger Management</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 mb-6">
        <input name="accountName" placeholder="Account Name" className="p-2 border" value={formData.accountName} onChange={handleChange} required />
        <input name="reference" placeholder="Reference" className="p-2 border" value={formData.reference} onChange={handleChange} />
        <input name="amountDue" placeholder="Amount Due" type="number" className="p-2 border" value={formData.amountDue} onChange={handleChange} />
        <input name="amountReceived" placeholder="Amount Received" type="number" className="p-2 border" value={formData.amountReceived} onChange={handleChange} />
        <input name="date" type="date" className="p-2 border col-span-2" value={formData.date} onChange={handleChange} required />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded col-span-2">{editingId ? "Update Entry" : "Add Entry"}</button>
      </form>

      <div className="mb-4">
        <input
          placeholder="Search account for summary..."
          value={selectedAccount}
          onChange={(e) => setSelectedAccount(e.target.value)}
          onBlur={() => fetchSummary(selectedAccount)}
          className="p-2 border w-full"
        />
      </div>

      {summary && (
        <div className="bg-gray-100 p-4 rounded mb-4">
          <h2 className="text-lg font-semibold">Summary for {summary.accountName}</h2>
          <p>Total Due: ₹{summary.totalDue}</p>
          <p>Total Received: ₹{summary.totalReceived}</p>
          <p>Balance: ₹{summary.balance}</p>
        </div>
      )}

      <div className="flex gap-4 mb-4">
        <button onClick={handlePrintLedger} className="bg-green-600 text-white px-4 py-2 rounded">Print Ledger</button>
        <button onClick={handleDownloadCSV} className="bg-purple-600 text-white px-4 py-2 rounded">Download CSV</button>
      </div>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 border">Account</th>
            <th className="p-2 border">Due</th>
            <th className="p-2 border">Received</th>
            <th className="p-2 border">Reference</th>
            <th className="p-2 border">Date</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => (
            <tr key={index} className="text-center">
              <td className="p-2 border">{entry.accountName}</td>
              <td className="p-2 border">₹{entry.amountDue}</td>
              <td className="p-2 border">₹{entry.amountReceived}</td>
              <td className="p-2 border">{entry.reference}</td>
              <td className="p-2 border">{entry.date?.slice(0, 10)}</td>
              <td className="p-2 border">
                <button onClick={() => handleEdit(entry)} className="bg-yellow-400 px-3 py-1 rounded text-white">Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
export default App;