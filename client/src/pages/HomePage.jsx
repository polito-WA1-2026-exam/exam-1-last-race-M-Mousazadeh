import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <Container className="py-4">
      {/* Title Hero */}
      <div className="text-center mb-5 bg-light p-5 rounded-4 shadow-sm border border-2">
        <h1 className="display-4 fw-extrabold text-dark font-monospace">🚇 Last Race</h1>
        <p className="lead text-secondary mt-3">
          A thrilling strategic transit journey game. Construct routes across a metro network under pressure!
        </p>

        {user ? (
          <div className="mt-4">
            <h5 className="text-success mb-3 font-monospace">Welcome back, {user.name}!</h5>
            <Button
              as={Link}
              to="/play"
              size="lg"
              variant="success"
              className="fw-bold px-5 py-3 shadow text-uppercase"
            >
              Start the Race! 🏁
            </Button>
          </div>
        ) : (
          <div className="mt-4">
            <p className="text-muted mb-3">You must be logged in to access the network map and start playing.</p>
            <Button
              as={Link}
              to="/login"
              size="lg"
              variant="primary"
              className="fw-bold px-5 py-3 shadow text-uppercase"
            >
              Sign In to Play
            </Button>
          </div>
        )}
      </div>

      {/* Rules / Steps Cards */}
      <h3 className="mb-4 text-dark text-center font-monospace uppercase border-bottom pb-2">How to Play</h3>
      <Row className="g-4 mb-5">
        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm bg-white hover-shadow-sm">
            <Card.Body className="p-4 d-flex flex-column text-center">
              <span className="fs-1 mb-2">🗺️</span>
              <Card.Title className="fw-bold fs-5">1. Setup Phase</Card.Title>
              <Card.Text className="text-secondary small flex-grow-1">
                Study the full metro network map showing stations, colored lines, and connections. Prepare your strategy and click "Start" when ready.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm bg-white">
            <Card.Body className="p-4 d-flex flex-column text-center">
              <span className="fs-1 mb-2">⏱️</span>
              <Card.Title className="fw-bold fs-5">2. Planning Phase</Card.Title>
              <Card.Text className="text-secondary small flex-grow-1">
                A 90s timer starts! The map lines disappear, leaving only names and nodes. You are assigned a <strong>start</strong> and <strong>destination</strong>. Chain alphabetical connections sequentially.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm bg-white">
            <Card.Body className="p-4 d-flex flex-column text-center">
              <span className="fs-1 mb-2">🎲</span>
              <Card.Title className="fw-bold fs-5">3. Execution Phase</Card.Title>
              <Card.Text className="text-secondary small flex-grow-1">
                The server validates your route. If valid, random events on each segment modify your starting total of <strong>20 coins</strong>. Mid-journey coins can be negative.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm bg-white">
            <Card.Body className="p-4 d-flex flex-column text-center">
              <span className="fs-1 mb-2">🏆</span>
              <Card.Title className="fw-bold fs-5">4. Result Phase</Card.Title>
              <Card.Text className="text-secondary small flex-grow-1">
                If the route is invalid, you get <strong>0</strong>. Otherwise, your final score is the remaining coins (clamped to 0). High scores appear on the leaderboard!
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Transit Network Constraints info block */}
      <Card bg="light" className="border-0 shadow-sm mb-4">
        <Card.Body className="p-4">
          <h5 className="fw-bold font-monospace text-dark mb-3">⚠️ Network Constraints & Rules</h5>
          <ul className="text-secondary small mb-0">
            <li className="mb-2">
              <strong>Line Change Rule:</strong> You can only change lines at <strong>interchange stations</strong> (stations where multiple colored routes meet). If you chain two consecutive segments that do not share a common line, they must meet at an interchange node!
            </li>
            <li className="mb-2">
              <strong>Undirected paths:</strong> Connections are bidirectional. You can move in either direction.
            </li>
            <li className="mb-2">
              <strong>Segment limit:</strong> Each connection segment can be visited <strong>at most once</strong> per game.
            </li>
            <li className="mb-2">
              <strong>Loops:</strong> Station revisiting is allowed (cycles), provided segment reuse is avoided.
            </li>
            <li>
              <strong>Authoritative validation:</strong> The backend verifies all connections. On timeout, your current selection is automatically submitted!
            </li>
          </ul>
        </Card.Body>
      </Card>
    </Container>
  );
}
