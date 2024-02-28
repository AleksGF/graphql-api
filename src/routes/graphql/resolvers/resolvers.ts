import { HttpErrors } from '@fastify/sensible';
import { Prisma, PrismaClient } from '@prisma/client';
import { DefaultArgs } from '@prisma/client/runtime/library.js';

type Context = {
  prisma: PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>;
  httpErrors: HttpErrors;
};

type IdArgs = {
  id: string;
};

export const usersResolver = async (context) => {
  const { prisma } = context as Context;

  return await prisma.user.findMany();
};

export const userByIdResolver = async (args, context) => {
  const { id } = args as IdArgs;
  const { prisma, httpErrors } = context as Context;

  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (user === null) {
    throw httpErrors.notFound();
  }

  return user;
};

export const postsResolver = async (_parent, _args, context, _info) => {
  const { prisma } = context as {
    prisma: PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>;
  };

  return await prisma.post.findMany();
};

export const postByIdResolver = async (args, context) => {
  const { id } = args as IdArgs;
  const { prisma, httpErrors } = context as Context;

  const post = await prisma.post.findUnique({
    where: { id },
  });

  if (post === null) {
    throw httpErrors.notFound();
  }

  return post;
};

export const memberTypesResolver = async (_parent, _args, context, _info) => {
  const { prisma } = context as {
    prisma: PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>;
  };

  return await prisma.memberType.findMany();
};

export const memberTypeByIdResolver = async (args, context) => {
  const { id } = args as IdArgs;
  const { prisma, httpErrors } = context as Context;

  const memberType = await prisma.memberType.findUnique({
    where: { id },
  });

  if (memberType === null) {
    throw httpErrors.notFound();
  }

  return memberType;
};

export const profilesResolver = async (_parent, _args, context, _info) => {
  const { prisma } = context as {
    prisma: PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>;
  };

  return await prisma.profile.findMany();
};

export const profileByIdResolver = async (args, context) => {
  const { id } = args as IdArgs;
  const { prisma, httpErrors } = context as Context;

  const profile = await prisma.profile.findUnique({
    where: { id },
  });

  if (profile === null) {
    throw httpErrors.notFound();
  }

  return profile;
};
