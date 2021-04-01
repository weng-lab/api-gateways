import { gql } from "apollo-server-core";

const DIVIDER_TOKEN = ':';

const typeDefs = gql`
  """
  An object with an ID.
  Follows the [Relay Global Object Identification Specification](https://relay.dev/graphql/objectidentification.htm)
  """

  type GenomicRange {
    chromosome: String!
    start: Int!
    end: Int!
  }

  interface GenomicObject {
    id: String!
    assembly: String!
    coordinates: GenomicRange!
  }
`;

const resolvers = {
  GenomicObject: {
    __resolveType({ __typename }: { __typename: string }) {
      return __typename;
    },
  },
};

/**
 * Decodes a Base64 encoded global ID into typename and key
 *
 * @param {string} id Base64 encoded Node ID
 * @returns {[string, Buffer]} A tuple of the decoded typename and key.
 *   The key is not decoded, since it may be binary. There's no validation
 *   of the typename.
 * @throws {RangeError} If id cannot be decoded
 */
function fromId(id: string): [ string, Buffer ] {
  const b = Buffer.from(id, 'base64');
  const i = b.indexOf(DIVIDER_TOKEN);

  if (i === -1) {
    throw new RangeError('Invalid Node ID');
  }

  const typename = b.slice(0, i).toString('ascii');
  const key = b.slice(i);
  return [typename, key];
}

/**
 * Encodes a typename and key into a global ID
 *
 * @param {string} typename GraphQL typename
 * @param {string | Buffer} key Type-specific identifier
 * @returns {string} Base64 encoded Node ID
 */
function toId(typename: string, key: string | Buffer): string {
  const prefix = Buffer.from(typename + DIVIDER_TOKEN, 'ascii');
  const keyEncoded = typeof key === 'string' ? Buffer.from(key, 'ascii') : key;

  return Buffer.concat(
    [prefix, keyEncoded],
    prefix.length + keyEncoded.length,
  ).toString('base64');
}

export default {
  resolvers,
  typeDefs,
  toId,
  fromId
};
