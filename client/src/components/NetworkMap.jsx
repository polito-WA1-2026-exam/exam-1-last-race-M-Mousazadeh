import React from 'react';

/**
 * NetworkMap renders the metro network map as an SVG graphic.
 * 
 * Props:
 * - stations: Array of { id, name, x, y }
 * - lines: Array of { id, name, color, stationIds }
 * - showLines: Boolean (whether to draw the colored line paths)
 * - startStation: Object { id, name } or null (highlight start)
 * - destStation: Object { id, name } or null (highlight destination)
 * - routeSegments: Array of strings ("u-v" keys) indicating the selected path so far
 */
export default function NetworkMap({
  stations = [],
  lines = [],
  showLines = true,
  startStation = null,
  destStation = null,
  routeSegments = []
}) {
  // Create a fast coordinate lookup table by station ID
  const coords = React.useMemo(() => {
    const map = new Map();
    stations.forEach(s => map.set(s.id, { x: s.x, y: s.y, name: s.name }));
    return map;
  }, [stations]);

  // Convert selected route segments to coordinates for path drawing
  const activePathLines = React.useMemo(() => {
    const list = [];
    routeSegments.forEach(key => {
      const parts = key.split('-').map(Number);
      if (parts.length === 2) {
        const u = coords.get(parts[0]);
        const v = coords.get(parts[1]);
        if (u && v) {
          list.push({ x1: u.x, y1: u.y, x2: v.x, y2: v.y });
        }
      }
    });
    return list;
  }, [routeSegments, coords]);

  return (
    <div className="network-map-container bg-white p-3 border rounded shadow-sm">
      <svg
        viewBox="80 80 750 420"
        className="w-100"
        style={{
          maxHeight: '480px',
          background: '#fafafa',
          borderRadius: '8px'
        }}
      >
        {/* 1. DRAW METRO LINES (Only in Setup phase / showLines = true) */}
        {showLines && lines.map(line => {
          // Build connection path points
          const points = line.stationIds
            .map(id => coords.get(id))
            .filter(Boolean)
            .map(c => `${c.x},${c.y}`)
            .join(' ');

          return (
            <polyline
              key={line.id}
              points={points}
              fill="none"
              stroke={line.color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.85"
            />
          );
        })}

        {/* 2. DRAW CURRENT PLANNED PATH SECTIONS (Planning phase) */}
        {!showLines && activePathLines.map((line, idx) => (
          <line
            key={`active-line-${idx}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="#212529"
            strokeWidth="5"
            strokeDasharray="4 4"
            strokeLinecap="round"
          />
        ))}

        {/* 3. DRAW STATION DOTS */}
        {stations.map(station => {
          const isStart = startStation && startStation.id === station.id;
          const isDest = destStation && destStation.id === station.id;

          // Determine dot style
          let circleColor = '#6c757d';
          let r = 8;
          let strokeColor = '#fff';
          let strokeWidth = 2;

          if (isStart) {
            circleColor = '#2a9d3f'; // Green for start
            r = 12;
            strokeColor = '#d2e7d6';
            strokeWidth = 5;
          } else if (isDest) {
            circleColor = '#d7263d'; // Red for destination
            r = 12;
            strokeColor = '#f5d6da';
            strokeWidth = 5;
          }

          return (
            <g key={station.id}>
              {/* Station shadow/glow circle */}
              <circle
                cx={station.x}
                cy={station.y}
                r={r}
                fill={circleColor}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                style={{ transition: 'all 0.3s ease' }}
              />

              {/* Station Label */}
              <text
                x={station.x}
                y={station.y - r - 4}
                textAnchor="middle"
                fontSize="12"
                fontWeight={isStart || isDest ? 'bold' : 'normal'}
                fill={isStart ? '#1e7e34' : isDest ? '#bd2130' : '#212529'}
                style={{
                  textShadow: '1px 1px 1px #fff, -1px -1px 1px #fff, 1px -1px 1px #fff, -1px 1px 1px #fff',
                  userSelect: 'none'
                }}
              >
                {station.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* SVG Legend for reference */}
      {showLines && (
        <div className="mt-2 d-flex flex-wrap gap-3 justify-content-center border-top pt-2">
          {lines.map(line => (
            <div key={line.id} className="d-flex align-items-center gap-1">
              <span
                style={{
                  display: 'inline-block',
                  width: '18px',
                  height: '6px',
                  backgroundColor: line.color,
                  borderRadius: '2px'
                }}
              />
              <span className="small text-muted font-monospace">{line.name} Line</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
