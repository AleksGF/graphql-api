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
import { getDataResolver, ResolverActions } from '../resolvers/resolvers.js';
import { MemberTypeId } from './memberTypeId.js';
import { UUIDType } from './uuid.js';

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
    memberType: { type: MemberType },
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
    },
    posts: { type: new GraphQLList(Post) },
    userSubscribedTo: { type: new GraphQLList(User) },
    subscribedToUser: { type: new GraphQLList(User) },
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
      resolve: (_parent, _args, context) =>
        getDataResolver(ResolverActions.GET_ALL_USERS, context),
    },

    user: {
      type: User as GraphQLObjectType<unknown, unknown>,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: (_parent, args, context, info) =>
        getDataResolver(ResolverActions.GET_USER_BY_ID, context, args, info),
    },

    posts: {
      type: new GraphQLList(Post),
      resolve: (_parent, _args, context) =>
        getDataResolver(ResolverActions.GET_ALL_POSTS, context),
    },

    post: {
      type: Post,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: (_parent, args, context) =>
        getDataResolver(ResolverActions.GET_POST_BY_ID, context, args),
    },
    memberTypes: {
      type: new GraphQLList(MemberType),
      resolve: (_parent, _args, context) =>
        getDataResolver(ResolverActions.GET_ALL_MEMBER_TYPES, context),
    },

    memberType: {
      type: MemberType,
      args: {
        id: { type: new GraphQLNonNull(MemberTypeId) },
      },
      resolve: (_parent, args, context) =>
        getDataResolver(ResolverActions.GET_MEMBER_TYPE_BY_ID, context, args),
    },

    profiles: {
      type: new GraphQLList(Profile),
      resolve: (_parent, _args, context) =>
        getDataResolver(ResolverActions.GET_ALL_PROFILES, context),
    },

    profile: {
      type: Profile,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: (_parent, args, context) =>
        getDataResolver(ResolverActions.GET_PROFILE_BY_ID, context, args),
    },
  },
});

export const MutationType = new GraphQLObjectType({
  name: 'RootMutationType',
  fields: {
    createUser: {
      type: User as GraphQLObjectType<unknown, unknown>,
      args: {
        dto: { type: new GraphQLNonNull(CreateUserInputType) },
      },
      resolve: (_parent, args, context) =>
        getDataResolver(ResolverActions.CREATE_USER, context, args),
    },

    createPost: {
      type: Post,
      args: {
        dto: { type: new GraphQLNonNull(CreatePostInputType) },
      },
      resolve: (_parent, args, context) =>
        getDataResolver(ResolverActions.CREATE_POST, context, args),
    },

    createProfile: {
      type: Profile,
      args: {
        dto: { type: new GraphQLNonNull(CreateProfileInputType) },
      },
      resolve: (_parent, args, context) =>
        getDataResolver(ResolverActions.CREATE_PROFILE, context, args),
    },

    deleteUser: {
      type: GraphQLBoolean,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: (_parent, args, context) =>
        getDataResolver(ResolverActions.DELETE_USER, context, args),
    },

    deletePost: {
      type: GraphQLBoolean,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: (_parent, args, context) =>
        getDataResolver(ResolverActions.DELETE_POST, context, args),
    },

    deleteProfile: {
      type: GraphQLBoolean,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: (_parent, args, context) =>
        getDataResolver(ResolverActions.DELETE_PROFILE, context, args),
    },

    changeUser: {
      type: User as GraphQLObjectType<unknown, unknown>,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
        dto: { type: new GraphQLNonNull(ChangeUserInputType) },
      },
      resolve: (_parent, args, context) =>
        getDataResolver(ResolverActions.CHANGE_USER, context, args),
    },

    changePost: {
      type: Post,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
        dto: { type: new GraphQLNonNull(ChangePostInputType) },
      },
      resolve: (_parent, args, context) =>
        getDataResolver(ResolverActions.CHANGE_POST, context, args),
    },

    changeProfile: {
      type: Profile,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
        dto: { type: new GraphQLNonNull(ChangeProfileInputType) },
      },
      resolve: (_parent, args, context) =>
        getDataResolver(ResolverActions.CHANGE_PROFILE, context, args),
    },
  },
});
