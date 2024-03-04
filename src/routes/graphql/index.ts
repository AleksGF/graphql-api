import { graphql, validate, parse } from 'graphql';
import depthLimit from 'graphql-depth-limit';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { getLoaders } from './loaders/loaders.js';
import { createGqlResponseSchema, gqlResponseSchema, gqlSchema } from './schemas.js';

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { prisma } = fastify;

  fastify.route({
    url: '/',
    method: 'POST',
    schema: {
      ...createGqlResponseSchema,
      response: {
        200: gqlResponseSchema,
      },
    },
    async handler(req) {
      const { query, variables } = req.body;

      const queryDepthErrors = validate(gqlSchema, parse(query), [depthLimit(5)]);

      if (queryDepthErrors.length) return { errors: queryDepthErrors };

      const loaders = getLoaders(prisma);

      return await graphql({
        schema: gqlSchema,
        source: query,
        variableValues: variables,
        contextValue: { prisma, loaders },
      });
    },
  });
};

export default plugin;
