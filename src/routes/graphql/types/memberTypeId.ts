import { GraphQLScalarType, Kind } from 'graphql';
import { MemberTypeId as MemberTypeIdEnum } from '../../member-types/schemas.js';

type MemberTypeEnumId = (typeof MemberTypeIdEnum)[keyof typeof MemberTypeIdEnum];

const isValidMemberType = (value: unknown): value is MemberTypeEnumId =>
  typeof value === 'string' &&
  Object.values(MemberTypeIdEnum).includes(value as MemberTypeEnumId);

export const MemberTypeId = new GraphQLScalarType({
  name: 'MemberTypeId',

  serialize(value) {
    if (!isValidMemberType(value)) throw new TypeError(`Invalid MemberType Id.`);

    return value;
  },

  parseValue(value) {
    if (!isValidMemberType(value)) throw new TypeError(`Invalid MemberType Id.`);

    return value;
  },

  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      if (isValidMemberType(ast.value)) {
        return ast.value;
      }
    }

    return undefined;
  },
});
