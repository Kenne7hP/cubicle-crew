import { createHash } from 'node:crypto';
export const EVENTS = ['SessionStart', 'TurnStarted', 'PreToolUse', 'PostToolUse', 'PostToolUseFailure',
  'PermissionRequest', 'PermissionResult', 'Stop', 'StopFailure', 'Interrupt', 'SessionEnd', 'SessionHeartbeat'];
const hash = value => createHash('sha256').update(String(value)).digest('hex').slice(0, 32);
const types = { SessionStart: 'start', TurnStarted: 'turn_start', PreToolUse: 'tool_start',
  PostToolUse: 'tool_end', PostToolUseFailure: 'tool_failure', PermissionRequest: 'waiting',
  PermissionResult: 'permission_resolved', Stop: 'turn_complete', StopFailure: 'turn_failed',
  Interrupt: 'turn_interrupted', SessionEnd: 'end', SessionHeartbeat: 'heartbeat' };
const tools = { read: 'Read', readfile: 'Read', read_file: 'Read', write: 'Write', writefile: 'Write', write_file: 'Write',
  edit: 'Edit', editfile: 'Edit', edit_file: 'Edit', strreplacefile: 'Edit', apply_patch: 'Edit',
  bash: 'Bash', shell: 'Bash', grep: 'Grep', glob: 'Glob', search: 'Grep',
  websearch: 'WebSearch', web_search: 'WebSearch', webfetch: 'WebFetch', web_fetch: 'WebFetch',
  askuserquestion: 'AskUserQuestion', task: 'Task', agent: 'Agent' };
export function normalizeHook(raw) {
  if (!raw || !types[raw.hook_event_name] || typeof raw.session_id !== 'string' || !raw.session_id) return null;
  const e = { agent: hash(raw.session_id), provider: 'kimi', type: types[raw.hook_event_name],
    label: typeof raw.cwd === 'string' ? raw.cwd.split(/[\\/]+/).filter(Boolean).pop()?.slice(0, 60) : 'kimi' };
  if (raw.turn_id != null) e.turn_id = hash(raw.turn_id);
  const id = raw.tool_call_id ?? raw.tool_use_id;
  if (typeof id === 'string' && id) e.id = hash(id);
  if (e.type.startsWith('tool_')) {
    // Unknown names may embed private information; use a generic label, not the raw name.
    e.tool = tools[String(raw.tool_name || '').toLowerCase()] || 'Tool';
    const cmd = raw.tool_input?.command;
    e.testing = e.tool === 'Bash' && typeof cmd === 'string' && /^(?:(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?test(?::[\w-]+)?|pytest|vitest|jest|python3?\s+-m\s+pytest|(?:cargo|go|dotnet)\s+test)(?:\s|$)/i.test(cmd.trim());
  }
  if (e.type === 'waiting') e.reason = 'permission';
  if (raw.hook_event_name === 'Stop') e.confidence = 'inferred'; // Stop may be blocked by another hook.
  return e;
}
