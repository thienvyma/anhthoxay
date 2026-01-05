/**
 * EndpointGroups - Available endpoints list component
 *
 * Displays available API endpoints grouped by category
 *
 * **Feature: admin-guide-api-keys**
 * **Validates: Requirements 14.2**
 */

import { tokens } from '../../../../../theme';
import { ENDPOINT_GROUP_DETAILS } from './constants';
import { getMethodBadgeColors } from './utils';
import type { EndpointGroup } from './types';

interface EndpointGroupsProps {
  endpointValues: EndpointGroup[];
}

export function EndpointGroups({ endpointValues }: EndpointGroupsProps) {
  return (
    <div style={{ marginTop: 24 }}>
      <label
        style={{
          display: 'block',
          color: tokens.color.muted,
          fontSize: 12,
          fontWeight: 500,
          textTransform: 'uppercase',
          marginBottom: 12,
        }}
      >
        Endpoints có thể sử dụng
      </label>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {endpointValues.map((groupKey) => {
          const group = ENDPOINT_GROUP_DETAILS[groupKey];
          if (!group) return null;

          return (
            <div
              key={groupKey}
              style={{
                background: tokens.color.surface,
                borderRadius: tokens.radius.md,
                border: `1px solid ${tokens.color.border}`,
                overflow: 'hidden',
              }}
            >
              {/* Group Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderBottom: `1px solid ${tokens.color.border}`,
                  background: tokens.color.surfaceAlt,
                }}
              >
                <i
                  className={group.icon}
                  style={{
                    fontSize: 16,
                    color: tokens.color.primary,
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ color: tokens.color.text, fontWeight: 500, fontSize: 13 }}>
                    {group.label}
                  </span>
                  <span
                    style={{
                      marginLeft: 8,
                      fontSize: 10,
                      color: tokens.color.muted,
                      background: tokens.color.surfaceHover,
                      padding: '2px 6px',
                      borderRadius: 4,
                    }}
                  >
                    {group.adminPage}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    color: tokens.color.muted,
                    flexShrink: 0,
                  }}
                >
                  {group.endpoints.length} endpoints
                </span>
              </div>

              {/* Endpoints List */}
              <div style={{ padding: '8px 14px 10px' }}>
                {group.endpoints.map((ep, idx) => {
                  const methodColors = getMethodBadgeColors(ep.method);
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                        padding: '4px 0',
                        fontSize: 11,
                      }}
                    >
                      <span
                        style={{
                          padding: '1px 5px',
                          borderRadius: 3,
                          fontFamily: 'monospace',
                          fontSize: 9,
                          fontWeight: 600,
                          flexShrink: 0,
                          background: methodColors.bg,
                          color: methodColors.color,
                        }}
                      >
                        {ep.method}
                      </span>
                      <code
                        style={{
                          color: tokens.color.text,
                          fontFamily: 'monospace',
                          fontSize: 10,
                          wordBreak: 'break-all',
                        }}
                      >
                        {ep.path}
                      </code>
                      <span
                        style={{
                          color: tokens.color.muted,
                          fontSize: 10,
                          marginLeft: 'auto',
                          textAlign: 'right',
                          flexShrink: 0,
                        }}
                      >
                        {ep.desc}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {endpointValues.length === 0 && (
          <div
            style={{
              padding: 16,
              textAlign: 'center',
              color: tokens.color.muted,
              fontSize: 13,
              background: tokens.color.surface,
              borderRadius: tokens.radius.md,
              border: `1px solid ${tokens.color.border}`,
            }}
          >
            Không có endpoint nào được cấu hình
          </div>
        )}
      </div>
    </div>
  );
}
