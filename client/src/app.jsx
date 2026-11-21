
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";
import "./index.css";

const API = "http://localhost:5000";

function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [records, setRecords] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [averageSales, setAverageSales] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [saleForm, setSaleForm] = useState({
    month: "1",
    year: "2026",
    marketing: "1000",
    discount: "10",
    sales: "50000"
  });

  const [predictForm, setPredictForm] = useState({
    month: "12",
    year: "2026",
    marketing: "1500",
    discount: "10"
  });

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/api/sales`);
      if (!response.ok) throw new Error("Could not load sales data");

      const data = await response.json();
      setRecords(data.records || []);
      setTotalSales(data.totalSales || 0);
      setAverageSales(data.averageSales || 0);
      setTotalRecords(data.totalRecords || 0);
    } catch (err) {
      setError("Unable to connect to server. Please make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  function openPage(page) {
    setActivePage(page);
    setMessage("");
    setError("");
  }

  function updateSaleForm(event) {
    setSaleForm({
      ...saleForm,
      [event.target.name]: event.target.value
    });
  }

  function updatePredictForm(event) {
    setPredictForm({
      ...predictForm,
      [event.target.name]: event.target.value
    });
  }

  async function addSale(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API}/api/sales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: Number(saleForm.month),
          year: Number(saleForm.year),
          marketing: Number(saleForm.marketing),
          discount: Number(saleForm.discount),
          sales: Number(saleForm.sales)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save sales record");
      }

      setMessage("Sales record added successfully!");
      await loadDashboard();
      setActivePage("records");
    } catch (err) {
      setError(err.message);
    }
  }

  async function getPrediction(event) {
    event.preventDefault();
    setPrediction(null);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: Number(predictForm.month),
          year: Number(predictForm.year),
          marketing: Number(predictForm.marketing),
          discount: Number(predictForm.discount)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Prediction failed");
      }

      setPrediction(data.prediction);
      setMessage(data.message || "Prediction completed!");
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteSale(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this sales record?"
    );

    if (!confirmed) return;

    setDeletingId(id);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API}/api/sales/${id}`, {
        method: "DELETE"
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not delete sales record");
      }

      setMessage("Sales record deleted successfully!");
      setPrediction(null);
      await loadDashboard();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  const chartData = records.map((item) => ({
    month: `${item.month}/${item.year}`,
    sales: item.sales
  }));

  const money = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(value);

  const pageTitles = {
    dashboard: [
      "BUSINESS OVERVIEW",
      "Dashboard",
      "Monitor your business performance at a glance."
    ],
    analytics: [
      "PERFORMANCE",
      "Sales Analytics",
      "Review your historical sales performance."
    ],
    add: [
      "HISTORICAL DATA",
      "Add Sales Record",
      "Enter a new monthly sales record."
    ],
    prediction: [
      "MACHINE LEARNING",
      "Sales Prediction",
      "Estimate future sales using your historical data."
    ],
    records: [
      "DATABASE",
      "Sales Records",
      "View and manage your saved sales records."
    ]
  };

  const [eyebrow, title, subtitle] = pageTitles[activePage];

  return (
    <div className="app">

      {/* SIDEBAR MENU */}
      <aside className="sidebar">

        <div className="brand">
          <div className="brand-icon">S</div>
          <div>
            <h2>SalesPredict</h2>
            <span>BUSINESS ANALYTICS</span>
          </div>
        </div>

        <nav className="side-menu">

          <button
            className={activePage === "dashboard" ? "menu-link active" : "menu-link"}
            onClick={() => openPage("dashboard")}
          >
            ▦ Dashboard
          </button>

          <button
            className={activePage === "analytics" ? "menu-link active" : "menu-link"}
            onClick={() => openPage("analytics")}
          >
            ▤ Sales Analytics
          </button>

          <button
            className={activePage === "add" ? "menu-link active" : "menu-link"}
            onClick={() => openPage("add")}
          >
            ＋ Add Sales
          </button>

          <button
            className={activePage === "prediction" ? "menu-link active" : "menu-link"}
            onClick={() => openPage("prediction")}
          >
            ✦ Sales Prediction
          </button>

          <button
            className={activePage === "records" ? "menu-link active" : "menu-link"}
            onClick={() => openPage("records")}
          >
            ▣ Sales Records
          </button>

        </nav>

        <div className="sidebar-bottom">
          <span className="online-dot"></span>
          Backend connection
          <strong>API : 5000</strong>
        </div>

      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">

        <header className="topbar">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p className="subtitle">{subtitle}</p>
          </div>

          <button className="refresh-btn" onClick={loadDashboard}>
            ↻ Refresh Data
          </button>
        </header>

        {loading && (
          <div className="notice">Loading dashboard...</div>
        )}

        {error && (
          <div className="error-message">{error}</div>
        )}

        {message && (
          <div className="success-message">{message}</div>
        )}

        {/* DASHBOARD PAGE */}
        {activePage === "dashboard" && (
          <>

            <section className="stats-grid">

              <div className="stat-card">
                <div className="stat-icon purple">₹</div>
                <p>Total Sales</p>
                <h2>{money(totalSales)}</h2>
                <span>All recorded sales</span>
              </div>

              <div className="stat-card">
                <div className="stat-icon blue">▤</div>
                <p>Average Sales</p>
                <h2>{money(averageSales)}</h2>
                <span>Average per record</span>
              </div>

              <div className="stat-card">
                <div className="stat-icon green">▣</div>
                <p>Total Records</p>
                <h2>{totalRecords}</h2>
                <span>Saved in MongoDB</span>
              </div>

              <div className="stat-card">
                <div className="stat-icon orange">✦</div>
                <p>Prediction Model</p>
                <h2>{totalRecords >= 5 ? "Ready" : "Training"}</h2>
                <span>
                  {totalRecords >= 5
                    ? "Enough records available"
                    : `${5 - totalRecords} more records needed`}
                </span>
              </div>

            </section>

            <section className="panel chart-panel">

              <div className="section-heading">
                <div>
                  <p className="eyebrow">PERFORMANCE</p>
                  <h2>Sales Overview</h2>
                </div>
                <span className="tag">Historical Data</span>
              </div>

              {chartData.length > 0 ? (
                <div className="chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => money(value)} />
                      <Bar
                        dataKey="sales"
                        fill="#7865e8"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="empty-state">
                  No sales records yet. Add historical sales to see your chart.
                </div>
              )}

            </section>

            <section className="panel">

              <div className="section-heading">
                <div>
                  <p className="eyebrow">QUICK ACCESS</p>
                  <h2>Manage Your Sales</h2>
                </div>
              </div>

              <div className="quick-actions">
                <button
                  className="primary-btn"
                  onClick={() => openPage("add")}
                >
                  ＋ Add Sales
                </button>

                <button
                  className="primary-btn"
                  onClick={() => openPage("prediction")}
                >
                  ✦ Predict Sales
                </button>

                <button
                  className="primary-btn"
                  onClick={() => openPage("records")}
                >
                  ▣ View Records
                </button>
              </div>

            </section>

          </>
        )}

        {/* SALES ANALYTICS PAGE */}
        {activePage === "analytics" && (
          <section className="panel chart-panel">

            <div className="section-heading">
              <div>
                <p className="eyebrow">PERFORMANCE</p>
                <h2>Sales Analytics</h2>
              </div>
              <span className="tag">Historical Data</span>
            </div>

            {chartData.length > 0 ? (
              <div className="chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => money(value)} />
                    <Bar
                      dataKey="sales"
                      fill="#7865e8"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="empty-state">
                No sales records available for analytics yet.
              </div>
            )}

          </section>
        )}

        {/* ADD SALES PAGE */}
        {activePage === "add" && (
          <section className="panel form-page">

            <div className="section-heading">
              <div>
                <p className="eyebrow">HISTORICAL DATA</p>
                <h2>Add Sales Record</h2>
              </div>
              <span className="form-icon">＋</span>
            </div>

            <form onSubmit={addSale}>

              <div className="form-grid">

                <label>
                  Month (1–12)
                  <input
                    type="number"
                    name="month"
                    min="1"
                    max="12"
                    value={saleForm.month}
                    onChange={updateSaleForm}
                    required
                  />
                </label>

                <label>
                  Year
                  <input
                    type="number"
                    name="year"
                    min="2000"
                    max="2100"
                    value={saleForm.year}
                    onChange={updateSaleForm}
                    required
                  />
                </label>

                <label>
                  Marketing Budget (₹)
                  <input
                    type="number"
                    name="marketing"
                    min="0"
                    value={saleForm.marketing}
                    onChange={updateSaleForm}
                    required
                  />
                </label>

                <label>
                  Discount (%)
                  <input
                    type="number"
                    name="discount"
                    min="0"
                    max="100"
                    value={saleForm.discount}
                    onChange={updateSaleForm}
                    required
                  />
                </label>

                <label className="full-width">
                  Actual Sales (₹)
                  <input
                    type="number"
                    name="sales"
                    min="0"
                    value={saleForm.sales}
                    onChange={updateSaleForm}
                    required
                  />
                </label>

              </div>

              <button className="primary-btn" type="submit">
                Save Sales Record
              </button>

            </form>

          </section>
        )}

        {/* SALES PREDICTION PAGE */}
        {activePage === "prediction" && (
          <section className="panel prediction-panel form-page">

            <div className="section-heading">
              <div>
                <p className="eyebrow">MACHINE LEARNING</p>
                <h2>Predict Future Sales</h2>
              </div>
              <span className="form-icon sparkle">✦</span>
            </div>

            <form onSubmit={getPrediction}>

              <div className="form-grid">

                <label>
                  Prediction Month (1–12)
                  <input
                    type="number"
                    name="month"
                    min="1"
                    max="12"
                    value={predictForm.month}
                    onChange={updatePredictForm}
                    required
                  />
                </label>

                <label>
                  Year
                  <input
                    type="number"
                    name="year"
                    min="2000"
                    max="2100"
                    value={predictForm.year}
                    onChange={updatePredictForm}
                    required
                  />
                </label>

                <label>
                  Marketing Budget (₹)
                  <input
                    type="number"
                    name="marketing"
                    min="0"
                    value={predictForm.marketing}
                    onChange={updatePredictForm}
                    required
                  />
                </label>

                <label>
                  Discount (%)
                  <input
                    type="number"
                    name="discount"
                    min="0"
                    max="100"
                    value={predictForm.discount}
                    onChange={updatePredictForm}
                    required
                  />
                </label>

              </div>

              <button className="primary-btn predict-btn" type="submit">
                ✦ Generate Sales Prediction
              </button>

            </form>

            {prediction !== null && (
              <div className="prediction-result">
                <span>Predicted Sales</span>
                <h2>{money(prediction)}</h2>
                <p>Estimated sales based on your historical records.</p>
              </div>
            )}

            {totalRecords < 5 && (
              <p className="hint">
                Add at least 5 historical sales records before generating a prediction.
              </p>
            )}

          </section>
        )}

        {/* SALES RECORDS PAGE */}
        {activePage === "records" && (
          <section className="panel records-panel">

            <div className="section-heading">
              <div>
                <p className="eyebrow">DATABASE</p>
                <h2>Sales Records</h2>
              </div>
              <span className="tag">{totalRecords} Records</span>
            </div>

            {records.length > 0 ? (
              <div className="table-wrap">

                <table>
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Year</th>
                      <th>Marketing</th>
                      <th>Discount</th>
                      <th>Sales</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {records.slice().reverse().map((item) => (
                      <tr key={item._id}>
                        <td>{item.month}</td>
                        <td>{item.year}</td>
                        <td>{money(item.marketing)}</td>
                        <td>{item.discount}%</td>
                        <td className="sales-value">
                          {money(item.sales)}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="delete-btn"
                            onClick={() => deleteSale(item._id)}
                            disabled={deletingId === item._id}
                          >
                            {deletingId === item._id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

              </div>
            ) : (
              <div className="empty-state">
                No records found. Use Add Sales to get started.
              </div>
            )}

          </section>
        )}

        <footer>
          SalesPredict · MERN Stack Sales Forecasting System
        </footer>

      </main>
    </div>
  );
}

export default App;
