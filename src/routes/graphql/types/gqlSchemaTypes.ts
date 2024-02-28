import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql/index.js';
import {
  memberTypeByIdResolver,
  memberTypesResolver,
  postByIdResolver,
  postsResolver,
  profileByIdResolver,
  profilesResolver,
  userByIdResolver,
  usersResolver,
} from '../resolvers/resolvers.js';
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
  fields: {
    id: { type: UUIDType },
    name: { type: GraphQLString },
    balance: { type: GraphQLFloat },
    profile: {
      type: Profile,
    },
    posts: { type: new GraphQLList(Post) },
  },
});

export const Types = [User, Post, MemberType, Profile];

export const QueryType = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    users: {
      type: new GraphQLList(User),
      resolve: (_parent, _args, context) => usersResolver(context),
    },
    user: {
      type: User,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: (_parent, args, context) => userByIdResolver(args, context),
    },
    posts: {
      type: new GraphQLList(Post),
      resolve: postsResolver,
    },
    post: {
      type: Post,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: (_parent, args, context) => postByIdResolver(args, context),
    },
    memberTypes: {
      type: new GraphQLList(MemberType),
      resolve: memberTypesResolver,
    },
    memberType: {
      type: MemberType,
      args: {
        id: { type: new GraphQLNonNull(MemberTypeId) },
      },
      resolve: (_parent, args, context) => memberTypeByIdResolver(args, context),
    },
    profiles: {
      type: new GraphQLList(Profile),
      resolve: profilesResolver,
    },
    profile: {
      type: Profile,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: (_parent, args, context) => profileByIdResolver(args, context),
    },
  },
});
