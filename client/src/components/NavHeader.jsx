import React from 'react';
import { Navbar, Container, Nav, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function NavHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout failed:', err.message);
    }
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="shadow mb-4 py-3">
      <Container>
        {/* App Logo & Title */}
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center gap-2 fw-bold text-uppercase fs-4 font-monospace">
          <span style={{ fontSize: '26px' }}>🚇</span> Last Race
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto align-items-center gap-3">
            <Nav.Link as={Link} to="/" className="fw-semibold">
              Home & Instructions
            </Nav.Link>

            {user && (
              <>
                <Nav.Link as={Link} to="/play" className="fw-semibold">
                  Start Race
                </Nav.Link>
                <Nav.Link as={Link} to="/ranking" className="fw-semibold">
                  Leaderboard
                </Nav.Link>
              </>
            )}
          </Nav>

          {/* User Session Profile HUD */}
          <Nav className="align-items-center gap-3">
            {user ? (
              <div className="d-flex align-items-center gap-3">
                <span className="text-light">
                  Welcome, <strong className="text-info">{user.name}</strong>!
                </span>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={handleLogout}
                  className="fw-semibold px-3"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Button
                variant="outline-info"
                size="sm"
                as={Link}
                to="/login"
                className="fw-semibold px-3"
              >
                Login to Play
              </Button>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
