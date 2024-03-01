import {
  GraphQLBoolean,
  GraphQLFloat,
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

export const Types = [User, Post, MemberType, Profile];

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
