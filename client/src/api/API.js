'use strict';

const BASE = 'http://localhost:3001/api';

/**
 * Handle HTTP response and throw errors for non-2xx status codes.
 */
async function handleResponse(res) {
  if (res.status === 204) {
    return null;
  }
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${res.status}`);
  }
  return res.json();
}

/**
 * Log in a user
 */
async function login(username, password) {
  const res = await fetch(`${BASE}/sessions`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return handleResponse(res);
}

/**
 * Retrieve current user session if it exists
 */
async function getCurrentUser() {
  const res = await fetch(`${BASE}/sessions/current`, {
    method: 'GET',
    credentials: 'include'
  });
  return handleResponse(res);
}

/**
 * Terminate the current user session
 */
async function logout() {
  const res = await fetch(`${BASE}/sessions/current`, {
    method: 'DELETE',
    credentials: 'include'
  });
  return handleResponse(res);
}

/**
 * Fetch full network stations and line data (Setup phase)
 */
async function getNetwork() {
  const res = await fetch(`${BASE}/network`, {
    method: 'GET',
    credentials: 'include'
  });
  return handleResponse(res);
}

/**
 * Start a new game and enter Planning phase
 */
async function startGame() {
  const res = await fetch(`${BASE}/games`, {
    method: 'POST',
    credentials: 'include'
  });
  return handleResponse(res);
}

/**
 * Submit the built route for validation and execution
 */
async function submitRoute(gameId, segments) {
  const res = await fetch(`${BASE}/games/${gameId}/route`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ segments })
  });
  return handleResponse(res);
}

/**
 * Retrieve global rankings
 */
async function getRanking() {
  const res = await fetch(`${BASE}/ranking`, {
    method: 'GET',
    credentials: 'include'
  });
  return handleResponse(res);
}

const API = {
  login,
  getCurrentUser,
  logout,
  getNetwork,
  startGame,
  submitRoute,
  getRanking
};

export default API;
