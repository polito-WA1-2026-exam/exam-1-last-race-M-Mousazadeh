import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Button, Card, Alert, ProgressBar, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import API from '../api/API';
import { useAuth } from '../contexts/AuthContext';
import NetworkMap from '../components/NetworkMap';
import SegmentList from '../components/SegmentList';
import RoutePanel from '../components/RoutePanel';
import Countdown from '../components/Countdown';
import LoadingSpinner from '../components/LoadingSpinner';
import { useCountdown } from '../hooks/useCountdown';

export default function GamePage() {
  const [phase, setPhase] = useState('setup'); // 'setup' | 'planning' | 'execution' | 'result'
  const [network, setNetwork] = useState({ stations: [], lines: [] });
  const [game, setGame] = useState(null);
  const [selectedSegments, setSelectedSegments] = useState([]);
  const [executionResult, setExecutionResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  // Epoch millisecond target for the planning phase countdown
  const [deadline, setDeadline] = useState(null);

  // Step indicator state for execution animation
  const [currentStepIdx, setCurrentStepIdx] = useState(-1);

  // Guards against double submissions (timer expired vs user clicked submit)
  const isSubmittingRef = useRef(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if user session is lost
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Load network information on mount for the initial Setup map
  useEffect(() => {
    async function loadNetwork() {
      try {
        const data = await API.getNetwork();
        setNetwork(data);
      } catch (err) {
        setErrorMsg('Failed to load network map: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    loadNetwork();
  }, []);

  // Submit route handler (triggered manually or automatically upon timer expiration)
  const handleSubmitRoute = async () => {
    if (isSubmittingRef.current || !game) return;
    isSubmittingRef.current = true;
    setLoading(true);
    setErrorMsg(null);

    try {
      const result = await API.submitRoute(game.gameId, selectedSegments);
      setExecutionResult(result);
      setPhase('execution');
      
      // Start step-by-step execution animation
      if (result.valid && result.steps.length > 0) {
        setCurrentStepIdx(0);
      } else {
        // If route is invalid, we jump directly to the result phase
        setPhase('result');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Submission failed.');
      setPhase('result'); // skip to result with 0 score on critical API failure
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  // Timer expiration trigger (bound to the custom countdown hook)
  const handleTimerExpired = () => {
    if (phase === 'planning' && !isSubmittingRef.current) {
      handleSubmitRoute();
    }
  };

  // Execute the countdown timer hook (only active during 'planning')
  // We use a dummy epoch time if not planning, to avoid calling hook conditionally
  const remainingSeconds = useCountdown(
    phase === 'planning' && deadline ? deadline : Date.now() + 10000,
    handleTimerExpired
  );

  // Trigger phase setup on start race
  const handleStartRace = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const gameData = await API.startGame();
      setGame(gameData);
      setSelectedSegments([]);
      setDeadline(Date.now() + gameData.durationSeconds * 1000);
      setPhase('planning');
    } catch (err) {
      setErrorMsg('Failed to initialize game: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Select a connection segment during route planning
  const handleSelectSegment = (segmentId) => {
    if (selectedSegments.includes(segmentId)) return; // segment selected at most once
    setSelectedSegments(prev => [...prev, segmentId]);
  };

  // Undo the last added route segment
  const handleUndo = () => {
    setSelectedSegments(prev => prev.slice(0, -1));
  };

  // Clear the route selection back to empty
  const handleClear = () => {
    setSelectedSegments([]);
  };

  // Navigation tip calculation for current endpoint
  const currentEndpointName = React.useMemo(() => {
    if (!game || !game.start) return null;
    let curr = game.start.id;
    let name = game.start.name;
    const segmentsMap = new Map();
    game.segments.forEach(s => segmentsMap.set(s.id, s));

    for (const key of selectedSegments) {
      const seg = segmentsMap.get(key);
      if (!seg) continue;
      if (seg.a.id === curr) {
        curr = seg.b.id;
        name = seg.b.name;
      } else if (seg.b.id === curr) {
        curr = seg.a.id;
        name = seg.a.name;
      } else {
        curr = null;
        name = null;
        break;
      }
    }
    return name;
  }, [selectedSegments, game]);

  // Handle step-by-step execution animation ticks
  useEffect(() => {
    if (phase !== 'execution' || !executionResult || !executionResult.valid) return;
    if (currentStepIdx < 0 || currentStepIdx >= executionResult.steps.length) return;

    const timer = setTimeout(() => {
      if (currentStepIdx === executionResult.steps.length - 1) {
        // Finished all steps, move to final result details
        setPhase('result');
      } else {
        setCurrentStepIdx(prev => prev + 1);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [phase, executionResult, currentStepIdx]);

  // Compute animated coin counter for execution HUD display
  const currentCoins = React.useMemo(() => {
    if (phase === 'execution' && executionResult?.valid && currentStepIdx >= 0) {
      return executionResult.steps[currentStepIdx].coins;
    }
    return 20; // Default starting balance
  }, [phase, executionResult, currentStepIdx]);

  if (loading && phase === 'setup') {
    return <LoadingSpinner message="Connecting to transit servers..." />;
  }

  return (
    <Container className="py-4">
      {errorMsg && (
        <Alert variant="danger" onClose={() => setErrorMsg(null)} dismissible>
          {errorMsg}
        </Alert>
      )}

      {/* --- PHASE 1: SETUP --- */}
      {phase === 'setup' && (
        <div className="setup-view animated-fade">
          <Row className="mb-4 align-items-center">
            <Col>
              <h2 className="fw-bold font-monospace text-dark text-uppercase mb-1">Race Setup Map</h2>
              <p className="text-secondary mb-0">Study the metro map coordinates and connections. Click start when ready.</p>
            </Col>
            <Col className="text-end">
              <Button
                variant="success"
                onClick={handleStartRace}
                size="lg"
                className="fw-bold text-uppercase px-4 shadow"
              >
                Start Race 🏁
              </Button>
            </Col>
          </Row>

          <Row>
            <Col lg={12}>
              <NetworkMap
                stations={network.stations}
                lines={network.lines}
                showLines={true}
              />
            </Col>
          </Row>
        </div>
      )}

      {/* --- PHASE 2: PLANNING --- */}
      {phase === 'planning' && game && (
        <div className="planning-view animated-fade">
          {/* Header HUD with Countdown */}
          <Row className="mb-4 align-items-center">
            <Col>
              <h3 className="fw-bold font-monospace text-dark text-uppercase mb-0">Route Planning</h3>
              <div className="text-secondary small">
                Form a path from <strong className="text-success">{game.start.name}</strong> to <strong className="text-danger">{game.destination.name}</strong>.
              </div>
            </Col>
            <Col className="d-flex justify-content-end">
              <Countdown seconds={remainingSeconds} />
            </Col>
          </Row>

          {/* Three-pane Planning Layout */}
          <Row className="g-4">
            <Col lg={6}>
              {/* Map is in planning configuration: no lines drawn */}
              <NetworkMap
                stations={game.stations}
                showLines={false}
                startStation={game.start}
                destStation={game.destination}
                routeSegments={selectedSegments}
              />
            </Col>

            <Col lg={3}>
              <SegmentList
                segments={game.segments}
                selectedSegments={selectedSegments}
                onSelectSegment={handleSelectSegment}
                currentEndpointName={currentEndpointName}
              />
            </Col>

            <Col lg={3}>
              <RoutePanel
                segments={game.segments}
                selectedSegments={selectedSegments}
                startStation={game.start}
                destStation={game.destination}
                onUndo={handleUndo}
                onClear={handleClear}
                onSubmit={handleSubmitRoute}
                isSubmitting={loading}
              />
            </Col>
          </Row>
        </div>
      )}

      {/* --- PHASE 3: EXECUTION --- */}
      {phase === 'execution' && executionResult && (
        <div className="execution-view animated-fade d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
          <Card style={{ width: '650px' }} className="shadow-lg border-0">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <span className="fs-1 animate-spin d-inline-block">🚇</span>
                <h3 className="fw-bold font-monospace text-uppercase text-dark mt-2">Transit in Progress</h3>
                <p className="text-muted">Simulating trip. Applying random route event factors...</p>
              </div>

              {/* Coins status hud */}
              <div className="d-flex justify-content-center align-items-center mb-4">
                <div
                  className="px-4 py-3 rounded border text-center shadow-sm"
                  style={{
                    backgroundColor: currentCoins < 0 ? '#fce8e6' : '#e6f4ea',
                    minWidth: '220px',
                    borderColor: currentCoins < 0 ? '#f5c2c7' : '#badbcc'
                  }}
                >
                  <div className="text-muted small uppercase fw-bold font-monospace" style={{ fontSize: '11px' }}>Current Coins</div>
                  <div className={`fs-1 fw-bold ${currentCoins < 0 ? 'text-danger' : 'text-success'}`}>
                    {currentCoins}
                  </div>
                </div>
              </div>

              {/* Steps progression bar */}
              <div className="mb-4">
                <div className="d-flex justify-content-between text-muted small mb-1 font-monospace">
                  <span>Journey Progress</span>
                  <span>
                    Step {currentStepIdx + 1} of {executionResult.steps.length}
                  </span>
                </div>
                <ProgressBar
                  now={((currentStepIdx + 1) / executionResult.steps.length) * 100}
                  variant="success"
                  className="rounded-pill"
                  style={{ height: '8px' }}
                />
              </div>

              {/* Steps Details */}
              <div className="border rounded bg-light p-3" style={{ minHeight: '120px' }}>
                {currentStepIdx >= 0 && executionResult.steps[currentStepIdx] ? (
                  <div className="animated-slide text-center">
                    <div className="d-flex justify-content-center align-items-center gap-2 mb-2 font-monospace">
                      <Badge bg="success" className="px-2 py-1">
                        {executionResult.steps[currentStepIdx].from.name}
                      </Badge>
                      <span className="text-secondary fw-bold">➔</span>
                      <Badge bg="info" className="px-2 py-1">
                        {executionResult.steps[currentStepIdx].to.name}
                      </Badge>
                    </div>

                    <h5 className="fw-bold text-dark mt-3 mb-1">
                      "{executionResult.steps[currentStepIdx].event.description}"
                    </h5>

                    <div className="mt-2">
                      <Badge
                        bg={executionResult.steps[currentStepIdx].event.effect >= 0 ? 'success' : 'danger'}
                        className="py-1 px-3 fs-6"
                      >
                        {executionResult.steps[currentStepIdx].event.effect >= 0 ? '+' : ''}
                        {executionResult.steps[currentStepIdx].event.effect} coins
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted my-3">Initializing engine...</div>
                )}
              </div>
            </Card.Body>
          </Card>
        </div>
      )}

      {/* --- PHASE 4: RESULT --- */}
      {phase === 'result' && executionResult && (
        <div className="result-view animated-fade d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
          <Card style={{ width: '550px' }} className="shadow-lg border-0 text-center">
            <Card.Body className="p-5">
              {executionResult.valid ? (
                <>
                  <span style={{ fontSize: '64px' }}>🏆</span>
                  <h2 className="fw-bold font-monospace text-success text-uppercase mt-3 mb-2">Race Complete!</h2>
                  <p className="lead text-secondary">
                    You arrived at the destination with <strong className="text-dark">{executionResult.finalScore}</strong> coins remaining.
                  </p>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '64px' }}>💥</span>
                  <h2 className="fw-bold font-monospace text-danger text-uppercase mt-3 mb-2">Race Failed!</h2>
                  <p className="lead text-secondary">
                    Your route was invalid or incomplete.
                  </p>
                  <Alert variant="warning" className="small py-2 px-3 text-start mx-auto mb-4" style={{ maxWidth: '400px' }}>
                    <strong>Reason:</strong> {executionResult.reason || 'Incorrect path planning'}
                  </Alert>
                </>
              )}

              {/* Big Score HUD */}
              <div className="my-4 p-4 border rounded bg-light mx-auto" style={{ maxWidth: '280px' }}>
                <div className="text-secondary small uppercase fw-bold font-monospace" style={{ fontSize: '11px', letterSpacing: '1px' }}>Final Score</div>
                <div className={`display-3 fw-bold ${executionResult.valid ? 'text-primary' : 'text-danger'}`}>
                  {executionResult.finalScore}
                </div>
                <div className="text-muted small font-monospace mt-1">coins</div>
              </div>

              {/* Buttons Panel */}
              <div className="d-flex gap-3 justify-content-center mt-4">
                <Button
                  variant="primary"
                  onClick={handleStartRace}
                  className="fw-bold px-4 py-2 text-uppercase"
                >
                  Play Again 🔄
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={() => navigate('/ranking')}
                  className="fw-bold px-4 py-2 text-uppercase"
                >
                  View Leaderboard 📊
                </Button>
              </div>
            </Card.Body>
          </Card>
        </div>
      )}
    </Container>
  );
}
