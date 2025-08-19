import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { setContext } from '@apollo/client/link/context';
import nhost from './nhost.js';

// HTTP link for queries and mutations
const httpLink = new HttpLink({
  uri: 'https://nksnnulkutwrdcbohgct.hasura.ap-south-1.nhost.run/v1/graphql',
});

// Auth link for HTTP requests
const authLink = setContext(async (_, { headers }) => {
  const token = await nhost.auth.getAccessToken();
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// GraphQLWsLink for subscriptions
const wsLink = new GraphQLWsLink(
  createClient({
    url: 'wss://nksnnulkutwrdcbohgct.hasura.ap-south-1.nhost.run/v1/graphql',
    connectionParams: async () => {
      const token = await nhost.auth.getAccessToken();
      return {
        headers: {
          authorization: token ? `Bearer ${token}` : '',
        },
      };
    },
    lazy: true,
    retryAttempts: 5,
  })
);

// Routing link: send subscriptions to wsLink, others to HTTP
const splitLink = split(
  ({ query }) => {
    const def = getMainDefinition(query);
    return def.kind === 'OperationDefinition' && def.operation === 'subscription';
  },
  wsLink,
  authLink.concat(httpLink)
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    mutate: { errorPolicy: 'all' },
    watchQuery: { fetchPolicy: 'no-cache', errorPolicy: 'ignore' },
    query: { fetchPolicy: 'no-cache', errorPolicy: 'all' },
  },
});

export default client;
