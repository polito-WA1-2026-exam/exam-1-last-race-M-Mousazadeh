import React from 'react';
import { Container, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <Container className="text-center py-5 d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
      <span style={{ fontSize: '72px' }}>🚧</span>
      <h1 className="display-4 fw-bold font-monospace mt-3">404 - Page Not Found</h1>
      <p className="lead text-secondary mt-2">The section of the transit network you requested does not exist.</p>
      <Button as={Link} to="/" variant="primary" className="mt-4 px-4 py-2 fw-semibold">
        Return to Station Home
      </Button>
    </Container>
  );
}
