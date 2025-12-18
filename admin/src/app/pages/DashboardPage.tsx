import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { LeadsLineChart, LeadsPieChart, LeadsBarChart, ConversionRateCard } from '../components/charts';
import { leadsApi, serviceCategoriesApi, materialsApi } from '../api';
import type { CustomerLead } from '../types';

interface LeadsStats {
  dailyLeads: Array<{ date: string; count: number }>;
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  conversionRate: number;
  totalLeads: number;
  newLeads: number;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalLeads: 0,
    newLeads: 0,
    totalCategories: 0,
    totalMaterials: 0,
  });
  const [leadsStats, setLeadsStats] = useState<LeadsStats | null>(null);
  const [recentLeads, setRecentLeads] = useState<CustomerLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      const [leadsResponse, categories, materials] = await Promise.all([
        leadsApi.list({ limit: 5 }),
        serviceCategoriesApi.list(),
        materialsApi.list(),
      ]);

      setRecentLeads(leadsResponse.data);
      setStats({
        totalLeads: leadsResponse.total,
        newLeads: leadsResponse.data.filter((l: CustomerLead) => l.status === 'NEW').length,
        totalCategories: categories.length,
        totalMaterials: materials.length,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }

    // Load charts data separately
    try {
      const statsData = await leadsApi.getStats();
      setLeadsStats(statsData);
      // Update stats with accurate totals from stats API
      setStats(prev => ({
        ...prev,
        totalLeads: statsData.totalLeads,
        newLeads: statsData.newLeads,
      }));
    } catch (error) {
      console.error('Failed to load leads stats:', error);
    } finally {
      setChartsLoading(false);
    }
  }

  const statCards = [
    { icon: 'ri-contacts-book-line', label: 'Tổng khách hàng', value: stats.totalLeads, color: tokens.color.primary },
    { icon: 'ri-user-add-line', label: 'Khách mới', value: stats.newLeads, color: '#f59e0b' },
    { icon: 'ri-tools-line', label: 'Hạng mục', value: stats.totalCategories, color: '#8b5cf6' },
    { icon: 'ri-paint-brush-line', label: 'Vật dụng', value: stats.totalMaterials, color: '#10b981' },
  ];

  const statusColors: Record<string, { bg: string; text: string }> = {
    NEW: { bg: 'rgba(59,130,246,0.2)', text: '#3b82f6' },
    CONTACTED: { bg: 'rgba(245,158,11,0.2)', text: '#f59e0b' },
    CONVERTED: { bg: 'rgba(16,185,129,0.2)', text: '#10b981' },
    CANCELLED: { bg: 'rgba(239,68,68,0.2)', text: '#ef4444' },
  };

  const statusLabels: Record<string, string> = {
    NEW: 'Mới',
    CONTACTED: 'Đã liên hệ',
    CONVERTED: 'Đã chuyển đổi',
    CANCELLED: 'Đã hủy',
  };

  return (
    <div>
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ color: tokens.color.text, fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>
            Chào mừng đến Admin Dashboard
          </h2>
          <p style={{ color: tokens.color.muted, fontSize: 16 }}>
            Quản lý website Anh Thợ Xây - Dịch vụ cải tạo nhà chuyên nghiệp
          </p>
        </div>
        <motion.div
          animate={{ 
            boxShadow: ['0 0 0 0 rgba(245,211,147,0.4)', '0 0 0 10px rgba(245,211,147,0)', '0 0 0 0 rgba(245,211,147,0)']
          }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            padding: '12px 20px',
            background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
            borderRadius: tokens.radius.md,
            color: '#111',
            fontWeight: 600,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <i className="ri-tv-line" style={{ fontSize: 18 }} />
          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Landing Page</div>
            <div>localhost:4200</div>
          </div>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20, marginBottom: 32 }}>
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hoverable>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ color: tokens.color.muted, fontSize: 14, marginBottom: 8 }}>{stat.label}</div>
                  <div style={{ color: tokens.color.text, fontSize: 32, fontWeight: 700 }}>{stat.value}</div>
                </div>
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: tokens.radius.md,
                    background: `${stat.color}20`,
                    border: `1px solid ${stat.color}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 28,
                    color: stat.color,
                  }}
                >
                  <i className={stat.icon} />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 32 }}>
        <Card title="Leads theo ngày (30 ngày)" icon="ri-line-chart-line">
          {chartsLoading ? (
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <motion.i
                className="ri-loader-4-line"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ fontSize: 32, color: tokens.color.muted }}
              />
            </div>
          ) : leadsStats ? (
            <LeadsLineChart data={leadsStats.dailyLeads} />
          ) : (
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: tokens.color.muted }}>
              Không có dữ liệu
            </div>
          )}
        </Card>

        <Card title="Tỷ lệ chuyển đổi" icon="ri-percent-line">
          {chartsLoading ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <motion.i
                className="ri-loader-4-line"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ fontSize: 32, color: tokens.color.muted }}
              />
            </div>
          ) : leadsStats ? (
            <ConversionRateCard 
              rate={leadsStats.conversionRate}
              totalLeads={leadsStats.totalLeads}
              convertedLeads={leadsStats.byStatus['CONVERTED'] || 0}
            />
          ) : null}
        </Card>
      </div>

      {/* Second Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
        <Card title="Phân bố theo trạng thái" icon="ri-pie-chart-line">
          {chartsLoading ? (
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <motion.i
                className="ri-loader-4-line"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ fontSize: 32, color: tokens.color.muted }}
              />
            </div>
          ) : leadsStats ? (
            <LeadsPieChart data={leadsStats.byStatus} />
          ) : null}
        </Card>

        <Card title="Phân bố theo nguồn" icon="ri-bar-chart-horizontal-line">
          {chartsLoading ? (
            <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <motion.i
                className="ri-loader-4-line"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ fontSize: 32, color: tokens.color.muted }}
              />
            </div>
          ) : leadsStats ? (
            <LeadsBarChart data={leadsStats.bySource} />
          ) : null}
        </Card>
      </div>

      {/* Recent Leads */}
      <Card title="Khách hàng gần đây" icon="ri-contacts-book-line">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: tokens.color.muted }}>
            <motion.i
              className="ri-loader-4-line"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ fontSize: 32, display: 'block', marginBottom: 12 }}
            />
            Đang tải...
          </div>
        ) : recentLeads.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: tokens.color.muted }}>
            <i className="ri-user-line" style={{ fontSize: 48, display: 'block', marginBottom: 12, opacity: 0.5 }} />
            Chưa có khách hàng nào
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recentLeads.map((lead) => {
              const colors = statusColors[lead.status] || statusColors.NEW;
              return (
                <motion.div
                  key={lead.id}
                  whileHover={{ x: 4 }}
                  style={{
                    padding: 16,
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${tokens.color.border}`,
                    borderRadius: tokens.radius.md,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate('/leads')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: tokens.color.primary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        color: '#111',
                        fontWeight: 600,
                      }}
                    >
                      {lead.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ color: tokens.color.text, fontWeight: 500 }}>{lead.name}</div>
                      <div style={{ color: tokens.color.muted, fontSize: 13 }}>
                        {lead.phone} · {new Date(lead.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '4px 12px',
                      borderRadius: tokens.radius.pill,
                      fontSize: 12,
                      fontWeight: 600,
                      background: colors.bg,
                      color: colors.text,
                    }}
                  >
                    {statusLabels[lead.status] || lead.status}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {[
          { icon: 'ri-contacts-book-line', label: 'Xem khách hàng', color: tokens.color.primary, route: '/leads' },
          { icon: 'ri-calculator-line', label: 'Quản lý công thức', color: '#8b5cf6', route: '/pricing-config' },
          { icon: 'ri-tools-line', label: 'Hạng mục dịch vụ', color: '#f59e0b', route: '/pricing-config' },
          { icon: 'ri-article-line', label: 'Viết bài blog', color: '#10b981', route: '/blog-manager' },
        ].map((action) => (
          <Button key={action.label} variant="secondary" icon={action.icon} fullWidth onClick={() => navigate(action.route)}>
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
