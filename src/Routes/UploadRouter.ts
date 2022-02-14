import fastifyMulter from 'fastify-multer';
import type {FastifyInstance} from 'fastify';
import {formatEmbed} from '../Utility/Embeds';
import {File} from 'fastify-multer/lib/interfaces';
import {generateRandomString} from '../Utility/Misc';
import {s3Info, uploadFile} from '../Utility/Storage';
import {verifyUser, verifyFile} from '../Middlewares/UploadMiddlewares';

const multer = fastifyMulter({
  storage: fastifyMulter.memoryStorage(),
  limits: {
    fileSize: 100 * 1000 * 1000,
  },
});

interface verifiedFile extends File {
  size: number;
  buffer: Buffer;
}

export default async function UploadRouter(fastify: FastifyInstance) {
  const {prisma, redis} = fastify;

  fastify.post(
      '/sharex',
      {preHandler: [verifyUser, multer.single('file'), verifyFile]},
      async (request, reply) => {
        const {
          file: reqFile,
          user,
          headers: {authorization},
        } = request as {
            file: verifiedFile;
            user: PassportUser;
            headers: { authorization: string };
        };

        const fileName =
        generateRandomString(10) + '.' + reqFile.mimetype.split('/')[1];

        const fileData = {
          fileName,
          cdnName: fileName,
          mimeType: reqFile.mimetype,
          size: reqFile.size,
          path: '/',
          domain:
          reqFile.mimetype.split('/')[0] === 'image' ?
            'kythi.pics' :
            'kythi.media',
          uploadedAt: new Date(),
          uploaderId: user.id,
        };

        const file = await prisma.file.create({
          data: {
            ...fileData,
            embed: {
              create: {
                ...formatEmbed(
                    user.embeds.map((e: { id?: string; userId?: string }) => {
                      delete e.id;
                      delete e.userId;
                      return e;
                    })[Math.floor(Math.random() * user.embeds.length)],
                    fileData,
                    user
                ),
              },
            },
          },
        });

        await prisma.uploadSettings.update({
          where: {key: authorization},
          data: {count: {increment: 1}},
        });

        uploadFile(file, reqFile.buffer);

        const data = {
          imageURL: `https://${file.domain}${file.path}${file.fileName}`,
          cdnURL: `https://${s3Info.endpoint}/${process.env.S3_BUCKET}/${user.id}/${file.fileName}`,
        };

        redis.set(`recentupload-${user.id}`, JSON.stringify(data), {
          EX: 60 * 60 * 24,
        });

        reply.send(data);
      }
  );
}

export const autoPrefix = '/upload';
