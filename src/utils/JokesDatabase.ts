import { createPool, Pool, PoolConnection } from "mariadb";
import { Logger } from "./Logger";

export interface DadJoke
{
    id: number;
    setup: string;
    punchline: string;
}

class JokesDatabaseManager
{
    private static instance: JokesDatabaseManager;
    private readonly logger: Logger;
    private readonly pool: Pool;
    private initialized = false;

    private constructor()
    {
        this.logger = Logger.getInstance();
        const uri = process.env.MARIADB_URI || process.env.MARIADB_URL;

        if (!uri)
        {
            throw new Error("MARIADB_URI is not defined in environment variables");
        }

        this.pool = createPool(uri);
    }

    public static getInstance(): JokesDatabaseManager
    {
        if (!JokesDatabaseManager.instance)
        {
            JokesDatabaseManager.instance = new JokesDatabaseManager();
        }
        return JokesDatabaseManager.instance;
    }

    private async getConnection(): Promise<PoolConnection>
    {
        return this.pool.getConnection();
    }

    public async ensureInitialized(): Promise<void>
    {
        if (this.initialized)
        {
            return;
        }

        const sql = `
            CREATE TABLE IF NOT EXISTS jokes
            (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                setup TEXT NOT NULL,
                punchline TEXT NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        let conn: PoolConnection | null = null;
        try
        {
            conn = await this.getConnection();
            await conn.query(sql);
            this.initialized = true;
            this.logger.debug("[JokesDatabase] Ensured jokes table exists.");
        }
        catch (error)
        {
            this.logger.error("[JokesDatabase] Failed to initialize jokes table.", error as Error);
            throw error;
        }
        finally
        {
            if (conn)
            {
                conn.release();
            }
        }
    }

    public async getJokes(): Promise<DadJoke[]>
    {
        await this.ensureInitialized();
        let conn: PoolConnection | null = null;
        try
        {
            conn = await this.getConnection();
            const rows = await conn.query<DadJoke[]>(
                "SELECT id, setup, punchline FROM jokes ORDER BY id ASC",
            );
            return rows;
        }
        catch (error)
        {
            this.logger.error("[JokesDatabase] Failed to get jokes.", error as Error);
            throw error;
        }
        finally
        {
            if (conn)
            {
                conn.release();
            }
        }
    }

    public async getRandomJoke(): Promise<DadJoke | null>
    {
        await this.ensureInitialized();
        let conn: PoolConnection | null = null;
        try
        {
            conn = await this.getConnection();
            const rows = await conn.query<DadJoke[]>(
                "SELECT id, setup, punchline FROM jokes ORDER BY RAND() LIMIT 1",
            );
            if (!rows || rows.length === 0)
            {
                return null;
            }
            return rows[0];
        }
        catch (error)
        {
            this.logger.error("[JokesDatabase] Failed to get random joke.", error as Error);
            throw error;
        }
        finally
        {
            if (conn)
            {
                conn.release();
            }
        }
    }

    public async addJoke(setup: string, punchline: string): Promise<void>
    {
        await this.ensureInitialized();
        let conn: PoolConnection | null = null;
        try
        {
            conn = await this.getConnection();
            await conn.query("INSERT INTO jokes (setup, punchline) VALUES (?, ?)", [
                setup,
                punchline,
            ]);
            this.logger.debug(`[JokesDatabase] Added joke: ${setup.substring(0, 30)}...`);
        }
        catch (error)
        {
            this.logger.error("[JokesDatabase] Failed to add joke.", error as Error);
            throw error;
        }
        finally
        {
            if (conn)
            {
                conn.release();
            }
        }
    }

    public async removeJoke(id: number): Promise<void>
    {
        await this.ensureInitialized();
        let conn: PoolConnection | null = null;
        try
        {
            conn = await this.getConnection();
            await conn.query("DELETE FROM jokes WHERE id = ?", [id]);
            this.logger.debug(`[JokesDatabase] Removed joke with ID: ${id}`);
        }
        catch (error)
        {
            this.logger.error(
                `[JokesDatabase] Failed to remove joke with ID ${id}.`,
                error as Error,
            );
            throw error;
        }
        finally
        {
            if (conn)
            {
                conn.release();
            }
        }
    }

    public async removeJokeByIndex(index: number): Promise<DadJoke | null>
    {
        const jokes = await this.getJokes();
        if (index < 0 || index >= jokes.length)
        {
            return null;
        }
        const jokeToRemove = jokes[index];
        await this.removeJoke(jokeToRemove.id);
        return jokeToRemove;
    }

    public async addJokesBatch(jokesList: { setup: string; punchline: string }[]): Promise<number>
    {
        await this.ensureInitialized();
        if (jokesList.length === 0) return 0;

        let conn: PoolConnection | null = null;
        try
        {
            conn = await this.getConnection();
            let count = 0;
            const values = jokesList.map((j) => [j.setup, j.punchline]);
            await conn.batch("INSERT INTO jokes (setup, punchline) VALUES (?, ?)", values);
            this.logger.debug(
                `[JokesDatabase] Successfully batched inserted ${jokesList.length} jokes.`,
            );
            return jokesList.length;
        }
        catch (error)
        {
            this.logger.error("[JokesDatabase] Failed to batch insert jokes.", error as Error);
            throw error;
        }
        finally
        {
            if (conn)
            {
                conn.release();
            }
        }
    }
}

export const JokesDatabase = JokesDatabaseManager.getInstance();
