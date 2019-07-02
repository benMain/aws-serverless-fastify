import { Server } from 'http';

export class FastifyServerContainer {
  server: Server;
  binaryTypes: string[];
  socketSuffix: string;
}
