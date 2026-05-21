/**
 * Один раз настраивает облачный проект Supabase без ручного SQL в браузере:
 * 1) применяет supabase/complete_setup.sql (нужен DATABASE_URL к Postgres);
 * 2) создаёт публичный бакет product-images (нужен SUPABASE_SERVICE_ROLE_KEY);
 * 3) опционально создаёт пользователя админки (BOOTSTRAP_ADMIN_EMAIL / BOOTSTRAP_ADMIN_PASSWORD).
 *
 * Запуск из корня репозитория:
 *   npm run supabase:bootstrap
 *
 * Переменные в .env.local — см. supabase/README.md и .env.example
 */
import path from "node:path";
import { config } from "dotenv";
import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";

config({ path: path.join(process.cwd(), ".env.local") });
config({ path: path.join(process.cwd(), ".env") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const databaseUrl =
  process.env.DATABASE_URL?.trim() ||
  process.env.SUPABASE_DATABASE_URL?.trim();

async function applySchema() {
  if (!databaseUrl) {
    console.warn(
      "[skip] Нет DATABASE_URL — таблицы не созданы.\n" +
        "  Supabase → Project Settings → Database → Connection string → URI\n" +
        "  Включите «Direct connection» (порт 5432), скопируйте строку в .env.local:\n" +
        "  DATABASE_URL=postgresql://postgres....",
    );
    return;
  }

  const sqlPath = path.join(process.cwd(), "supabase", "complete_setup.sql");

  const sql = postgres(databaseUrl, {
    ssl: "require",
    max: 1,
    idle_timeout: 20,
    connect_timeout: 30,
  });

  try {
    await sql.file(sqlPath);
    console.log("[ok] SQL: применён файл supabase/complete_setup.sql");
  } catch (e) {
    console.error(
      "[err] Не удалось выполнить SQL. Частая причина — пулер 6543; возьмите URI с Direct (5432).",
    );
    throw e;
  } finally {
    await sql.end({ timeout: 5 });
  }
}

async function ensureBucket(sb: ReturnType<typeof createClient>) {
  const { data: buckets, error: listErr } = await sb.storage.listBuckets();
  if (listErr) {
    console.error("[err] Storage listBuckets:", listErr.message);
    return;
  }
  const name = "product-images";
  if (buckets?.some((b) => b.name === name)) {
    console.log("[ok] Storage: бакет", name, "уже есть");
    return;
  }
  const { error } = await sb.storage.createBucket(name, { public: true });
  if (error) {
    console.error("[err] Storage createBucket:", error.message);
    return;
  }
  console.log("[ok] Storage: создан публичный бакет", name);
}

async function ensureAdminUser(sb: ReturnType<typeof createClient>) {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD?.trim();
  if (!email || !password) {
    console.log(
      "[skip] Пользователь админки: задайте BOOTSTRAP_ADMIN_EMAIL и BOOTSTRAP_ADMIN_PASSWORD в .env.local и запустите снова.",
    );
    return;
  }
  const { error } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    if (/already|registered|exists/i.test(error.message)) {
      console.log("[ok] Auth: пользователь уже существует:", email);
      return;
    }
    console.error("[err] Auth createUser:", error.message);
    return;
  }
  console.log("[ok] Auth: создан пользователь для входа в /admin/login:", email);
}

async function main() {
  if (!url || !serviceKey) {
    console.error(
      "Нужны в .env.local:\n" +
        "  NEXT_PUBLIC_SUPABASE_URL\n" +
        "  SUPABASE_SERVICE_ROLE_KEY\n" +
        "и для таблиц — DATABASE_URL (см. сообщения выше).",
    );
    process.exit(1);
  }

  console.log("Supabase bootstrap →", url);

  await applySchema();

  const sb = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  await ensureBucket(sb);
  await ensureAdminUser(sb);

  console.log("\nДальше: npm run dev → откройте /admin/login и войдите.");
  console.log("Данные из JSON: npm run migrate:admin");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
