import {
  parseResolveInfo,
  ResolveTree,
  simplifyParsedResolveInfoFragmentWithType,
} from 'graphql-parse-resolve-info';
import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql/index.js';
import { PrismaClient } from '@prisma/client';
import { Loaders } from '../loaders/loaders.js';
import { MemberTypeId } from './memberTypeId.js';
import { UUIDType } from './uuid.js';

type Context = {
  prisma: PrismaClient;
  loaders: Loaders;
};

const Post = new GraphQLObjectType({
  name: 'Post',
  fields: {
    id: { type: UUIDType },
    title: { type: GraphQLString },
    content: { type: GraphQLString },
    authorId: { type: UUIDType },
  },
});

const MemberType = new GraphQLObjectType({
  name: 'MemberType',
  fields: {
    id: { type: MemberTypeId },
    discount: { type: GraphQLFloat },
    postsLimitPerMonth: { type: GraphQLInt },
  },
});

const Profile = new GraphQLObjectType({
  name: 'Profile',
  fields: {
    id: { type: UUIDType },
    isMale: { type: GraphQLBoolean },
    yearOfBirth: { type: GraphQLInt },
    userId: { type: UUIDType },
    memberTypeId: { type: MemberTypeId },
    memberType: {
      type: MemberType,
      resolve: (parent, _args, { loaders }: Context, _info) =>
        loaders.memberTypeById.load((parent as { memberTypeId: string }).memberTypeId),
    },
  },
});

const User = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: { type: UUIDType },
    name: { type: GraphQLString },
    balance: { type: GraphQLFloat },
    profile: {
      type: Profile,
      resolve: (parent, _args, { loaders }: Context, _info) =>
        loaders.profileById.load((parent as { id: string }).id),
    },
    posts: {
      type: new GraphQLList(Post),
      resolve: (parent, _args, { loaders }: Context, _info) =>
        loaders.postsByUserId.load((parent as { id: string }).id),
    },
    userSubscribedTo: {
      type: new GraphQLList(User),
      resolve: async (
        parent: { userSubscribedTo?: { authorId: string }[] },
        _args,
        { loaders }: Context,
        _info,
      ) => {
        if (parent.userSubscribedTo)
          return await Promise.all(
            parent.userSubscribedTo.map(async (u) => await loaders.user.load(u.authorId)),
          );
      },
    },
    subscribedToUser: {
      type: new GraphQLList(User),
      resolve: async (
        parent: { subscribedToUser?: { subscriberId: string }[] },
        _args,
        { loaders }: Context,
        _info,
      ) => {
        if (parent.subscribedToUser)
          return await Promise.all(
            parent.subscribedToUser.map(
              async (u) => await loaders.user.load(u.subscriberId),
            ),
          );
      },
    },
  }),
});

const CreateUserInputType = new GraphQLInputObjectType({
  name: 'CreateUserInput',
  fields: () => ({
    name: { type: new GraphQLNonNull(GraphQLString) },
    balance: { type: new GraphQLNonNull(GraphQLFloat) },
  }),
});

const ChangeUserInputType = new GraphQLInputObjectType({
  name: 'ChangeUserInput',
  fields: () => ({
    name: { type: GraphQLString },
    balance: { type: GraphQLFloat },
  }),
});

const CreatePostInputType = new GraphQLInputObjectType({
  name: 'CreatePostInput',
  fields: () => ({
    title: { type: new GraphQLNonNull(GraphQLString) },
    content: { type: new GraphQLNonNull(GraphQLString) },
    authorId: { type: new GraphQLNonNull(UUIDType) },
  }),
});

const ChangePostInputType = new GraphQLInputObjectType({
  name: 'ChangePostInput',
  fields: () => ({
    title: { type: GraphQLString },
    content: { type: GraphQLString },
  }),
});

const CreateProfileInputType = new GraphQLInputObjectType({
  name: 'CreateProfileInput',
  fields: () => ({
    isMale: { type: new GraphQLNonNull(GraphQLBoolean) },
    yearOfBirth: { type: new GraphQLNonNull(GraphQLInt) },
    userId: { type: new GraphQLNonNull(UUIDType) },
    memberTypeId: { type: new GraphQLNonNull(MemberTypeId) },
  }),
});

const ChangeProfileInputType = new GraphQLInputObjectType({
  name: 'ChangeProfileInput',
  fields: () => ({
    isMale: { type: GraphQLBoolean },
    yearOfBirth: { type: GraphQLInt },
    memberTypeId: { type: MemberTypeId },
  }),
});

export const Types = [
  User,
  Post,
  MemberType,
  Profile,
  CreateUserInputType,
  CreatePostInputType,
  CreateProfileInputType,
  ChangeUserInputType,
  ChangePostInputType,
  ChangeProfileInputType,
];

export const QueryType = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    users: {
      type: new GraphQLList(User),
      resolve: async (_parent, _args, { prisma, loaders }: Context, info) => {
        const parsedUserRequest = parseResolveInfo(info) as ResolveTree;
        const userRequestInfo = simplifyParsedResolveInfoFragmentWithType(
          parsedUserRequest,
          info.returnType,
        );

        const users = await prisma.user.findMany({
          include: {
            userSubscribedTo: 'userSubscribedTo' in userRequestInfo.fields,
            subscribedToUser: 'subscribedToUser' in userRequestInfo.fields,
          },
        });

        users.forEach((user) => {
          loaders.user.prime(user.id, user);
        });

        return await loaders.user.loadMany(users.map((u) => u.id));
      },
    },

    user: {
      type: User as GraphQLObjectType<unknown, unknown>,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: (_parent, { id }: { id: string }, { loaders }: Context, _info) =>
        loaders.user.load(id),
    },

    posts: {
      type: new GraphQLList(Post),
      resolve: (_parent, _args, { prisma }: Context, _info) => prisma.post.findMany(),
    },

    post: {
      type: Post,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: (_parent, { id }: { id: string }, { prisma }: Context, _info) =>
        prisma.post.findUnique({
          where: {
            id,
          },
        }),
    },

    memberTypes: {
      type: new GraphQLList(MemberType),
      resolve: (_parent, _args, { prisma }: Context, _info) =>
        prisma.memberType.findMany(),
    },

    memberType: {
      type: MemberType,
      args: {
        id: { type: new GraphQLNonNull(MemberTypeId) },
      },
      resolve: (_parent, { id }: { id: string }, { prisma }: Context, _info) =>
        prisma.memberType.findUnique({
          where: { id },
        }),
    },

    profiles: {
      type: new GraphQLList(Profile),
      resolve: (_parent, _args, { prisma }: Context, _info) => prisma.profile.findMany(),
    },

    profile: {
      type: Profile,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: (_parent, { id }: { id: string }, { prisma }: Context, _info) =>
        prisma.profile.findUnique({
          where: {
            id,
          },
        }),
    },
  },
});

export const MutationType = new GraphQLObjectType({
  name: 'RootMutationType',
  fields: {
    createUser: {
      type: User as GraphQLObjectType,
      args: {
        dto: { type: new GraphQLNonNull(CreateUserInputType) },
      },
      resolve: (
        _parent,
        {
          dto,
        }: {
          dto: {
            name: string;
            balance: number;
          };
        },
        { prisma }: Context,
        _info,
      ) => prisma.user.create({ data: { ...dto } }),
    },

    createPost: {
      type: Post,
      args: {
        dto: { type: new GraphQLNonNull(CreatePostInputType) },
      },
      resolve: (
        _parent,
        {
          dto,
        }: {
          dto: {
            title: string;
            content: string;
            authorId: string;
          };
        },
        { prisma }: Context,
        _info,
      ) =>
        prisma.post.create({
          data: { ...dto },
        }),
    },

    createProfile: {
      type: Profile,
      args: {
        dto: { type: new GraphQLNonNull(CreateProfileInputType) },
      },
      resolve: (
        _parent,
        {
          dto,
        }: {
          dto: {
            isMale: boolean;
            yearOfBirth: number;
            memberTypeId: string;
            userId: string;
          };
        },
        { prisma }: Context,
        _info,
      ) =>
        prisma.profile.create({
          data: {
            isMale: dto.isMale,
            yearOfBirth: dto.yearOfBirth,
            memberTypeId: dto.memberTypeId,
            userId: dto.userId,
          },
        }),
    },

    deleteUser: {
      type: GraphQLBoolean,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (_parent, { id }: { id: string }, { prisma }: Context, _info) =>
        !!(await prisma.user.delete({ where: { id } })),
    },

    deletePost: {
      type: GraphQLBoolean,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (_parent, { id }: { id: string }, { prisma }: Context, _info) =>
        !!(await prisma.post.delete({ where: { id } })),
    },

    deleteProfile: {
      type: GraphQLBoolean,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (_parent, { id }: { id: string }, { prisma }: Context, _info) =>
        !!(await prisma.profile.delete({
          where: {
            id,
          },
        })),
    },

    changeUser: {
      type: User as GraphQLObjectType<unknown, unknown>,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
        dto: { type: new GraphQLNonNull(ChangeUserInputType) },
      },
      resolve: (
        _parent,
        {
          id,
          dto,
        }: {
          id: string;
          dto: {
            name?: string;
            balance?: number;
          };
        },
        { prisma }: Context,
        _info,
      ) =>
        prisma.user.update({
          where: { id },
          data: { ...dto },
        }),
    },

    changePost: {
      type: Post,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
        dto: { type: new GraphQLNonNull(ChangePostInputType) },
      },
      resolve: (
        _parent,
        {
          id,
          dto,
        }: {
          id: string;
          dto: {
            title?: string;
            content?: string;
          };
        },
        { prisma }: Context,
        _info,
      ) =>
        prisma.post.update({
          where: {
            id,
          },
          data: {
            ...dto,
          },
        }),
    },

    changeProfile: {
      type: Profile,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
        dto: { type: new GraphQLNonNull(ChangeProfileInputType) },
      },
      resolve: (
        _parent,
        {
          id,
          dto,
        }: {
          id: string;
          dto: {
            isMale?: boolean;
            yearOfBirth?: number;
            memberTypeId?: string;
          };
        },
        { prisma }: Context,
        _info,
      ) =>
        prisma.profile.update({
          where: {
            id,
          },
          data: {
            ...dto,
          },
        }),
    },

    subscribeTo: {
      type: User as GraphQLObjectType,
      args: {
        userId: { type: new GraphQLNonNull(UUIDType) },
        authorId: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: (
        _parent,
        { userId, authorId }: { userId: string; authorId: string },
        { prisma }: Context,
        _info,
      ) =>
        prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            userSubscribedTo: {
              create: {
                authorId: authorId,
              },
            },
          },
        }),
    },

    unsubscribeFrom: {
      type: GraphQLBoolean,
      args: {
        userId: { type: new GraphQLNonNull(UUIDType) },
        authorId: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (
        _parent,
        { userId, authorId }: { userId: string; authorId: string },
        { prisma }: Context,
        _info,
      ) =>
        !!(await prisma.subscribersOnAuthors.delete({
          where: {
            subscriberId_authorId: {
              subscriberId: userId,
              authorId,
            },
          },
        })),
    },
  },
});
