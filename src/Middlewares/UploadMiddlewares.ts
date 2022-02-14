import {FastifyRequest, FastifyReply} from 'fastify';

export async function verifyUser(request: FastifyRequest, reply: FastifyReply) {
  const {
    headers: {authorization},
    server: {prisma},
  } = request;

  if (!authorization) {
    return reply
        .status(401)
        .send({statusCode: 401, message: 'No upload key provided'});
  }

  const user = await prisma.user.findFirst({
    where: {uploadKey: authorization},
    include: {embeds: true, upload: true},
  }) as PassportUser;

  if (!user) {
    return reply
        .status(401)
        .send({statusCode: 401, message: 'Invalid upload key'});
  }

  request.user = user;
  return;
}

export async function verifyFile(request: FastifyRequest, reply: FastifyReply) {
  if (!request.file) {
    return reply
        .status(401)
        .send({statusCode: 401, message: 'No file provided'});
  }

  if (!request.file.mimetype || !request.file.size || !request.file.buffer) {
    return reply.status(401).send({statusCode: 401, message: 'Invalid File'});
  }

  if (
    !request.file.mimetype.match(/(image|video)\/(png|jpeg|gif|mp4|mov|webm)/i)
  ) {
    return reply.status(401).send({statusCode: 401, message: 'Invalid File Type'});
  }

  return;
}
