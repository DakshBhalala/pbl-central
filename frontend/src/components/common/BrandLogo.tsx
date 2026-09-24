import React from 'react';

interface BrandLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  textVariant?: 'full' | 'compact';
}

/**
 * PBL Central Institutional Brand Identity Mark.
 * Geometric SVG derived from interconnected academic progression planes
 * and structured milestone workflows.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 28,
  className = '',
  showText = false,
  textVariant = 'full',
}) => {
  return (
    <div
      className={`brand-logo-container ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        userSelect: 'none',
      }}
    >
      {/* SVG Geometric Mark: Stepped progression planes with focal node */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        {/* Foundation Layer - Institutional base */}
        <path
          d="M6 18L16 23L26 18L16 13L6 18Z"
          fill="currentColor"
          fillOpacity="0.18"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Intermediate Progression Layer - Milestone workflow */}
        <path
          d="M6 13L16 18L26 13L16 8L6 13Z"
          fill="currentColor"
          fillOpacity="0.45"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Apex Plane - Active accomplishment */}
        <path
          d="M6 8L16 13L26 8L16 3L6 8Z"
          fill="currentColor"
          fillOpacity="0.95"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Vertical Axis Node - Central connectivity line */}
        <circle cx="16" cy="13" r="1.5" fill="var(--bg-canvas, #0d1117)" />
      </svg>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span
            style={{
              fontSize: textVariant === 'compact' ? '0.875rem' : '1.0625rem',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              color: 'var(--text-primary)',
            }}
          >
            PBL Central
          </span>
          {textVariant === 'full' && (
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginTop: '3px',
              }}
            >
              Academic Workspace
            </span>
          )}
        </div>
      )}
    </div>
  );
};
