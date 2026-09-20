export const MCP_ENDPOINT = 'https://mcp.opencaselaw.ch/mcp';
export const MCP_PROTOCOL = '2025-03-26';
type RecordValue = Record<string, unknown>;
function record(value: unknown): RecordValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid public response');
  return value as RecordValue;
}

// Only the expected response is accepted. Server instructions, tool descriptions,
// Markdown and unrelated notifications never enter the model or rendered guidance.
export function parseRpc(body: string, contentType: string, id: number): RecordValue {
  const messages = contentType.includes('text/event-stream')
    ? body.replace(/\r\n/g, '\n').split('\n\n').filter(frame => frame.split('\n').some(line => line.startsWith('data:'))).map(frame => JSON.parse(frame.split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5).replace(/^ /, '')).join('\n')))
    : contentType.includes('application/json') ? [JSON.parse(body)] : [];
  const matches = messages.filter(message => message?.jsonrpc === '2.0' && message.id === id);
  if (matches.length !== 1 || matches[0].error) throw new Error('Public MCP request failed');
  const result = record(matches[0].result);
  if (result.isError) throw new Error('Public source unavailable');
  return result;
}
