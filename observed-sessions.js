// Small state tracker shared by the two observed providers. No Agent control.
const MAX_SESSIONS = 40, MAX_IDS = 512;
const cap = (set) => { while (set.size > MAX_IDS) set.delete(set.keys().next().value); };
export class ObservedSessions {
  constructor({ emit = () => {}, changed = () => {}, now = Date.now } = {}) {
    this.emit = emit; this.changed = changed; this.now = now; this.agents = new Map();
  }
  ingest(e, { silent = false, restored = false, at = this.now() } = {}) {
    if (!e?.agent) return;
    let x = this.agents.get(e.agent);
    if (!x) {
      if (e.type === 'end') return;
      if (this.agents.size >= MAX_SESSIONS) this.agents.delete(this.agents.keys().next().value);
      x = { agent: e.agent, label: e.label || e.provider, provider: e.provider,
        turnOpen: false, turnId: '', waiting: false, known: false, open: new Map(),
        finished: new Set(), finishedTurns: new Set(), last: at, restored, subagent: !!e.subagent, parent: e.parent };
      this.agents.set(e.agent, x);
    }
    const send = (event) => { if (!silent) this.emit({ agent: x.agent, label: x.label, provider: x.provider,
      subagent: x.subagent, ...(x.parent ? { parent: x.parent } : {}), ts: this.now(), ...event }); };
    const close = () => { for (const id of x.open.keys()) { send({ type: 'tool_end', tool_use_id: id }); x.finished.add(id); } x.open.clear(); cap(x.finished); };
    if (e.label) x.label = e.label;
    x.last = at;
    if (!restored) x.restored = false;
    // Do not resurrect completed turns when parallel hooks arrive out of order.
    if (e.turn_id && x.finishedTurns.has(e.turn_id) && !['heartbeat', 'end'].includes(e.type)) return;
    if (e.turn_id && x.turnId && e.turn_id !== x.turnId && !['turn_start', 'user_prompt', 'heartbeat', 'end'].includes(e.type)) return;
    switch (e.type) {
      case 'presence': case 'start': case 'heartbeat': break; // online, not proof of thinking
      case 'turn_start': case 'user_prompt':
        if (e.type === 'turn_start' && e.turn_id && x.turnId === e.turn_id && x.turnOpen) return;
        if (e.type === 'user_prompt' || (e.turn_id && x.turnId !== e.turn_id)) close();
        x.turnId = e.turn_id || x.turnId; x.turnOpen = true; x.known = true; x.waiting = false;
        send({ type: 'turn_start', turn_id: e.turn_id }); break;
      case 'tool_start': {
        if (!e.id || x.finished.has(e.id) || x.open.has(e.id)) return;
        if (x.open.size >= MAX_IDS) { close(); x.known = false; }
        x.turnOpen = true; x.known = true;
        const tool = { id: e.id, tool: e.tool || 'Tool', testing: !!e.testing, confidence: e.testing ? 'inferred' : 'observed' };
        x.open.set(e.id, tool); send({ type: 'tool_start', ...tool, detail: '' }); break;
      }
      case 'tool_end': case 'tool_failure': {
        const id = e.tool_use_id || e.id;
        if (!id || x.finished.has(id)) return;
        x.finished.add(id); cap(x.finished); x.open.delete(id);
        send({ type: 'tool_end', tool_use_id: id });
        if (e.type === 'tool_failure') send({ type: 'outcome', outcome: 'error', scope: 'tool', confidence: 'observed' });
        break;
      }
      case 'waiting':
        x.waiting = true; x.known = true; send({ type: 'waiting', reason: e.reason || 'permission' }); break;
      case 'permission_resolved':
        x.waiting = false; send({ type: 'permission_resolved' }); break;
      case 'turn_complete': case 'turn_failed': case 'turn_interrupted': case 'idle': {
        const hadWork = x.turnOpen || x.open.size > 0 || x.waiting;
        close(); x.turnOpen = false; x.waiting = false; x.known = true;
        if (e.turn_id || x.turnId) x.finishedTurns.add(e.turn_id || x.turnId); cap(x.finishedTurns);
        send({ type: e.type, confidence: e.confidence || 'observed' });
        if (hadWork && ['turn_complete', 'turn_failed'].includes(e.type)) send({ type: 'outcome',
          outcome: e.type === 'turn_failed' ? 'error' : 'success', scope: 'turn', confidence: e.confidence || 'observed' });
        break;
      }
      case 'end': close(); send({ type: 'session_end' }); this.agents.delete(e.agent); break;
      default: if (!silent) send(e); break;
    }
    if (!silent) this.changed();
  }
  list(now = this.now()) {
    const out = [];
    for (const [id, x] of this.agents) {
      const age = now - x.last;
      const staleAt = x.provider === 'kimi' ? 185_000 : 10 * 60_000;
      const dropAt = x.provider === 'kimi' ? 300_000 : 60 * 60_000;
      if (age > dropAt) { this.agents.delete(id); continue; }
      const uncertain = age > staleAt || !x.known || x.restored;
      out.push({ agent: x.agent, label: x.label, provider: x.provider,
        status: uncertain ? 'unknown' : x.waiting ? 'waiting' : x.turnOpen || x.open.size ? 'busy' : 'idle',
        waitingFor: x.waiting && !uncertain ? 'permission prompt' : undefined,
        confidence: uncertain ? 'unknown' : 'observed', restored: x.restored,
        tools: uncertain ? [] : [...x.open.values()] });
    }
    return out;
  }
}
