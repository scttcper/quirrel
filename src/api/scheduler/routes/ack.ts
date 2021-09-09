import { FastifyPluginCallback } from "fastify";
import AckBodySchema from "../schemas/ack-body.json";
import { AckBody } from "../types/ack-body";

const ack: FastifyPluginCallback = (fastify, opts, done) => {
  const jobsRepo = fastify.jobs;

  fastify.addHook("preValidation", fastify.tokenAuthPreValidation);

  const baseSchema = {
    tags: ["Acknowledgement"],
    security: fastify.adminBasedAuthEnabled
      ? [
          {
            Admin: [],
            Impersonation: [],
          },
        ]
      : undefined,
  };

  fastify.post<{ Body: AckBody }>(
    "/",
    {
      schema: {
        ...baseSchema,
        body: AckBodySchema,
        summary: "Acknowledge a jobs execution",
      },
    },
    async (request, reply) => {
      const { acknowledgementDescriptor, fail } = request.body;
      const error = await jobsRepo.acknowledge(
        request.tokenId,
        acknowledgementDescriptor,
        fail
      );
      switch (error) {
        case "descriptor_false":
          return reply.status(400).send("descriptor invalid");
        default:
          return reply.status(200).send();
      }
    }
  );

  done();
};

export default ack;
