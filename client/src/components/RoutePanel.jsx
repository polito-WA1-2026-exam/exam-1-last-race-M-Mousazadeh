import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';

/**
 * RoutePanel displays the route constructed so far, shows current status,
 * and allows the user to undo, clear, or submit the route.
 * 
 * Props:
 * - segments: Complete list of segments from API (for station name mapping)
 * - selectedSegments: Ordered array of selected segment IDs ("u-v")
 * - startStation: { id, name }
 * - destStation: { id, name }
 * - onUndo: Callback to remove the last added segment
 * - onClear: Callback to clear all segments
 * - onSubmit: Callback to submit the route
 * - isSubmitting: Boolean flag indicating if API is loading
 */
export default function RoutePanel({
  segments = [],
  selectedSegments = [],
  startStation,
  destStation,
  onUndo,
  onClear,
  onSubmit,
  isSubmitting = false
}) {
  // Compute the chain of stations in order
  const pathInfo = React.useMemo(() => {
    if (!startStation) return { chain: [], currentId: null, disconnected: false };
    
    const chain = [startStation.name];
    let currentId = startStation.id;
    let disconnected = false;

    // Create lookup map of segment metadata
    const segmentsMap = new Map();
    segments.forEach(s => segmentsMap.set(s.id, s));

    for (const key of selectedSegments) {
      const seg = segmentsMap.get(key);
      if (!seg) continue;

      if (seg.a.id === currentId) {
        chain.push(seg.b.name);
        currentId = seg.b.id;
      } else if (seg.b.id === currentId) {
        chain.push(seg.a.name);
        currentId = seg.a.id;
      } else {
        // Player picked a segment that does not link to the end of the current chain
        chain.push(`Disconnect ➔ (${seg.a.name} ↔ ${seg.b.name})`);
        disconnected = true;
        currentId = null;
        break;
      }
    }

    return { chain, currentId, disconnected };
  }, [selectedSegments, startStation, segments]);

  const reachedDest = pathInfo.currentId === destStation?.id;
  const hasRoute = selectedSegments.length > 0;

  return (
    <Card className="shadow-sm border h-100 d-flex flex-column bg-white">
      <Card.Header className="bg-light border-bottom py-3">
        <h5 className="mb-0 text-dark">Your Route Plan</h5>
      </Card.Header>
      
      <Card.Body className="d-flex flex-column flex-grow-1 p-3">
        {/* Destination Target HUD */}
        <div className="d-flex justify-content-between align-items-center mb-3 p-2 bg-light rounded border">
          <div>
            <div className="text-muted small uppercase fw-semibold">Start Station</div>
            <div className="text-success fw-bold">{startStation?.name}</div>
          </div>
          <div className="text-secondary px-2">➔</div>
          <div className="text-end">
            <div className="text-muted small uppercase fw-semibold">Destination</div>
            <div className="text-danger fw-bold">{destStation?.name}</div>
          </div>
        </div>

        {/* Route Chain Display */}
        <div className="flex-grow-1 border rounded p-3 bg-light overflow-auto mb-3" style={{ maxHeight: '200px' }}>
          {hasRoute ? (
            <div className="d-flex flex-column gap-1">
              {pathInfo.chain.map((stationName, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === pathInfo.chain.length - 1;
                const isErr = stationName.includes('Disconnect');

                let badgeColor = 'secondary';
                if (isFirst) badgeColor = 'success';
                else if (isLast && reachedDest) badgeColor = 'danger';
                else if (isErr) badgeColor = 'warning';

                return (
                  <div key={idx} className="d-flex align-items-center gap-2">
                    {idx > 0 && (
                      <div
                        className="text-muted ps-2 py-0 my-0 route-chain-connector"
                        style={{ fontSize: '10px', animationDelay: `${idx * 0.08}s` }}
                      >
                        ▼
                      </div>
                    )}
                    <div
                      className="d-flex align-items-center gap-2 w-100 route-chain-node"
                      style={{ animationDelay: `${idx * 0.08}s` }}
                    >
                      <Badge bg={badgeColor} className="py-1 px-2 text-wrap text-start">
                        {stationName}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-muted my-4 py-2">
              No segments selected yet. Click 'Add' in the connection list to start building your route from <strong>{startStation?.name}</strong>.
            </div>
          )}
        </div>

        {/* Dynamic Status Badges */}
        <div className="mb-3">
          {pathInfo.disconnected && (
            <div className="alert alert-warning py-2 px-3 small mb-0 route-status-animate" key="disconnected">
              ⚠️ <strong>Disconnected Path!</strong> The last segment does not connect to your previous station. The route will be invalid.
            </div>
          )}
          {!pathInfo.disconnected && hasRoute && !reachedDest && (
            <div className="alert alert-secondary py-2 px-3 small mb-0 route-status-animate" key="in-progress">
              ℹ️ <strong>In Progress:</strong> Keep chaining segments to reach <strong>{destStation?.name}</strong>.
            </div>
          )}
          {!pathInfo.disconnected && reachedDest && (
            <div className="alert alert-success py-2 px-3 small mb-0 route-status-animate" key="connected">
              ✅ <strong>Path Connected!</strong> Route reaches the destination. Ready to submit!
            </div>
          )}
        </div>

        {/* Route Building Controls */}
        <div className="d-flex gap-2 mb-2">
          <Button
            variant="outline-secondary"
            className="flex-grow-1"
            onClick={onUndo}
            disabled={!hasRoute || isSubmitting}
            size="sm"
          >
            Undo Last
          </Button>
          <Button
            variant="outline-danger"
            className="flex-grow-1"
            onClick={onClear}
            disabled={!hasRoute || isSubmitting}
            size="sm"
          >
            Clear Route
          </Button>
        </div>

        <Button
          variant="primary"
          onClick={onSubmit}
          disabled={!hasRoute || isSubmitting}
          className="w-100 py-2 fw-semibold"
        >
          {isSubmitting ? 'Validating Route...' : 'Submit Route'}
        </Button>
      </Card.Body>
    </Card>
  );
}
