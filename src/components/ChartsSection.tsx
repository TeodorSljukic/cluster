"use client";

import { useState, useEffect } from "react";
import {
  Bar,
  Doughnut,
} from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { FileText, TrendingUp } from "lucide-react";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardStats {
  postsByType: {
    news: number;
    events: number;
    resources: number;
    skills: number;
  };
}

interface InterestData {
  interest: string;
  count: number;
}

type ChartType = "posts" | "interests";

export function ChartsSection() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [interests, setInterests] = useState<InterestData[]>([]);
  const [selectedChart, setSelectedChart] = useState<ChartType>("posts");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [statsRes, interestsRes] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/dashboard/users-interests"),
      ]);

      const statsData = await statsRes.json();
      const interestsData = await interestsRes.json();

      setStats(statsData);
      setInterests(interestsData);
    } catch (error) {
      console.error("Error loading chart data:", error);
    } finally {
      setLoading(false);
    }
  }

  const postsByTypeData = {
    labels: ["News", "Events", "Resources", "Skills"],
    datasets: [
      {
        data: stats
          ? [
              stats.postsByType.news,
              stats.postsByType.events,
              stats.postsByType.resources,
              stats.postsByType.skills,
            ]
          : [0, 0, 0, 0],
        backgroundColor: [
          "rgba(0, 95, 153, 0.8)",
          "rgba(0, 153, 76, 0.8)",
          "rgba(255, 165, 0, 0.8)",
          "rgba(230, 57, 70, 0.8)",
        ],
        borderColor: [
          "rgba(0, 95, 153, 1)",
          "rgba(0, 153, 76, 1)",
          "rgba(255, 165, 0, 1)",
          "rgba(230, 57, 70, 1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const interestsChartData = {
    labels: (Array.isArray(interests) ? interests.slice(0, 10) : []).map((item) => item.interest),
    datasets: [
      {
        label: "Users",
        data: (Array.isArray(interests) ? interests.slice(0, 10) : []).map((item) => item.count),
        backgroundColor: "rgba(0, 119, 204, 0.7)",
        borderColor: "rgba(0, 119, 204, 1)",
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleFont: { size: 14, weight: "bold" as const },
        bodyFont: { size: 13 },
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 15,
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleFont: { size: 14, weight: "bold" as const },
        bodyFont: { size: 13 },
        cornerRadius: 8,
      },
    },
  };

  if (loading) {
    return (
      <section className="charts-section">
        <div className="container">
          <div className="charts-loading">
            <div className="loading-spinner"></div>
            <p>Loading charts...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="charts-section" data-aos="fade-up">
      <div className="container">
        <div className="charts-section-header" data-aos="fade-up">
          <h2 className="charts-section-title">Community Insights</h2>
          <p className="charts-section-subtitle">
            Explore data and trends from our community
          </p>
        </div>

        <div className="charts-selector-wrapper" data-aos="fade-up" data-aos-delay="100">
          <div className="charts-selector">
            <button
              className={`chart-selector-btn ${selectedChart === "posts" ? "active" : ""}`}
              onClick={() => setSelectedChart("posts")}
              type="button"
            >
              <FileText size={20} />
              <span>Posts by Type</span>
            </button>
            <button
              className={`chart-selector-btn ${selectedChart === "interests" ? "active" : ""}`}
              onClick={() => setSelectedChart("interests")}
              type="button"
            >
              <TrendingUp size={20} />
              <span>Top Interests</span>
            </button>
          </div>
        </div>

        <div className="chart-display-wrapper" data-aos="fade-up" data-aos-delay="200">
          <div className="chart-display-card">
            <div className="chart-display-header">
              <h3>
                {selectedChart === "posts" ? (
                  <>
                    <FileText size={24} />
                    Posts by Type
                  </>
                ) : (
                  <>
                    <TrendingUp size={24} />
                    Top Interests
                  </>
                )}
              </h3>
            </div>
            <div className="chart-display-body">
              {selectedChart === "posts" ? (
                stats && stats.postsByType ? (
                  <Doughnut data={postsByTypeData} options={doughnutOptions} />
                ) : (
                  <div className="chart-empty">No data available</div>
                )
              ) : interests.length > 0 ? (
                <Bar data={interestsChartData} options={chartOptions} />
              ) : (
                <div className="chart-empty">No data available</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
