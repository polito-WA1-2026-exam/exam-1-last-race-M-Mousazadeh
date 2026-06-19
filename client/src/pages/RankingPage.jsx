import React, { useState, useEffect } from 'react';
import { Container, Table, Alert, Card, Badge } from 'react-bootstrap';
import API from '../api/API';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function RankingPage() {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  
  const { user } = useAuth();

  useEffect(() => {
    async function loadRankings() {
      try {
        const data = await API.getRanking();
        setRankings(data);
      } catch (err) {
        setErrorMsg(err.message || 'Failed to load leaderboard rankings.');
      } finally {
        setLoading(false);
      }
    }
    loadRankings();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Retrieving leaderboard..." />;
  }

  return (
    <Container className="py-4">
      <div className="text-center mb-4">
        <span style={{ fontSize: '48px' }}>🏆</span>
        <h2 className="fw-bold font-monospace text-uppercase text-dark mt-2">Global Leaderboard</h2>
        <p className="text-muted">Best score of all players who completed the race</p>
      </div>

      {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}

      <Card className="shadow border-0">
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0 align-middle">
            <thead className="table-dark">
              <tr>
                <th className="py-3 px-4 font-monospace small uppercase" style={{ width: '80px' }}>Rank</th>
                <th className="py-3 px-3 font-monospace small uppercase">Player Name</th>
                <th className="py-3 px-3 font-monospace small uppercase">Username</th>
                <th className="py-3 px-4 text-end font-monospace small uppercase" style={{ width: '150px' }}>Best Score</th>
              </tr>
            </thead>
            <tbody>
              {rankings.length > 0 ? (
                rankings.map((entry, index) => {
                  const isCurrentUser = user && user.username === entry.username;
                  
                  return (
                    <tr
                      key={entry.username}
                      className={isCurrentUser ? "table-info" : ""}
                      style={{
                        fontWeight: isCurrentUser ? 'bold' : 'normal',
                        transition: 'background-color 0.2s ease'
                      }}
                    >
                      {/* Rank Position */}
                      <td className="py-3 px-4 font-monospace">
                        {index + 1 === 1 ? '🥇' : index + 1 === 2 ? '🥈' : index + 1 === 3 ? '🥉' : `#${index + 1}`}
                      </td>
                      
                      {/* Name */}
                      <td className="py-3 px-3">
                        {entry.name} {isCurrentUser && <Badge bg="primary" className="ms-2">You</Badge>}
                      </td>
                      
                      {/* Username */}
                      <td className="py-3 px-3 text-muted small font-monospace">
                        @{entry.username}
                      </td>
                      
                      {/* Score */}
                      <td className="py-3 px-4 text-end font-monospace fw-bold fs-5 text-primary">
                        {entry.bestScore} <span className="small text-muted fw-normal" style={{ fontSize: '11px' }}>coins</span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="text-center text-muted py-5">
                    No games completed yet. Be the first to start the race and make the scoreboard!
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
}
