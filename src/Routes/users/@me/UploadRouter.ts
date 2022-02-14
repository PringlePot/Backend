import type {FastifyInstance} from 'fastify';

export default async function TestimonialRouter(fastify: FastifyInstance) {
  const {redis} = fastify;

  fastify.get('/recent', async (request, reply) => {
    const {user} = request;

    if (!user) {
      return reply.status(401).send({
        statusCode: 401,
        message: 'You must be logged in to access this endpoint.',
      });
    }

    const recentUpload = await redis.get(`recentupload-${user.id}`);

    if (!recentUpload) {
      return reply.status(400).send({
        statusCode: 400,
        message: 'You have no recent uploads.',
      });
    }

    reply.send(JSON.parse(recentUpload));
  });
}

export const autoPrefix = '/users/@me/uploads';
