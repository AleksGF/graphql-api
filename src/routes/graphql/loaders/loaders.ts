import DataLoader from 'dataloader';
import { PrismaClient } from '@prisma/client';

export type Loaders = {
  user: DataLoader<string, unknown, string>;
  profileById: DataLoader<string, unknown, string>;
  postsByUserId: DataLoader<string, unknown, string>;
  memberTypeById: DataLoader<string, unknown, string>;
};

export const getLoaders = (prisma: PrismaClient): Loaders => {
  const loaders: Loaders = {
    user: new DataLoader<string, unknown>(async (ids) => {
      const users = await prisma.user.findMany({
        where: {
          id: {
            in: [...ids],
          },
        },
        include: {
          userSubscribedTo: true,
          subscribedToUser: true,
        },
      });

      const map = new Map(users.map((u) => [u.id, u]));

      return ids.map((id) => map.get(id));
    }),

    profileById: new DataLoader<string, unknown>(async (ids) => {
      const profiles = await prisma.profile.findMany({
        where: {
          userId: {
            in: [...ids],
          },
        },
      });

      const profilesMap = new Map(
        ids.map((userId) => [userId, profiles.find((p) => p.userId === userId) ?? null]),
      );

      return ids.map((id) => profilesMap.get(id));
    }),

    postsByUserId: new DataLoader<string, unknown>(async (ids) => {
      const posts = await prisma.post.findMany({
        where: {
          authorId: {
            in: [...ids],
          },
        },
      });

      const postsMap = new Map(
        ids.map((userId) => [userId, posts.filter((p) => p.authorId === userId)]),
      );

      return ids.map((id) => postsMap.get(id));
    }),

    memberTypeById: new DataLoader<string, unknown>(async (ids) => {
      const results = await prisma.memberType.findMany({
        where: {
          id: {
            in: [...ids],
          },
        },
      });

      const map = new Map(results.map((r) => [r.id, r]));

      return ids.map((id) => map.get(id));
    }),
  };

  return loaders;
};
