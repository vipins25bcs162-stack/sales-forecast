
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Generate demonstration historical sales data
const history = [];

for (let i = 1; i <= 36; i++) {
  const month = ((i - 1) % 12) + 1;
  const marketing = 2000 + ((i * 137) % 7000);
  const discount = 5 + ((i * 7) % 20);

  const seasonal = 2500 * Math.sin((2 * Math.PI * month) / 12);

  const sales =
    12000 +
    350 * i +
    2.8 * marketing +
    180 * discount +
    seasonal +
    Math.sin(i * 12.3) * 700;

  history.push({
    monthIndex: i,
    month,
    marketing,
    discount,
    sales: Math.round(sales)
  });
}

// Multiple Linear Regression
function features(record) {
  const angle = (2 * Math.PI * record.month) / 12;

  return [
    1,
    record.monthIndex,
    record.marketing / 1000,
    record.discount,
    Math.sin(angle),
    Math.cos(angle)
  ];
}

// Solve linear equations using Gaussian elimination
function solve(matrix, vector) {
  const n = vector.length;
  const a = matrix.map((row, i) => [...row, vector[i]]);

  for (let i = 0; i < n; i++) {
    let max = i;

    for (let j = i + 1; j < n; j++) {
      if (Math.abs(a[j][i]) > Math.abs(a[max][i])) {
        max = j;
      }
    }

    [a[i], a[max]] = [a[max], a[i]];

    if (Math.abs(a[i][i]) < 1e-10) {
      throw new Error("Unable to train regression model");
    }

    const divisor = a[i][i];

    for (let j = i; j <= n; j++) {
      a[i][j] /= divisor;
    }

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

// Train model using historical data
function trainModel(data) {
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

  // Small regularization for numerical stability
  for (let i = 1; i < n; i++) {
    matrix[i][i] += 0.000001;
  }

  return solve(matrix, vector);
}

const model = trainModel(history);

function predictSales(input) {
  const values = features(input);

  const prediction = values.reduce(
    (total, value, index) => total + value * model[index],
    0
  );

  return Math.max(0, Math.round(prediction));
}

// Dashboard API
app.get("/api/dashboard", (req, res) => {
  const recent = history.slice(-12);

  const nextMonth = history.length + 1;
  const month = ((nextMonth - 1) % 12) + 1;

  const forecast = predictSales({
    monthIndex: nextMonth,
    month,
    marketing: 5000,
    discount: 10
  });

  const totalSales = history.reduce(
    (sum, item) => sum + item.sales,
    0
  );

  const averageSales = Math.round(totalSales / history.length);

  res.json({
    totalSales,
    averageSales,
    forecast,
    records: history.length,
    history: recent,
    forecastData: Array.from({ length: 6 }, (_, i) => {
      const index = history.length + i + 1;
      const nextMonth = ((index - 1) % 12) + 1;

      return {
        month: `Month ${nextMonth}`,
        sales: predictSales({
          monthIndex: index,
          month: nextMonth,
          marketing: 5000,
          discount: 10
        })
      };
    })
  });
});

// Prediction API
app.post("/api/predict", (req, res) => {
  try {
    const { month, marketing, discount } = req.body;

    if (
      !Number.isInteger(Number(month)) ||
      Number(month) < 1 ||
      Number(month) > 12 ||
      !Number.isFinite(Number(marketing)) ||
      Number(marketing) < 0 ||
      Number(marketing) > 10000000 ||
      !Number.isFinite(Number(discount)) ||
      Number(discount) < 0 ||
      Number(discount) > 100
    ) {
      return res.status(400).json({
        error: "Enter valid month, marketing budget and discount."
      });
    }

    const monthIndex = history.length + Number(month);

    const prediction = predictSales({
      month: Number(month),
      monthIndex,
      marketing: Number(marketing),
      discount: Number(discount)
    });

    res.json({
      prediction,
      currency: "INR",
      message: "Sales prediction completed successfully"
    });

  } catch (error) {
    res.status(500).json({
      error: "Prediction failed"
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Sales Prediction Server running on port ${PORT}`);
  console.log("Machine Learning model trained successfully!");
});
