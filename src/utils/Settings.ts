import mariadb, { Pool, PoolConnection } from "mariadb";
import { Logger } from "./Logger";
import { SettingsKeys } from "@/types/SETTINGS_KEYS";

export type SettingType =
    | "string"
    | "int"
    | "bigint"
    | "double"
    | "boolean"
    | "date"
    | "json"
    | "raw"
    | "channel"
    | "channels"
    | "role"
    | "roles";

export type SettingPrimitive = string | number | boolean | Date | bigint;
export type SettingValue = SettingPrimitive | Record<string, any> | Array<any> | null;

export interface SettingRecord
{
    key: string;
    type: SettingType;
    value: SettingValue;
}

export type SettingKey = (typeof SettingsKeys)[keyof typeof SettingsKeys];

export function isKnownSettingKey(key: string): key is SettingKey
{
    return (Object.values(SettingsKeys) as readonly string[]).includes(key);
}

class SettingsManager
{
    private static instance: SettingsManager;

    private readonly logger: Logger;
    private readonly pool: Pool;
    private initialized = false;

    private constructor()
    {
        this.logger = Logger.getInstance();

        const uri = process.env.MARIADB_URI || process.env.MARIADB_URL;

        if (!uri)
        {
            throw new Error("MARIADB_URI (or MARIADB_URL) is not defined in environment variables");
        }

        this.pool = mariadb.createPool(uri);
    }

    public static getInstance(): SettingsManager
    {
        if (!SettingsManager.instance)
        {
            SettingsManager.instance = new SettingsManager();
        }

        return SettingsManager.instance;
    }

    public async get<T = SettingValue>(
        key: string,
        defaultValue: T | null = null,
    ): Promise<T | null>
    {
        await this.ensureInitialized();

        let conn: PoolConnection | null = null;

        try
        {
            conn = await this.getConnection();
            const rows = await conn.query<
                {
                    key: string;
                    type: SettingType;
                    value_text: string | null;
                }[]
            >("SELECT `key`, `type`, value_text FROM settings WHERE `key` = ? LIMIT 1", [key]);

            if (!rows || rows.length === 0)
            {
                return defaultValue;
            }

            const row = rows[0];
            const value = this.deserialize(row.type, row.value_text);
            return value as T;
        }
        catch (error)
        {
            this.logger.error(`[Settings] Failed to get setting "${key}".`, error as Error);
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

    public async getRecord(key: string): Promise<SettingRecord | null>
    {
        await this.ensureInitialized();

        let conn: PoolConnection | null = null;

        try
        {
            conn = await this.getConnection();
            const rows = await conn.query<
                {
                    key: string;
                    type: SettingType;
                    value_text: string | null;
                }[]
            >("SELECT `key`, `type`, value_text FROM settings WHERE `key` = ? LIMIT 1", [key]);

            if (!rows || rows.length === 0)
            {
                return null;
            }

            const row = rows[0];
            return {
                key: row.key,
                type: row.type,
                value: this.deserialize(row.type, row.value_text),
            };
        }
        catch (error)
        {
            this.logger.error(`[Settings] Failed to get setting record "${key}".`, error as Error);
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

    public async set<T extends SettingValue>(
        key: string,
        value: T,
        explicitType?: SettingType,
    ): Promise<void>
    {
        await this.ensureInitialized();

        const type = explicitType || this.inferType(value);
        const serialized = this.serialize(type, value);

        let conn: PoolConnection | null = null;

        try
        {
            conn = await this.getConnection();
            await conn.query(
                `
                    INSERT INTO settings (\`key\`, \`type\`, value_text)
                    VALUES (?, ?, ?) ON DUPLICATE KEY
                    UPDATE
                        \`type\` =
                    VALUES (\`type\`), value_text =
                    VALUES (value_text)
				`,
                [key, type, serialized],
            );

            this.logger.debug(`[Settings] Set setting "${key}" with type "${type}".`);
        }
        catch (error)
        {
            this.logger.error(`[Settings] Failed to set setting "${key}".`, error as Error);
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

    public async delete(key: string): Promise<void>
    {
        await this.ensureInitialized();

        let conn: PoolConnection | null = null;

        try
        {
            conn = await this.getConnection();
            await conn.query("DELETE FROM settings WHERE `key` = ?", [key]);
            this.logger.debug(`[Settings] Deleted setting "${key}".`);
        }
        catch (error)
        {
            this.logger.error(`[Settings] Failed to delete setting "${key}".`, error as Error);
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

    public async list(type?: SettingType): Promise<SettingRecord[]>
    {
        await this.ensureInitialized();

        let conn: PoolConnection | null = null;

        try
        {
            conn = await this.getConnection();

            const rows = await conn.query<
                {
                    key: string;
                    type: SettingType;
                    value_text: string | null;
                }[]
            >(
                type
                    ? "SELECT `key`, `type`, value_text FROM settings WHERE `type` = ? ORDER BY `key` ASC"
                    : "SELECT `key`, `type`, value_text FROM settings ORDER BY `type` ASC, `key` ASC",
                type ? [type] : [],
            );

            return rows.map((row) => ({
                key: row.key,
                type: row.type,
                value: this.deserialize(row.type, row.value_text),
            }));
        }
        catch (error)
        {
            this.logger.error("[Settings] Failed to list settings.", error as Error);
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

    public async listTypes(): Promise<{ type: SettingType; count: number }[]>
    {
        await this.ensureInitialized();

        let conn: PoolConnection | null = null;

        try
        {
            conn = await this.getConnection();
            const rows = await conn.query<
                {
                    type: SettingType;
                    count: number;
                }[]
            >("SELECT `type`, COUNT(*) AS count FROM settings GROUP BY `type` ORDER BY `type` ASC");

            return rows;
        }
        catch (error)
        {
            this.logger.error("[Settings] Failed to list setting types.", error as Error);
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

    /**
     * Returns the stored array for `key`, or an empty array if the key doesn't exist.
     */
    public async getArray<T = any>(key: string): Promise<T[]>
    {
        const value = await this.get<T[]>(key, []);
        if (!Array.isArray(value))
        {
            this.logger.warn(
                `[Settings] getArray: "${key}" exists but is not an array — returning [].`,
            );
            return [];
        }
        return value;
    }

    /**
     * Replaces the entire array stored under `key`.
     */
    public async setArray<T = any>(key: string, items: T[]): Promise<void>
    {
        await this.set(key, items, "json");
    }

    /**
     * Appends `item` to the array stored under `key`.
     * Skips the write if `item` is already present (strict equality / JSON comparison).
     * @returns `true` if the item was added, `false` if it was already present.
     */
    public async addToArray<T = any>(key: string, item: T): Promise<boolean>
    {
        const arr = await this.getArray<T>(key);
        const itemStr = JSON.stringify(item);
        if (arr.some((el) => JSON.stringify(el) === itemStr))
        {
            return false;
        }
        arr.push(item);
        await this.set(key, arr, "json");
        return true;
    }

    /**
     * Removes all occurrences of `item` from the array stored under `key`.
     * @returns `true` if at least one item was removed, `false` if nothing changed.
     */
    public async removeFromArray<T = any>(key: string, item: T): Promise<boolean>
    {
        const arr = await this.getArray<T>(key);
        const itemStr = JSON.stringify(item);
        const filtered = arr.filter((el) => JSON.stringify(el) !== itemStr);
        if (filtered.length === arr.length)
        {
            return false;
        }
        await this.set(key, filtered, "json");
        return true;
    }

    /**
     * Returns `true` if `item` is present in the array stored under `key`.
     */
    public async hasInArray<T = any>(key: string, item: T): Promise<boolean>
    {
        const arr = await this.getArray<T>(key);
        const itemStr = JSON.stringify(item);
        return arr.some((el) => JSON.stringify(el) === itemStr);
    }

    private async getConnection(): Promise<PoolConnection>
    {
        return this.pool.getConnection();
    }

    private async ensureInitialized(): Promise<void>
    {
        if (this.initialized)
        {
            return;
        }

        const sql = `
            CREATE TABLE IF NOT EXISTS settings
            (
                id
                INT
                UNSIGNED
                NOT
                NULL
                AUTO_INCREMENT,
                \`key\`
                VARCHAR
            (
                191
            ) NOT NULL UNIQUE,
                \`type\` VARCHAR
            (
                32
            ) NOT NULL,
                value_text TEXT NULL,
                PRIMARY KEY
            (
                id
            ),
                INDEX idx_settings_key
            (
                \`key\`
            )
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE =utf8mb4_unicode_ci;
		`;

        let conn: PoolConnection | null = null;

        try
        {
            conn = await this.getConnection();
            await conn.query(sql);
            this.initialized = true;
            this.logger.debug("[Settings] Ensured settings table exists.");
        }
        catch (error)
        {
            this.logger.error("[Settings] Failed to initialize settings table.", error as Error);
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

    private inferType(value: SettingValue): SettingType
    {
        if (value === null || value === undefined)
        {
            return "raw";
        }

        if (typeof value === "string")
        {
            return "string";
        }

        if (typeof value === "number")
        {
            return Number.isInteger(value) ? "int" : "double";
        }

        if (typeof value === "boolean")
        {
            return "boolean";
        }

        if (typeof value === "bigint")
        {
            return "bigint";
        }

        if (value instanceof Date)
        {
            return "date";
        }

        return "json";
    }

    private serialize(type: SettingType, value: SettingValue): string | null
    {
        if (value === null || value === undefined)
        {
            return null;
        }

        switch (type)
        {
            case "string":
                return String(value);
            case "int":
            case "bigint":
            case "double":
                return String(value);
            case "boolean":
                return (value as boolean) ? "1" : "0";
            case "date":
                return (value as Date).toISOString();
            case "json":
                return JSON.stringify(value);
            case "raw":
            default:
                return String(value);
        }
    }

    private deserialize(type: SettingType, raw: string | null): SettingValue
    {
        if (raw === null || raw === undefined)
        {
            return null;
        }

        switch (type)
        {
            case "string":
                return raw;
            case "int":
                return parseInt(raw, 10);
            case "bigint":
                return BigInt(raw);
            case "double":
                return parseFloat(raw);
            case "boolean":
                return raw === "1" || raw.toLowerCase() === "true";
            case "date":
                return new Date(raw);
            case "json":
                try
                {
                    return JSON.parse(raw);
                }
                catch
                {
                    return raw;
                }
            case "raw":
            default:
                return raw;
        }
    }
}

/**
 * Public static helper with a very simple API:
 * - Settings.get(key, default?)
 * - Settings.set(key, value, explicitType?)
 * - Settings.delete(key)
 * - Settings.list(type?)
 * - Settings.listTypes()
 *
 * Array helpers (stored as JSON arrays):
 * - Settings.getArray<T>(key)            → T[]  (empty array if not set)
 * - Settings.setArray<T>(key, array)     → replaces the whole array
 * - Settings.addToArray<T>(key, item)    → appends an item (no duplicates)
 * - Settings.removeFromArray<T>(key, item) → removes all occurrences of item
 * - Settings.hasInArray<T>(key, item)    → true if item is in the array
 */
export class Settings
{
    private static manager = SettingsManager.getInstance();

    public static async get<T = SettingValue>(
        key: string,
        defaultValue: T | null = null,
    ): Promise<T | null>
    {
        return this.manager.get<T>(key, defaultValue);
    }

    public static async set<T extends SettingValue>(
        key: string,
        value: T,
        explicitType?: SettingType,
    ): Promise<void>
    {
        return this.manager.set<T>(key, value, explicitType);
    }

    public static async delete(key: string): Promise<void>
    {
        return this.manager.delete(key);
    }

    public static async getRecord(key: string): Promise<SettingRecord | null>
    {
        return this.manager.getRecord(key);
    }

    public static async list(type?: SettingType): Promise<SettingRecord[]>
    {
        return this.manager.list(type);
    }

    public static async listTypes(): Promise<{ type: SettingType; count: number }[]>
    {
        return this.manager.listTypes();
    }

    public static async getArray<T = any>(key: string): Promise<T[]>
    {
        return this.manager.getArray<T>(key);
    }

    public static async setArray<T = any>(key: string, items: T[]): Promise<void>
    {
        return this.manager.setArray<T>(key, items);
    }

    public static async addToArray<T = any>(key: string, item: T): Promise<boolean>
    {
        return this.manager.addToArray<T>(key, item);
    }

    public static async removeFromArray<T = any>(key: string, item: T): Promise<boolean>
    {
        return this.manager.removeFromArray<T>(key, item);
    }

    public static async hasInArray<T = any>(key: string, item: T): Promise<boolean>
    {
        return this.manager.hasInArray<T>(key, item);
    }
}
