import {FastifySchema} from "fastify";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: string;
      MONGO_URI: string;
      DOCKER_STARTUP_WEBHOOK_URL: string;
      NODE_ENV: 'development' | 'production';
    }
  }
  
}

declare module 'fastify' {
  interface FastifySchema extends FastifySchema {
    validate?: (any) => any;
  }
}