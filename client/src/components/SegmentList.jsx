import React from 'react';
import { ListGroup, Button, Badge } from 'react-bootstrap';

/**
 * SegmentList displays all connections (segments) in the network, ordered alphabetically.
 * 
 * Props:
 * - segments: Array of { id: "u-v", a: {id, name}, b: {id, name} }
 * - selectedSegments: Array of strings ("u-v") representing segments already selected
 * - onSelectSegment: Callback function(segmentKey)
 * - currentEndpointName: String representing the name of the current path endpoint (for user guidance)
 */
export default function SegmentList({
  segments = [],
  selectedSegments = [],
  onSelectSegment,
  currentEndpointName = null
}) {
  return (
    <div className="segment-list-container border rounded p-3 bg-white shadow-sm h-100 d-flex flex-column">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Available Connections</h5>
        <Badge bg="secondary" pill>
          {segments.length} segments
        </Badge>
      </div>

      {currentEndpointName && (
        <div className="alert alert-info py-2 px-3 mb-3 small path-tip-animate" key={currentEndpointName}>
          <strong>Path tip:</strong> Chaining from <strong>{currentEndpointName}</strong>.
        </div>
      )}

      <div
        className="flex-grow-1 overflow-auto pe-1"
        style={{ maxHeight: '420px', minHeight: '300px' }}
      >
        <ListGroup variant="flush">
          {segments.map(seg => {
            // Check if this segment is already selected in the active route
            const isUsed = selectedSegments.includes(seg.id);

            return (
              <ListGroup.Item
                key={seg.id}
                className={`d-flex justify-content-between align-items-center py-2 px-1 border-bottom ${
                  isUsed ? 'segment-item-selected' : 'segment-item-available'
                }`}
                style={{
                  backgroundColor: isUsed ? '#f8f9fa' : 'transparent',
                  opacity: isUsed ? 0.6 : 1
                }}
              >
                <div className="d-flex align-items-center gap-2">
                  <span className="font-monospace text-muted small" style={{ width: '45px' }}>
                    [{seg.id}]
                  </span>
                  <div className="fw-semibold text-dark small">
                    {seg.a.name} <span className="text-secondary fw-normal">↔</span> {seg.b.name}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant={isUsed ? "outline-secondary" : "outline-primary"}
                  disabled={isUsed}
                  onClick={() => onSelectSegment(seg.id)}
                  style={{ minWidth: '70px' }}
                >
                  {isUsed ? 'Selected' : 'Add'}
                </Button>
              </ListGroup.Item>
            );
          })}
        </ListGroup>
      </div>
    </div>
  );
}
