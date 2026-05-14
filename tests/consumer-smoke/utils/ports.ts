import { createServer } from 'node:net';
import { once } from 'node:events';

/**
 * Allocates an available port on localhost for generated consumer app servers.
 *
 * The caller should pass the returned port to the future app server command
 * instead of using framework defaults. As with all free-port probes, another
 * process can claim the port after release, so server startup must still handle
 * bind failures with a useful error.
 */
export async function allocateLocalhostPort(): Promise<number> {
  const server = createServer();

  server.listen(0, '127.0.0.1');
  await once(server, 'listening');

  const address = server.address();

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  if (!address || typeof address === 'string') {
    throw new Error('Unable to allocate a localhost port for the Formedible consumer smoke app.');
  }

  return address.port;
}
