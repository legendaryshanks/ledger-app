const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const LedgerSchema = new mongoose.Schema({
  accountName: String,
  amountDue: Number,
  amountReceived: Number,
  reference: String,
  date: String
});

LedgerSchema.index({ accountName: 1 });

const Ledger = mongoose.model('Ledger', LedgerSchema);

app.post('/ledger', async (req, res) => {
  const entry = new Ledger(req.body);
  const saved = await entry.save();
  res.json(saved);
});

app.put('/ledger/:id', async (req, res) => {
  const updated = await Ledger.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

app.get('/ledger', async (req, res) => {
  const entries = await Ledger.find({}, '-__v');
  res.json(entries);
});

app.get('/ledger/:account', async (req, res) => {
  const entries = await Ledger.find({ accountName: req.params.account }, '-__v');
  res.json(entries);
});

app.get('/ledger/summary/:account', async (req, res) => {
  const entries = await Ledger.find({ accountName: req.params.account });
  const totalDue = entries.reduce((sum, e) => sum + e.amountDue, 0);
  const totalReceived = entries.reduce((sum, e) => sum + e.amountReceived, 0);
  res.json({
    accountName: req.params.account,
    totalDue,
    totalReceived,
    balance: totalDue - totalReceived
  });
});

app.post('/ledger/bulk', async (req, res) => {
  try {
    await Ledger.insertMany(req.body);
    res.status(200).send("Bulk insert successful");
  } catch (err) {
    res.status(500).send("Error inserting bulk entries");
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));