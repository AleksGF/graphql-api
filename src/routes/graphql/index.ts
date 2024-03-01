import { graphql, validate, parse } from 'graphql';
import depthLimit from 'graphql-depth-limit';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema, gqlSchema } from './schemas.js';

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { prisma, httpErrors } = fastify;

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

      return queryDepthErrors.length
        ? { errors: queryDepthErrors }
        : await graphql({
            schema: gqlSchema,
            source: query,
            variableValues: variables,
            contextValue: { prisma, httpErrors },
          });
    },
  });
};

export default plugin;
