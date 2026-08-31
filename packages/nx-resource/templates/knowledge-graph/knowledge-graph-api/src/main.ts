// GitHub Copilot generated code - start
import { createApp } from './app';

const port = Number.parseInt(process.env.PORT ?? '3000', 10);
const host = process.env.HOST ?? '0.0.0.0';

const app = createApp();
app.listen(port, host, () => {
  console.log(`Server listening on http://${host}:${port}`);
});
// GitHub Copilot generated code - end
