import { ApolloGateway, LocalGraphQLDataSource } from '@apollo/gateway';
import { parse, visit, graphqlSync } from 'graphql';
import { buildFederatedSchema } from '@apollo/federation';
import GenomicObject from './genomicobject';
import { gql } from 'apollo-server-core';

const NODE_SERVICE_NAME = 'NODE_SERVICE';

const isNode = (node) =>
  node.interfaces.some(({ name }) => name.value === 'GenomicObject');

const toTypeDefs = (name) =>
  gql`
    extend type ${name} implements GenomicObject {
      id: String! @external
      assembly: String! @external
      coordinates: GenomicRange! @external
    }
  `;

/**
 * A GraphQL module which enables global object look-up by translating a global
 * ID to a concrete object with an ID.
 */
class RootModule {
  /**
   * @param {Set<string>} nodeTypes Supported typenames
   */

  constructor(dataSources) {
    this.resolvers = {
      Query: {
        async resolve(_, { id, assembly, limit }) {
          let rr = [];
          await Promise.all(
            Object.keys(dataSources).map( k => dataSources[k].process({ request: {
              query: `query q($id: String!, $assembly: String!, $limit: Int) {
                resolve(
                  id: $id
                  assembly: $assembly
                  limit: $limit
                ) {
                  id
                  assembly
                  coordinates {
                    chromosome
                    start
                    end
                  }
                  __typename
                }
              }`,
              variables: { id, assembly, limit }
            }, context: {} } ) )
          ).then(x => x.map( xx => xx.data?.resolve || [] ).forEach(xx => rr = [ ...xx, ...rr ]));
          return rr;
        },
        async suggest(_, { id, assembly, limit }) {
          let rr = [];
          await Promise.all(
            Object.keys(dataSources).map( k => dataSources[k].process({ request: {
              query: `query q($id: String!, $assembly: String!, $limit: Int) {
                suggest(
                  id: $id
                  assembly: $assembly
                  limit: $limit
                ) {
                  id
                  assembly
                  coordinates {
                    chromosome
                    start
                    end
                  }
                  __typename
                }
              }`,
              variables: { id, assembly, limit }
            }, context: {} } ) )
          ).then(x => x.map( xx => xx.data?.suggest || [] ).forEach(xx => rr = [ ...xx, ...rr ]));
          return rr;
        }
      },
    };
  }

  typeDefs = gql`
    type Query {
      resolve(
        id: String!
        assembly: String!
        limit: Int
      ): [GenomicObject!]!
      suggest(
        id: String!
        assembly: String!
        limit: Int
      ): [GenomicObject!]!
    }
  `;
}

/**
 * An ApolloGateway which provides `Node` resolution across all federated
 * services, and a global `node` field, like Relay.
 */
class GenomicObjectGateway extends ApolloGateway {

  async loadServiceDefinitions(config) {
    const defs = await super.loadServiceDefinitions(config);

    // Once all real service definitions have been loaded, we need to find all
    // types that implement the Node interface. These must also become concrete
    // types in the Node service, so we build a GraphQL module for each.
    const modules = [];
    const seenNodeTypes = new Set();
    for (const service of defs.serviceDefinitions || []) {
      // Manipulate the typeDefs of the service
      service.typeDefs = visit(service.typeDefs, {
        ObjectTypeDefinition(node) {
          const name = node.name.value;

          // Remove existing `query { node }` from service to avoid collisions
          if (name === 'Query') {
            return visit(node, {
              FieldDefinition(node) {
                if (node.name.value === 'resolve' || node.name.value === 'suggest') {
                  return null;
                }
              },
            });
          }

          // Add any new Nodes from this service to the Node service's modules
          if (isNode(node) && !seenNodeTypes.has(name)) {
            // We don't need any resolvers for these modules; they're just
            // simple objects with a single `id` property.
            modules.push({ typeDefs: toTypeDefs(name) });
            seenNodeTypes.add(service.name);

            return;
          }
        },
      });
    }

    if (!modules.length) {
      return defs;
    }

    // Dynamically construct a service to do Node resolution. This requires
    // building a federated schema, and introspecting it using the
    // `_service.sdl` field so that all the machinery is correct. Effectively
    // this is what would have happened if this were a real service.
    const nodeSchema = buildFederatedSchema([
      // The Node service must include the Node interface and a module for
      // translating the IDs into concrete types
      GenomicObject,
      new RootModule([ ...seenNodeTypes ].map(x => this.dataSources[x])),

      // The Node service must also have concrete types for each type. This
      // just requires the a type definition with an `id` field for each
      ...modules,
    ]);

    // This is a local schema, but we treat it as if it were a remote schema,
    // because all other schemas are (probably) remote. In that case, we need
    // to provide the Federated SDL as part of the type definitions.
    const res = graphqlSync({
      schema: nodeSchema,
      source: 'query { _service { sdl } }',
    });

    res.data && defs.serviceDefinitions?.push({
      typeDefs: parse(res.data._service.sdl),
      schema: nodeSchema,
      name: NODE_SERVICE_NAME,
    });

    return defs;
  }

  /**
   * Override `createDataSource` to let the local Node resolution service be
   * created without complaining about missing a URL.
   */
  createDataSource(serviceDef) {
    if (!this.dataSources) this.dataSources = {};
    if (serviceDef.schema) {
      return new LocalGraphQLDataSource(serviceDef.schema);
    }
    return this.dataSources[serviceDef.name] = super.createDataSource(serviceDef);
  }
}

export default GenomicObjectGateway;
