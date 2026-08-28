import axios from 'axios';

// GitHub Copilot generated code - start
describe('GET /ping', () => {
  it('should return a health payload', async () => {
    const res = await axios.get('/ping');

    expect(res.status).toBe(200);
    expect(res.data.status).toBe('ok');
    expect(typeof res.data.checkedAt).toBe('string');
    expect(Number.isInteger(res.data.uptimeSeconds)).toBe(true);
  });
});
// GitHub Copilot generated code - end
