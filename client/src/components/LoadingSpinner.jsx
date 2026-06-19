import React from 'react';
import { Spinner, Container } from 'react-bootstrap';

export default function LoadingSpinner({ message = 'Loading game network...' }) {
  return (
    <Container className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '300px' }}>
      <Spinner animation="border" variant="primary" role="status" style={{ width: '3rem', height: '3rem' }}>
        <span className="visually-hidden">Loading...</span>
      </Spinner>
      <p className="mt-3 text-muted fw-semibold font-monospace">{message}</p>
    </Container>
  );
}
