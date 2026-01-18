"use client";

import { useState, useEffect } from "react";
import { Users, FileText, UserCheck, Eye } from "lucide-react";

interface StatsData {
  stats: {
    totalUsers: number;
    totalPosts: number;
    acceptedConnections: number;
    totalConnections: number;
    onlineUsers: number;
    publishedPosts: number;
  };
}

export function StatsSection() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [visitors, setVisitors] = useState({ today: "0", total: "0" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const [statsRes, visitorsRes] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/dashboard/visitors"),
      ]);

      const statsData = await statsRes.json();
      const visitorsData = await visitorsRes.json();

      setStats(statsData);
      setVisitors(visitorsData);
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="stat-card-skeleton">
                <div className="skeleton-icon"></div>
                <div className="skeleton-content">
                  <div className="skeleton-title"></div>
                  <div className="skeleton-value"></div>
                  <div className="skeleton-label"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="stats-section" data-aos="fade-up">
      <div className="container">
        <div className="stats-section-header" data-aos="fade-up">
          <h2 className="stats-section-title">Community Overview</h2>
          <p className="stats-section-subtitle">
            Join our growing community of professionals and organizations
          </p>
        </div>

        <div className="stats-grid">
          <div className="home-stat-card home-stat-card-primary" data-aos="fade-up" data-aos-delay="100">
            <div className="home-stat-card-icon">
              <Users size={32} />
            </div>
            <div className="home-stat-card-content">
              <h3>Total Users</h3>
              <p className="home-stat-card-value">{stats?.stats.totalUsers || 0}</p>
              <span className="home-stat-card-label">
                {stats?.stats.onlineUsers || 0} online
              </span>
            </div>
          </div>

          <div className="home-stat-card home-stat-card-success" data-aos="fade-up" data-aos-delay="200">
            <div className="home-stat-card-icon">
              <FileText size={32} />
            </div>
            <div className="home-stat-card-content">
              <h3>Total Posts</h3>
              <p className="home-stat-card-value">{stats?.stats.totalPosts || 0}</p>
              <span className="home-stat-card-label">
                {stats?.stats.publishedPosts || 0} published
              </span>
            </div>
          </div>

          <div className="home-stat-card home-stat-card-info" data-aos="fade-up" data-aos-delay="300">
            <div className="home-stat-card-icon">
              <UserCheck size={32} />
            </div>
            <div className="home-stat-card-content">
              <h3>Connections</h3>
              <p className="home-stat-card-value">
                {stats?.stats.acceptedConnections || 0}
              </p>
              <span className="home-stat-card-label">
                {stats?.stats.totalConnections || 0} total
              </span>
            </div>
          </div>

          <div className="home-stat-card home-stat-card-visitors" data-aos="fade-up" data-aos-delay="400">
            <div className="home-stat-card-icon">
              <Eye size={32} />
            </div>
            <div className="home-stat-card-content">
              <h3>Visitors Today</h3>
              <p className="home-stat-card-value">{visitors.today}</p>
              <span className="home-stat-card-label">{visitors.total} total</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
