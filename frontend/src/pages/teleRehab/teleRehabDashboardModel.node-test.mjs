/**
 * Tele-Rehab dashboard presentation.
 * Run: node frontend/src/pages/teleRehab/teleRehabDashboardModel.node-test.mjs
 */
import assert from 'node:assert/strict';
import {
  consultationHref,
  countText,
  dashboardViewState,
  metricText,
  sectionVisible,
} from './teleRehabDashboardModel.js';

assert.equal(dashboardViewState({ loading: true, error: null, data: null }), 'loading');
assert.equal(dashboardViewState({ loading: false, error: { status: 403, message: 'no' }, data: null }), 'denied');
assert.equal(dashboardViewState({ loading: false, error: { status: 401 }, data: null }), 'denied');
assert.equal(dashboardViewState({ loading: false, error: { status: 500, message: 'down' }, data: null }), 'error');
assert.equal(dashboardViewState({ loading: false, error: { code: 'ERR_NETWORK' }, data: null }), 'error');
assert.equal(dashboardViewState({ loading: false, error: null, data: null }), 'error');
assert.equal(dashboardViewState({ loading: false, error: null, data: { role: 'patient' } }), 'ready');

assert.equal(metricText(null), null);
assert.equal(metricText(undefined), null);
assert.equal(metricText(''), null);
assert.equal(metricText(0), '0');
assert.equal(metricText(88.456, 2), '88.46');
assert.equal(countText(null), null);
assert.equal(countText(0), '0');

assert.equal(consultationHref({ consultation: '/patient/consultation' }, 12), '/patient/consultation/12');
assert.equal(consultationHref({ consultation: null }, 12), null);
assert.equal(consultationHref({ consultation: '/admin/appointments' }, 0), null);

assert.equal(sectionVisible({ sessions: true, performance: false }, 'performance'), false);
assert.equal(sectionVisible({ sessions: true }, 'sessions'), true);
assert.equal(sectionVisible(null, 'sessions'), false);

const emptyPatient = {
  role: 'patient',
  counts: { upcoming_sessions: 0, recent_sessions: 0, assigned_exercises: 0, ai_sessions: 0 },
  upcoming_sessions: [],
  recent_sessions: [],
  exercises: [],
  session_history: [],
  progress: { ai: { average_score: null, average_accuracy: null, score_sample_count: 0 } },
};
assert.equal(emptyPatient.upcoming_sessions.length, 0);
assert.equal(metricText(emptyPatient.progress.ai.average_score), null);
assert.equal(countText(emptyPatient.counts.upcoming_sessions), '0');

console.log('teleRehabDashboardModel.node-test.mjs passed');
