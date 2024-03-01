import DataLoader from 'dataloader';
import { Prisma, PrismaClient } from '@prisma/client';
import { DefaultArgs } from '@prisma/client/runtime/library.js';
import {
  parseResolveInfo,
  ResolveTree,
  simplifyParsedResolveInfoFragmentWithType,
} from 'graphql-parse-resolve-info';
import { GraphQLResolveInfo } from 'graphql/type/index.js';

type Prisma = PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>;

type Context = {
  prisma: Prisma;
};

type IdArgs = {
  id: string;
};

type MemberTypes = {
  id: string;
  discount: number;
  postsLimitPerMonth: number;
};

type Profile = {
  id: string;
  isMale: boolean;
  yearOfBirth: number;
  memberType: MemberTypes;
} | null;

type Post = {
  id: string;
  title: string;
  content: string;
  authorId: string;
};

type User = {
  id: string;
  name: string;
  balance: number;
  posts: Post[];
  profile: Profile;
  userSubscribedTo: ({ authorId: string } | User)[];
  subscribedToUser: ({ subscriberId: string } | User)[];
};

type UserRequestFields = {
  fieldsByTypeName: {
    User: {
      userSubscribedTo?: UserRequestFields[];
      subscribedToUser?: UserRequestFields[];
    };
  };
};

export enum ResolverActions {
  GET_ALL_USERS = 'getAllUsers',
  GET_USER_BY_ID = 'getUserById',
  GET_ALL_POSTS = 'getAllPosts',
  GET_POST_BY_ID = 'getPostById',
  GET_ALL_PROFILES = 'getAllProfiles',
  GET_PROFILE_BY_ID = 'getProfileById',
  GET_ALL_MEMBER_TYPES = 'getAllMemberTypes',
  GET_MEMBER_TYPE_BY_ID = 'getMemberTypeById',
}

const getUserInclude = () => ({
  posts: true,
  profile: {
    include: {
      memberType: true,
    },
  },
  userSubscribedTo: {
    select: {
      authorId: true,
    },
    where: {
      subscriberId: { not: undefined },
    },
  },
  subscribedToUser: {
    select: {
      subscriberId: true,
    },
    where: {
      authorId: { not: undefined },
    },
  },
});

let userDataLoader: DataLoader<string, unknown>;
let postDataLoader: DataLoader<string, unknown>;
let profileDataLoader: DataLoader<string, unknown>;

const getUserDataLoader = (prisma: Prisma) =>
  new DataLoader<string, unknown>(async (ids) => {
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: [...ids],
        },
      },
      include: getUserInclude(),
    });

    const usersMap = new Map(users.map((user) => [user.id, user]));
    return ids.map((id) => usersMap.get(id) ?? null);
  });

const getPostDataLoader = (prisma: Prisma) =>
  new DataLoader<string, unknown>(async (ids) => {
    const posts = await prisma.post.findMany({
      where: {
        id: {
          in: [...ids],
        },
      },
    });

    const postsMap = new Map(posts.map((post) => [post.id, post]));
    return ids.map((id) => postsMap.get(id) ?? null);
  });

const getProfileDataLoader = (prisma: Prisma) =>
  new DataLoader<string, unknown>(async (ids) => {
    const profiles = await prisma.profile.findMany({
      where: {
        id: {
          in: [...ids],
        },
      },
    });

    const profilesMap = new Map(profiles.map((profile) => [profile.id, profile]));
    return ids.map((id) => profilesMap.get(id) ?? null);
  });

const checkAreSubsNeeded = (requestInfo: unknown): requestInfo is UserRequestFields =>
  !!requestInfo &&
  typeof requestInfo === 'object' &&
  'fieldsByTypeName' in requestInfo &&
  !!requestInfo.fieldsByTypeName &&
  typeof requestInfo.fieldsByTypeName === 'object' &&
  'User' in requestInfo.fieldsByTypeName &&
  !!requestInfo.fieldsByTypeName.User &&
  typeof requestInfo.fieldsByTypeName.User === 'object' &&
  ('userSubscribedTo' in requestInfo.fieldsByTypeName.User ||
    'subscribedToUser' in requestInfo.fieldsByTypeName.User);

const addSubsToUser = async (user: User, requestInfo: unknown) => {
  if (!checkAreSubsNeeded(requestInfo)) return user;

  const userFields = requestInfo.fieldsByTypeName.User;

  const newUser = { ...user };

  // TODO: Refactor this!!!
  if ('userSubscribedTo' in userFields && user.userSubscribedTo.length) {
    newUser.userSubscribedTo = await Promise.all(
      (
        (await userDataLoader.loadMany(
          user.userSubscribedTo.map((user) => (user as { authorId: string }).authorId),
        )) as User[]
      ).map(async (user) => await addSubsToUser(user, userFields.userSubscribedTo)),
    );
  }

  // TODO: Refactor this!!!
  if ('subscribedToUser' in userFields && user.subscribedToUser.length) {
    newUser.subscribedToUser = await Promise.all(
      (
        (await userDataLoader.loadMany(
          user.subscribedToUser.map(
            (user) => (user as { subscriberId: string }).subscriberId,
          ),
        )) as User[]
      ).map(async (user) => await addSubsToUser(user, userFields.subscribedToUser)),
    );
  }

  return newUser;
};

const usersResolver = async (prisma: Prisma, requestInfo?: object) => {
  const users = await prisma.user.findMany({
    include: getUserInclude(),
  });

  users.forEach((user) => {
    userDataLoader.prime(user.id, user);

    user.posts.forEach((post) => {
      postDataLoader.prime(post.id, post);
    });

    if (user.profile) profileDataLoader.prime(user.profile.id, user.profile);
  });

  const result = (await userDataLoader.loadMany(users.map((user) => user.id))) as User[];

  if (!checkAreSubsNeeded(requestInfo)) return result;

  return await Promise.all(
    result.map(async (user) => await addSubsToUser(user, requestInfo)),
  );
};

const userByIdResolver = async (args: unknown, requestInfo?: object) => {
  const { id } = args as IdArgs;

  const user = (await userDataLoader.load(id)) as User;

  if (!checkAreSubsNeeded(requestInfo)) return user;

  return await addSubsToUser(user, requestInfo);
};

const postsResolver = async (prisma: Prisma) => {
  const posts = await prisma.post.findMany();

  posts.forEach((post) => {
    postDataLoader.prime(post.id, post);
  });

  return await postDataLoader.loadMany(posts.map((post) => post.id));
};

const postByIdResolver = async (args: unknown) => {
  const { id } = args as IdArgs;

  return await postDataLoader.load(id);
};

const profilesResolver = async (prisma: Prisma) => {
  const profiles = await prisma.profile.findMany();

  profiles.forEach((profile) => {
    profileDataLoader.prime(profile.id, profile);
  });

  return await profileDataLoader.loadMany(profiles.map((profile) => profile.id));
};

const profileByIdResolver = async (args: unknown) => {
  const { id } = args as IdArgs;

  return await profileDataLoader.load(id);
};

const memberTypesResolver = async (prisma: Prisma) => {
  return await prisma.memberType.findMany();
};

const memberTypeByIdResolver = async (prisma: Prisma, args: unknown) => {
  const { id } = args as IdArgs;

  return await prisma.memberType.findUnique({
    where: { id },
  });
};

export const getDataResolver = (
  action: ResolverActions[keyof ResolverActions],
  context: unknown,
  args?: unknown,
  info?: GraphQLResolveInfo,
) => {
  const { prisma } = context as Context;

  if (!userDataLoader) {
    userDataLoader = getUserDataLoader(prisma);
  }

  if (!postDataLoader) {
    postDataLoader = getPostDataLoader(prisma);
  }

  if (!profileDataLoader) {
    profileDataLoader = getProfileDataLoader(prisma);
  }

  const parsedUserRequest = info ? (parseResolveInfo(info) as ResolveTree) : undefined;
  const userRequestInfo = parsedUserRequest
    ? simplifyParsedResolveInfoFragmentWithType(
        parsedUserRequest,
        (info as GraphQLResolveInfo).returnType,
      )
    : undefined;

  switch (action) {
    case ResolverActions.GET_ALL_USERS:
      return usersResolver(prisma, userRequestInfo);

    case ResolverActions.GET_USER_BY_ID:
      return userByIdResolver(args, userRequestInfo);

    case ResolverActions.GET_ALL_POSTS:
      return postsResolver(prisma);

    case ResolverActions.GET_POST_BY_ID:
      return postByIdResolver(args);

    case ResolverActions.GET_ALL_PROFILES:
      return profilesResolver(prisma);

    case ResolverActions.GET_PROFILE_BY_ID:
      return profileByIdResolver(args);

    case ResolverActions.GET_ALL_MEMBER_TYPES:
      return memberTypesResolver(prisma);

    case ResolverActions.GET_MEMBER_TYPE_BY_ID:
      return memberTypeByIdResolver(prisma, args);
  }
};
