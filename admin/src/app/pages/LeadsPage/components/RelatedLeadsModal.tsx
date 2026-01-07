import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '../../../../theme';
import { Button } from '../../../components/Button';
import { leadsApi } from '../../../api';
import { statusColors, statusLabels, sourceLabels, sourceColors } from '../types';
import type { CustomerLead } from '../types';

interface RelatedLeadsModalProps {
  lead: CustomerLead | null;
  onClose: () => void;
  onMerge: (primaryId: string, secondaryIds: string[]) => Promise<void>;
  onViewLead: (lead: CustomerLead) => void;
}

export function RelatedLeadsModal({ lead, onClose, onMerge, onViewLead }: RelatedLeadsModalProps) {
  const [relatedLeads, setRelatedLeads] = useState<Record<string, CustomerLead[]>>({});
  const [loading, setLoading] = useState(false);
  const [selectedForMerge, setSelectedForMerge] = useState<Set<string>>(new Set());
  const [merging, setMerging] = useState(false);

  const fetchRelatedLeads = useCallback(async () => {
    if (!lead) return;
    setLoading(true);
    try {
      const result = await leadsApi.getRelated(lead.id);
      setRelatedLeads(result.bySource);
    } catch (error) {
      console.error('Failed to fetch related leads:', error);
    } finally {
      setLoading(false);
    }
  }, [lead]);

  useEffect(() => {
    if (lead) {
      fetchRelatedLeads();
      setSelectedForMerge(new Set());
    }
  }, [lead, fetchRelatedLeads]);

  const handleToggleSelect = (leadId: string) => {
    setSelectedForMerge(prev => {
      const next = new Set(prev);
      if (next.has(leadId)) {
        next.delete(leadId);
      } else {
        next.add(leadId);
      }
      return next;
    });
  };

  const handleMerge = async () => {
    if (!lead || selectedForMerge.size === 0) return;
    setMerging(true);
    try {
      await onMerge(lead.id, Array.from(selectedForMerge));
      onClose();
    } catch (error) {
      console.error('Merge failed:', error);
    } finally {
      setMerging(false);
    }
  };

  // Get leads that can be merged (same source as current lead)
  const mergeableSources = lead ? Object.entries(relatedLeads).filter(([source]) => source === lead.source) : [];
  const otherSources = lead ? Object.entries(relatedLeads).filter(([source]) => source !== lead.source) : [];

  if (!lead) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 'min(700px, 100%)',
            maxHeight: '80vh',
            background: tokens.color.surface,
            borderRadius: 12,
            border: `1px solid ${tokens.color.border}`,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div style={{
            padding: 20,
            borderBottom: `1px solid ${tokens.color.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <h2 style={{ color: tokens.color.text, fontSize: 18, fontWeight: 600, margin: 0 }}>
                <i className="ri-links-line" style={{ marginRight: 8, color: tokens.color.primary }} />
                Leads liên quan
              </h2>
              <p style={{ color: tokens.color.muted, fontSize: 13, margin: '4px 0 0' }}>
                SĐT: {lead.phone} ({lead.normalizedPhone || 'chưa chuẩn hóa'})
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: tokens.color.muted,
                cursor: 'pointer',
                padding: 8,
              }}
            >
              <i className="ri-close-line" style={{ fontSize: 20 }} />
            </button>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: tokens.color.muted }}>
                <motion.i
                  className="ri-loader-4-line"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ fontSize: 32 }}
                />
                <p>Đang tải...</p>
              </div>
            ) : (
              <>
                {/* Current Lead Info */}
                <div style={{
                  padding: 16,
                  background: `${tokens.color.primary}15`,
                  borderRadius: 8,
                  marginBottom: 20,
                  border: `1px solid ${tokens.color.primary}40`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <i className="ri-star-fill" style={{ color: tokens.color.primary }} />
                    <span style={{ color: tokens.color.text, fontWeight: 600 }}>Lead hiện tại (Primary)</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span style={{ color: tokens.color.text }}>{lead.name}</span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: sourceColors[lead.source]?.bg || tokens.color.surfaceHover,
                      color: sourceColors[lead.source]?.text || tokens.color.text,
                      fontSize: 12,
                    }}>
                      {sourceLabels[lead.source] || lead.source}
                    </span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: statusColors[lead.status]?.bg,
                      color: statusColors[lead.status]?.text,
                      fontSize: 12,
                    }}>
                      {statusLabels[lead.status]}
                    </span>
                    {lead.submissionCount > 1 && (
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: `${tokens.color.warning}20`,
                        color: tokens.color.warning,
                        fontSize: 12,
                      }}>
                        {lead.submissionCount} lần submit
                      </span>
                    )}
                  </div>
                </div>

                {/* Mergeable Leads (Same Source) */}
                {mergeableSources.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                      <i className="ri-git-merge-line" style={{ marginRight: 8, color: tokens.color.warning }} />
                      Có thể merge (cùng nguồn)
                    </h3>
                    {mergeableSources.map(([source, leads]) => (
                      <div key={source}>
                        {leads.filter(l => l.id !== lead.id).map(relatedLead => (
                          <div
                            key={relatedLead.id}
                            style={{
                              padding: 12,
                              background: selectedForMerge.has(relatedLead.id) 
                                ? `${tokens.color.warning}15` 
                                : tokens.color.surfaceHover,
                              borderRadius: 8,
                              marginBottom: 8,
                              border: `1px solid ${selectedForMerge.has(relatedLead.id) ? tokens.color.warning : tokens.color.border}`,
                              cursor: 'pointer',
                            }}
                            onClick={() => handleToggleSelect(relatedLead.id)}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <input
                                type="checkbox"
                                checked={selectedForMerge.has(relatedLead.id)}
                                onChange={() => handleToggleSelect(relatedLead.id)}
                                style={{ width: 18, height: 18, cursor: 'pointer' }}
                              />
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                  <span style={{ color: tokens.color.text, fontWeight: 500 }}>{relatedLead.name}</span>
                                  <span style={{
                                    padding: '2px 8px',
                                    borderRadius: 4,
                                    background: statusColors[relatedLead.status]?.bg,
                                    color: statusColors[relatedLead.status]?.text,
                                    fontSize: 11,
                                  }}>
                                    {statusLabels[relatedLead.status]}
                                  </span>
                                  {relatedLead.submissionCount > 1 && (
                                    <span style={{
                                      padding: '2px 6px',
                                      borderRadius: 4,
                                      background: `${tokens.color.warning}20`,
                                      color: tokens.color.warning,
                                      fontSize: 11,
                                    }}>
                                      x{relatedLead.submissionCount}
                                    </span>
                                  )}
                                </div>
                                <p style={{ 
                                  color: tokens.color.muted, 
                                  fontSize: 12, 
                                  margin: 0,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  maxWidth: 400,
                                }}>
                                  {relatedLead.content}
                                </p>
                                <span style={{ color: tokens.color.muted, fontSize: 11 }}>
                                  {new Date(relatedLead.createdAt).toLocaleString('vi-VN')}
                                </span>
                              </div>
                              <Button
                                variant="outline"
                                size="small"
                                onClick={(e?: React.MouseEvent) => {
                                  e?.stopPropagation();
                                  onViewLead(relatedLead);
                                }}
                              >
                                <i className="ri-eye-line" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {/* Related Leads (Different Source) */}
                {otherSources.length > 0 && (
                  <div>
                    <h3 style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                      <i className="ri-link" style={{ marginRight: 8, color: tokens.color.info }} />
                      Leads liên quan (khác nguồn - không thể merge)
                    </h3>
                    {otherSources.map(([source, leads]) => (
                      <div key={source} style={{ marginBottom: 16 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          marginBottom: 8,
                          padding: '4px 8px',
                          background: sourceColors[source]?.bg || tokens.color.surfaceHover,
                          borderRadius: 4,
                          width: 'fit-content',
                        }}>
                          <i className={sourceColors[source]?.icon || 'ri-file-line'} style={{ color: sourceColors[source]?.text }} />
                          <span style={{ color: sourceColors[source]?.text || tokens.color.text, fontSize: 12, fontWeight: 500 }}>
                            {sourceLabels[source] || source} ({leads.length})
                          </span>
                        </div>
                        {leads.map(relatedLead => (
                          <div
                            key={relatedLead.id}
                            style={{
                              padding: 12,
                              background: tokens.color.surfaceHover,
                              borderRadius: 8,
                              marginBottom: 8,
                              border: `1px solid ${tokens.color.border}`,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                  <span style={{ color: tokens.color.text, fontWeight: 500 }}>{relatedLead.name}</span>
                                  <span style={{
                                    padding: '2px 8px',
                                    borderRadius: 4,
                                    background: statusColors[relatedLead.status]?.bg,
                                    color: statusColors[relatedLead.status]?.text,
                                    fontSize: 11,
                                  }}>
                                    {statusLabels[relatedLead.status]}
                                  </span>
                                </div>
                                <p style={{ 
                                  color: tokens.color.muted, 
                                  fontSize: 12, 
                                  margin: 0,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  maxWidth: 400,
                                }}>
                                  {relatedLead.content}
                                </p>
                                <span style={{ color: tokens.color.muted, fontSize: 11 }}>
                                  {new Date(relatedLead.createdAt).toLocaleString('vi-VN')}
                                </span>
                              </div>
                              <Button
                                variant="outline"
                                size="small"
                                onClick={() => onViewLead(relatedLead)}
                              >
                                <i className="ri-eye-line" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {Object.keys(relatedLeads).length === 0 && !loading && (
                  <div style={{ textAlign: 'center', padding: 40, color: tokens.color.muted }}>
                    <i className="ri-file-unknow-line" style={{ fontSize: 48, marginBottom: 16, display: 'block' }} />
                    <p>Không tìm thấy leads liên quan</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {selectedForMerge.size > 0 && (
            <div style={{
              padding: 16,
              borderTop: `1px solid ${tokens.color.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: `${tokens.color.warning}10`,
            }}>
              <span style={{ color: tokens.color.text, fontSize: 14 }}>
                Đã chọn <strong>{selectedForMerge.size}</strong> leads để merge
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="outline" onClick={() => setSelectedForMerge(new Set())}>
                  Bỏ chọn
                </Button>
                <Button
                  variant="primary"
                  onClick={handleMerge}
                  disabled={merging}
                  style={{ background: tokens.color.warning }}
                >
                  {merging ? (
                    <>
                      <motion.i
                        className="ri-loader-4-line"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      Đang merge...
                    </>
                  ) : (
                    <>
                      <i className="ri-git-merge-line" /> Merge {selectedForMerge.size} leads
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
