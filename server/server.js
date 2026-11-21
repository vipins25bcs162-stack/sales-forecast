
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const Sales = require("./models/Sales");

const app = express();

app.use(cors());
app.use(express.json());

function solve(matrix, vector) {
  const n = vector.length;
  const a = matrix.map((row, i) => [...row, vector[i]]);

  for (let i = 0; i < n; i++) {
    let max = i;

    for (let j = i + 1; j < n; j++) {
      if (Math.abs(a[j][i]) > Math.abs(a[max][i])) max = j;
    }

    [a[i], a[max]] = [a[max], a[i]];

    if (Math.abs(a[i][i]) < 1e-10) {
      throw new Error("Insufficient or unsuitable training data");
    }

    const divisor = a[i][i];

    for (let j = i; j <= n; j++) a[i][j] /= divisor;

    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = a[k][i];
        for (let j = i; j <= n; j++) {
          a[k][j] -= factor * a[i][j];
        }
      }
    }
  }

  return a.map(row => row[n]);
}

function features(item) {
  return [
    1,
    item.year - 2020,
    item.month,
    item.marketing / 1000,
    item.discount
  ];
}

function trainModel(data) {
  if (data.length < 5) {
    throw new Error("Add at least 5 historical sales records");
  }

  const x = data.map(features);
  const y = data.map(item => item.sales);
  const n = x[0].length;

  const matrix = Array.from(
    { length: n },
    () => Array(n).fill(0)
  );

  const vector = Array(n).fill(0);

  for (let i = 0; i < x.length; i++) {
    for (let j = 0; j < n; j++) {
      vector[j] += x[i][j] * y[i];

      for (let k = 0; k < n; k++) {
        matrix[j][k] += x[i][j] * x[i][k];
      }
    }
  }

  for (let i = 1; i < n; i++) {
    matrix[i][i] += 0.000001;
  }

  return solve(matrix, vector);
}

function predict(model, input) {
  return Math.max(
    0,
    Math.round(
      features(input).reduce(
        (sum, value, i) => sum + value * model[i],
        0
      )
    )
  );
}

// ADD NEW SALES RECORD
app.post("/api/sales", async (req, res) => {
  try {
    const { month, year, marketing, discount, sales } = req.body;
    const values = [month, year, marketing, discount, sales];

    if (
      values.some(v => !Number.isFinite(v)) ||
      !Number.isInteger(month) || month < 1 || month > 12 ||
      !Number.isInteger(year) || year < 2000 || year > 2100 ||
      marketing < 0 || discount < 0 || discount > 100 ||
      sales < 0
    ) {
      return res.status(400).json({ error: "Invalid sales data" });
    }

    const record = await Sales.create({
      month, year, marketing, discount, sales
    });

    res.status(201).json(record);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET ALL SALES RECORDS
app.get("/api/sales", async (req, res) => {
  try {
    const records = await Sales.find().sort({ year: 1, month: 1 });
    const total = records.reduce((sum, item) => sum + item.sales, 0);

    res.json({
      records,
      totalSales: total,
      averageSales: records.length
        ? Math.round(total / records.length)
        : 0,
      totalRecords: records.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE SALES RECORD
app.delete("/api/sales/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sale ID"
      });
    }

    const deletedSale = await Sales.findByIdAndDelete(id);

    if (!deletedSale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found"
      });
    }

    res.json({
      success: true,
      message: "Sale deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// SALES PREDICTION
app.post("/api/predict", async (req, res) => {
  try {
    const { month, year, marketing, discount } = req.body;

    if (
      !Number.isInteger(month) || month < 1 || month > 12 ||
      !Number.isInteger(year) || year < 2000 || year > 2100 ||
      !Number.isFinite(marketing) || marketing < 0 ||
      !Number.isFinite(discount) || discount < 0 || discount > 100
    ) {
      return res.status(400).json({ error: "Invalid prediction inputs" });
    }

    const records = await Sales.find().lean();
    const model = trainModel(records);
    const prediction = predict(model, {
      month, year, marketing, discount
    });

    res.json({
      prediction,
      message: "Sales prediction completed successfully"
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// SERVER HOME
app.get("/", (req, res) => {
  res.send("Sales Prediction API is running!");
});

// CONNECT MONGODB AND START SERVER
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");

    app.listen(process.env.PORT || 5000, () => {
      console.log("MERN Sales Prediction Server running");
    });
  })
  .catch(error => {
    console.error("MongoDB Connection Error:", error.message);
  });
