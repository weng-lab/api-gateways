import { ApolloServer, gql } from "apollo-server-express";
import express from "express";
import { buildFederatedSchema } from "@apollo/federation";

const typeDefs = gql`
    extend type Query {
        me: User
    }
    type User {
        id: ID!
        name: String
        username: String
    }
`;

const users = [
    {
        id: 1,
        name: "Ada Lovelace",
        username: "@ada"
    },
    {
        id: 2,
        name: "Alan Turing",
        username: "@complete"
    }
];

const resolvers = {
    Query: {
        me(obj: any, args: any, context: any) {
            return users.find((user) => user.id === context.user.uid);
        }
    }
};

const userFiles = [
    { userId: 1, files: ["file1.txt", "file2.pdf"] },
    { userId: 2, files: ["file3.zip"] }
]

export async function userFilesHandler(req: express.Request, res: express.Response) {
    const uid = JSON.parse(req.headers["user"] as string).uid;
    res.send(userFiles.find((file) => file.userId === uid)?.files);
}

export const restApi = express.Router().post('/userFiles', userFilesHandler);

// Add /rest endpoint to restApi
const paths = [... new Set(restApi.stack.filter(r => r.route).map(r => r.route.path))];
restApi.get('/rest', (_, res) => res.send(paths));

const userServer = new ApolloServer({ 
    schema: buildFederatedSchema([{ typeDefs, resolvers }]),
    context: ({ req }) => {
        let user = undefined;
        if (req.header("user") !== undefined) {
            user = JSON.parse(req.header("user") as string);
        }
        return { user };
    }
});
export const userApp = express();
userApp.use(restApi);
userServer.applyMiddleware({ app: userApp });

export const meQuery = `
    query Me {
        me {
            id, name, username
        }
    }
`;