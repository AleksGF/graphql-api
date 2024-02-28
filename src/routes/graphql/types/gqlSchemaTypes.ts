import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLID,
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

const User = new GraphQLObjectType({
  name: 'User',
  fields: {
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    balance: { type: GraphQLFloat },
  },
});

const Post = new GraphQLObjectType({
  name: 'Post',
  fields: {
    id: { type: GraphQLID },
    title: { type: GraphQLString },
    content: { type: GraphQLString },
    authorId: { type: GraphQLID },
  },
});

const MemberTypesIdEnum = new GraphQLEnumType({
  name: 'MemberTypeId',
  values: {
    BASIC: { value: 'basic' },
    BUSINESS: { value: 'business' },
  },
});

const MemberType = new GraphQLObjectType({
  name: 'MemberType',
  fields: {
    id: { type: MemberTypesIdEnum },
    discount: { type: GraphQLFloat },
    postsLimitPerMonth: { type: GraphQLInt },
  },
});

const Profile = new GraphQLObjectType({
  name: 'Profile',
  fields: {
    id: { type: GraphQLString },
    isMale: { type: GraphQLBoolean },
    yearOfBirth: { type: GraphQLInt },
    userId: { type: GraphQLID },
    memberTypeId: { type: GraphQLString },
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
        id: { type: new GraphQLNonNull(GraphQLID) },
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
        id: { type: new GraphQLNonNull(GraphQLID) },
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
        id: { type: new GraphQLNonNull(GraphQLID) },
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
        id: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve: (_parent, args, context) => profileByIdResolver(args, context),
    },
  },
});
