import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user, login } = useAuth();
  const navigate = useNavigate();

  // Redirect to home if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    // Basic frontend validations
    if (!username.trim() || !password) {
      setErrorMsg('Please fill in all credentials fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(username.trim(), password);
      // Auth success, route transitions are handled by the redirect hook
      navigate('/');
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <Card style={{ width: '420px' }} className="shadow-lg border-0">
        <Card.Body className="p-4">
          <div className="text-center mb-4">
            <span style={{ fontSize: '48px' }}>🚇</span>
            <h3 className="mt-2 fw-bold text-uppercase text-dark font-monospace">Sign In</h3>
            <p className="text-muted small">Enter your credentials to play the Last Race</p>
          </div>

          {errorMsg && (
            <Alert variant="danger" onClose={() => setErrorMsg(null)} dismissible>
              {errorMsg}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formUsername">
              <Form.Label className="small fw-semibold text-secondary">Username (email or handle)</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. mohammadreza"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSubmitting}
                className="py-2"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formPassword">
              <Form.Label className="small fw-semibold text-secondary">Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                className="py-2"
                required
              />
            </Form.Group>

            <Button
              variant="primary"
              type="submit"
              className="w-100 py-2 fw-bold text-uppercase mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In'}
            </Button>
          </Form>

          <div className="mt-4 text-center border-top pt-3 text-muted small">
            <div>Sample Credentials:</div>
            <div className="font-monospace mt-1">mohammadreza / 123456</div>
            <div className="font-monospace">marco / pwd-marco-456</div>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}
