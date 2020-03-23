import request, { Response } from 'supertest';
import { userApp, meQuery } from "./mockServices";
import { MOCK_USER_1_B64, addMockAuthMiddleware } from './testUtils';
import createApp from '../src/app';


describe("service", () => {
    test("proxies graphql request with user in context / header", async () => {
        // Setup mock downstream app "Users"
        const userServer = await userApp.listen({ port: 4001 });
        try {
            const mockServices = [{ name: "user", url: "http://localhost:4001" }];
            const testApp = createApp(mockServices, addMockAuthMiddleware);

            let response: Response = await request(testApp)
                .post("/graphql")
                .set('MockUser', MOCK_USER_1_B64)
                .send({ query: meQuery });
            const username = response.body.data.me.username;
            expect(username).toBe("@ada");

            response = await request(testApp)
                .post("/userFiles")
                .set('MockUser', MOCK_USER_1_B64)
                .send();
            const userFiles = response.body;
            expect(userFiles).toEqual(["file1.txt", "file2.pdf"]);
        } finally {
            userServer.close();
        }
    });
});
