import { createCaller } from '@/server/appRouter';
import {
    TEST_FIRST_NAME,
    TEST_LAST_NAME,
    TEST_EMAIL,
    TEST_PASSWORD_PLAIN_TEXT,
} from '../utils';

describe('User CRUDL tests', () => {
    const trpcClient = createCaller({});

    it('when user is created, getUsers returns it with correct fields', async () => {
        await trpcClient.users.addUser({
            firstName: TEST_FIRST_NAME,
            lastName: TEST_LAST_NAME,
            email: TEST_EMAIL,
        });

        const users = await trpcClient.users.getUsers();

        assert.equal(users.length, 1);

        const [user] = users;

        assert.isNotNull(user.id);
        assert.equal(user.firstName, TEST_FIRST_NAME);
        assert.equal(user.lastName, TEST_LAST_NAME);
        assert.equal(user.email, TEST_EMAIL);
    });

    it("when user is deleted, getUsers doesn't return it", async () => {
        await trpcClient.users.addUser({
            firstName: TEST_FIRST_NAME,
            lastName: TEST_LAST_NAME,
            email: TEST_EMAIL,
        });

        const users = await trpcClient.users.getUsers();

        assert.equal(users.length, 1);

        await trpcClient.users.deleteUser({
            id: users[0].id,
        });

        const userssAfterDelete = await trpcClient.users.getUsers();

        assert.isEmpty(userssAfterDelete);
    });

    it('when user id is not found, delete still succeeds', async () => {
        assert.doesNotThrow(async () => {
            await trpcClient.users.deleteUser({
                id: 90,
            });
        });
    });

    it.for([
        {
            scenario: 'invalid email',
            input: {
                firstName: TEST_FIRST_NAME,
                lastName: TEST_LAST_NAME,
                email: 'invalid_email',
                password: TEST_PASSWORD_PLAIN_TEXT,
            },
        },
    ])(
        'when create user input is invalid [$scenario], throws exception',
        async ({ input }) => {
            await expect(() =>
                trpcClient.users.addUser(input)
            ).rejects.toThrowError();
        }
    );
});
