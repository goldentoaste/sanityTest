import { defineConfig } from 'drizzle-kit';
console.log('connecting to db: ', process.env.DBURL);

export default defineConfig({
    schema: './src/db/schema/*',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url:
            process.env.DBURL ??
            'postgres://root:12345@localhost:5434/portaldb',
    },
    verbose: true,
});
