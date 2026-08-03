import mariadb from "mariadb";
import { Logger } from "./Logger";
import { SettingKey } from "@/types/SettingKey";

export type SettingValue = string | string[] | boolean | null;

const TABLE_NAME = "guild_settings";
const logger = Logger.getInstance();

class SettingsManager
{
    private static instance: SettingsManager;

    private pool: mariadb.Pool | null = null;
    private initialized = false;
    private guildQueues = new Map<string, Promise<unknown>>();

    private constructor() {}

    private enqueue<T>(guildId: string, task: () => Promise<T>): Promise<T>
    {
        const previous = this.guildQueues.get(guildId) ?? Promise.resolve();
        const result = previous.then(task, task);
        this.guildQueues.set(
            guildId,
            result.then(
                () => undefined,
                () => undefined,
            ),
        );
        return result;
    }

    public static getInstance(): SettingsManager
    {
        if (!SettingsManager.instance)
        {
            SettingsManager.instance = new SettingsManager();
        }
        return SettingsManager.instance;
    }

    public async initialize(): Promise<void>
    {
        if (this.initialized) return;

        const uri = process.env.MARIADB_URI || process.env.MARIADB_URL;
        if (!uri)
        {
            throw new Error("MARIADB_URI (or MARIADB_URL) is not defined in environment variables");
        }

        this.pool = mariadb.createPool(uri);

        let conn: mariadb.PoolConnection | null = null;
        try
        {
            conn = await this.pool.getConnection();
            await conn.query(`SELECT 1`);
            await conn.query(`
                CREATE TABLE IF NOT EXISTS \`${TABLE_NAME}\`
                (
                    guild_id VARCHAR(20) PRIMARY KEY,
                    settings JSON NOT NULL DEFAULT ('{}')
                )
            `);
            this.initialized = true;
            logger.info("[Settings] Initialized per-guild settings table.");
        }
        catch (error)
        {
            logger.error("[Settings] Failed to initialize.", error as Error);
            throw error;
        }
        finally
        {
            if (conn) conn.release();
        }
    }

    private ensureReady(): void
    {
        if (!this.initialized || !this.pool)
        {
            throw new Error("[Settings] Not initialized. Call initialize() first.");
        }
    }

    private parseSettings(raw: unknown): Record<string, SettingValue>
    {
        if (!raw) return {};
        if (typeof raw === "object") return raw as Record<string, SettingValue>;
        if (typeof raw === "string") return JSON.parse(raw);
        return {};
    }

    public async get(
        guildId: string,
        key: SettingKey,
    ): Promise<SettingValue | undefined>
    {
        this.ensureReady();
        const rows = await this.pool!.query(
            `SELECT settings FROM \`${TABLE_NAME}\` WHERE guild_id = ?`,
            [guildId],
        );
        const row = Array.isArray(rows) ? rows[0] : rows;
        if (!row || !row.settings) return undefined;
        const settings = this.parseSettings(row.settings);
        return settings[key];
    }

    public async getMany(
        guildId: string,
        keys: SettingKey[],
    ): Promise<Partial<Record<SettingKey, SettingValue>>>
    {
        this.ensureReady();
        if (keys.length === 0) return {};

        const rows = await this.pool!.query(
            `SELECT settings FROM \`${TABLE_NAME}\` WHERE guild_id = ?`,
            [guildId],
        );
        const row = Array.isArray(rows) ? rows[0] : rows;
        if (!row || !row.settings)
        {
            return Object.fromEntries(keys.map(k => [k, undefined])) as Partial<Record<SettingKey, SettingValue>>;
        }

        const settings = this.parseSettings(row.settings);
        const result: Partial<Record<SettingKey, SettingValue>> = {};
        for (const key of keys)
        {
            result[key] = settings[key];
        }
        return result;
    }

    public async set(
        guildId: string,
        key: SettingKey,
        value: SettingValue | null,
    ): Promise<void>
    {
        this.ensureReady();

        return this.enqueue(guildId, async () =>
        {
            const rows = await this.pool!.query(
                `SELECT settings FROM \`${TABLE_NAME}\` WHERE guild_id = ?`,
                [guildId],
            );
            const row = Array.isArray(rows) ? rows[0] : rows;
            let settings: Record<string, SettingValue> = {};
            if (row && row.settings)
            {
                settings = this.parseSettings(row.settings);
            }

            if (value === null)
            {
                delete settings[key];
            }
            else
            {
                settings[key] = value;
            }

            await this.pool!.query(
                `INSERT INTO \`${TABLE_NAME}\` (guild_id, settings) VALUES (?, ?) ON DUPLICATE KEY UPDATE settings = VALUES(settings)`,
                [guildId, JSON.stringify(settings)],
            );
        });
    }

    public async getAll(
        guildId: string,
    ): Promise<Partial<Record<SettingKey, SettingValue>>>
    {
        this.ensureReady();
        const rows = await this.pool!.query(
            `SELECT settings FROM \`${TABLE_NAME}\` WHERE guild_id = ?`,
            [guildId],
        );
        const row = Array.isArray(rows) ? rows[0] : rows;
        if (!row || !row.settings) return {};
        return this.parseSettings(row.settings) as Partial<Record<SettingKey, SettingValue>>;
    }

    public async memberHasAnyRoleFromKeys(
        guildId: string,
        memberRoleIds: Iterable<string> | string[] | Set<string>,
        keys: SettingKey[],
    ): Promise<boolean>
    {
        const memberSet = new Set<string>();
        if (Array.isArray(memberRoleIds))
        {
            for (const id of memberRoleIds) if (id) memberSet.add(String(id));
        }
        else if (memberRoleIds instanceof Set)
        {
            for (const id of memberRoleIds) if (id) memberSet.add(String(id));
        }
        else
        {
            for (const id of memberRoleIds as Iterable<string>) if (id) memberSet.add(String(id));
        }

        if (memberSet.size === 0 || keys.length === 0) return false;

        const settings = await this.getMany(guildId, keys);

        for (const k of keys)
        {
            const v = settings[k];
            if (v == null) continue;

            if (Array.isArray(v))
            {
                for (const id of v)
                {
                    if (id && memberSet.has(String(id))) return true;
                }
            }
            else if (typeof v === "string")
            {
                if (memberSet.has(v)) return true;
            }
        }
        return false;
    }

    public async memberHasAnyRole(guildId: string, memberRoleIds: Iterable<string> | string[] | Set<string>): Promise<boolean>
    {
        return this.memberHasAnyRoleFromKeys(guildId, memberRoleIds, [
            SettingKey.StaffRoles,
        ]);
    }

    public async close(): Promise<void>
    {
        if (this.pool)
        {
            await this.pool.end();
            this.pool = null;
            this.initialized = false;
            this.guildQueues.clear();
        }
    }
}

export class Settings
{
    private static manager = SettingsManager.getInstance();

    public static async initialize(): Promise<void>
    {
        await this.manager.initialize();
    }

    public static async get(
        guildId: string,
        key: SettingKey,
    ): Promise<SettingValue | undefined>
    {
        return this.manager.get(guildId, key);
    }

    public static async set(
        guildId: string,
        key: SettingKey,
        value: SettingValue | null,
    ): Promise<void>
    {
        return this.manager.set(guildId, key, value);
    }

    public static async getAll(
        guildId: string,
    ): Promise<Partial<Record<SettingKey, SettingValue>>>
    {
        return this.manager.getAll(guildId);
    }

    public static async getMany(
        guildId: string,
        keys: SettingKey[],
    ): Promise<Partial<Record<SettingKey, SettingValue>>>
    {
        return this.manager.getMany(guildId, keys);
    }

    public static async memberHasAnyRoleFromKeys(
        guildId: string,
        memberRoleIds: Iterable<string> | string[] | Set<string>,
        keys: SettingKey[],
    ): Promise<boolean>
    {
        return this.manager.memberHasAnyRoleFromKeys(guildId, memberRoleIds, keys);
    }

    public static async memberHasAnyRole(
        guildId: string,
        memberRoleIds: Iterable<string> | string[] | Set<string>,
    ): Promise<boolean>
    {
        return this.manager.memberHasAnyRole(guildId, memberRoleIds);
    }

    public static async close(): Promise<void>
    {
        return this.manager.close();
    }
}
