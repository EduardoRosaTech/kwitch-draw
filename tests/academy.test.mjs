import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
const A = "11111111-1111-4111-8111-111111111111",
  B = "22222222-2222-4222-8222-222222222222";
test("Academy catalog, isolated progress and backend rewards", async (t) => {
  const pg = new PGlite();
  try {
    await pg.exec(
      `create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text,owner_id text,metadata jsonb,unique(bucket_id,name));alter table storage.objects enable row level security;grant usage on schema auth,public,storage to authenticated,anon;grant select,insert,update,delete on storage.objects to authenticated;grant execute on function auth.uid() to authenticated,anon;`,
    );
    for (const file of [
      "migrations/001_kwitch.sql",
      "migrations/002_profile_gender.sql",
      "seed.sql",
      "migrations/003_drawings.sql",
      "migrations/004_progression_familiar.sql",
      "content-pack-001.sql",
      "migrations/005_academy.sql",
      "migrations/006_catalog_compatibility.sql",
      "academy-content-001.sql",
      "migrations/007_longer_challenges.sql",
    ])
      await pg.exec(
        await readFile(new URL("../supabase/" + file, import.meta.url), "utf8"),
      );
    await pg.query("insert into auth.users values($1,$2),($3,$4)", [
      A,
      { display_name: "Luna" },
      B,
      { display_name: "Nox" },
    ]);
    const as = async (id, fn) => {
      await pg.exec(
        `set role authenticated;select set_config('request.jwt.claim.sub','${id}',false)`,
      );
      try {
        return await fn();
      } finally {
        await pg.exec("reset role");
      }
    };
    const count = async (sql) => (await pg.query(sql)).rows[0].n;
    await t.test(
      "Five-minute activities become ten, including after catalog reapplication",
      async () => {
        assert.equal(
          await count(
            "select count(*)::int n from public.challenges where duration_minutes=5",
          ),
          0,
        );
        assert.equal(
          await count(
            "select count(*)::int n from public.challenges where duration_minutes=10",
          ),
          325,
        );
        const before = (
          await pg.query(
            "select id, xp, duration_minutes from public.challenges order by id",
          )
        ).rows;
        await pg.exec(
          await readFile(
            new URL(
              "../supabase/migrations/007_longer_challenges.sql",
              import.meta.url,
            ),
            "utf8",
          ),
        );
        assert.deepEqual(
          (
            await pg.query(
              "select id, xp, duration_minutes from public.challenges order by id",
            )
          ).rows,
          before,
        );
      },
    );
    await t.test(
      "47 original lessons, 141 steps, 482 challenges and safe seed reapplication",
      async () => {
        assert.equal(
          await count("select count(*)::int n from public.lessons"),
          47,
        );
        assert.equal(
          await count("select count(*)::int n from public.lesson_steps"),
          141,
        );
        assert.equal(
          await count("select count(*)::int n from public.challenges"),
          482,
        );
        assert.equal(
          await count(
            "select count(*)::int n from public.challenges where channel='standard'",
          ),
          390,
        );
        assert.equal(
          await count("select count(*)::int n from public.challenge_lessons"),
          870,
        );
        await pg.exec(
          await readFile(
            new URL("../supabase/academy-content-001.sql", import.meta.url),
            "utf8",
          ),
        );
        assert.equal(
          await count("select count(*)::int n from public.challenges"),
          482,
        );
      },
    );
    await t.test(
      "Locked bodies and practices stay inaccessible, metadata remains visible",
      () =>
        as(A, async () => {
          assert.equal(
            await count("select count(*)::int n from public.lessons"),
            47,
          );
          assert.equal(
            await count("select count(*)::int n from public.lesson_steps"),
            57,
          );
          assert.equal(
            await count(
              "select count(*)::int n from public.challenges where channel='academy'",
            ),
            19,
          );
          await assert.rejects(
            pg.query("select public.start_challenge(3001,'practice')"),
            /bloqueada/,
          );
          await assert.rejects(
            pg.query("select public.start_challenge(3000,'random')"),
            /aula/,
          );
          await assert.rejects(
            pg.query("select public.mark_lesson_read('olhos-avancado')"),
            /bloqueada/,
          );
          const daily = (
            await pg.query("select channel from public.daily_challenge()")
          ).rows[0];
          assert.equal(daily.channel, "standard");
          const tip = (
            await pg.query("select min_level from public.daily_tip()")
          ).rows[0];
          assert.equal(tip.min_level, 1);
        }),
    );
    await t.test(
      "Reading gives no XP and private progress cannot be forged",
      async () => {
        await as(A, async () => {
          await pg.query("select public.mark_lesson_read('olhos-iniciante')");
          await pg.query("select public.mark_lesson_read('olhos-iniciante')");
          assert.equal(
            (await pg.query("select xp from public.profiles")).rows[0].xp,
            0,
          );
          assert.equal(
            await count(
              "select count(*)::int n from public.user_lesson_progress",
            ),
            1,
          );
          await assert.rejects(
            pg.query(
              "update public.user_lesson_progress set practice_completed_at=now()",
            ),
            /permission denied/,
          );
        });
        await as(B, async () =>
          assert.equal(
            await count(
              "select count(*)::int n from public.user_lesson_progress",
            ),
            0,
          ),
        );
      },
    );
    let runId;
    await t.test(
      "Practice uses timer, grants catalog XP once and unlocks academic achievement",
      async () => {
        runId = await as(A, async () => {
          const run = (
            await pg.query(
              "select (public.start_challenge(3000,'practice')).id",
            )
          ).rows[0].id;
          await assert.rejects(
            pg.query("select public.control_run($1,'complete')", [run]),
            /tempo/,
          );
          return run;
        });
        await pg.query(
          "update public.challenge_runs set active_since=now()-interval '11 minutes' where id=$1",
          [runId],
        );
        await as(A, async () => {
          await pg.query("select public.control_run($1,'complete')", [runId]);
          await pg.query("select public.control_run($1,'complete')", [runId]);
          assert.equal(
            (await pg.query("select xp from public.profiles")).rows[0].xp,
            30,
          );
          assert.equal(
            await count(
              "select count(*)::int n from public.user_lesson_progress where practice_completed_at is not null",
            ),
            1,
          );
          assert.equal(
            await count(
              "select count(*)::int n from public.user_achievements where achievement_id='academy-first'",
            ),
            1,
          );
          await assert.rejects(
            pg.query("select public.start_challenge(3000,'practice')"),
            /hoje/,
          );
        });
      },
    );
    await t.test(
      "Level increases unlock real content and practices",
      async () => {
        await pg.query("update public.profiles set xp=325 where id=$1", [A]);
        await as(A, async () => {
          assert.equal(
            await count("select count(*)::int n from public.lesson_steps"),
            99,
          );
          const run = (
            await pg.query(
              "select (public.start_challenge(3001,'practice')).id",
            )
          ).rows[0].id;
          await pg.query("select public.control_run($1,'abandon')", [run]);
        });
        await pg.query("update public.profiles set xp=1000 where id=$1", [A]);
        await as(A, async () => {
          assert.equal(
            await count("select count(*)::int n from public.lesson_steps"),
            141,
          );
          const run = (
            await pg.query(
              "select (public.start_challenge(3002,'practice')).id",
            )
          ).rows[0].id;
          await pg.query("select public.control_run($1,'abandon')", [run]);
        });
      },
    );
    await t.test(
      "Shared daily cap prevents repeated XP through different activity types",
      async () => {
        for (const challenge of [3003, 3006, 3009, 3012]) {
          const id = await as(
            A,
            async () =>
              (
                await pg.query(
                  "select (public.start_challenge($1,'practice')).id",
                  [challenge],
                )
              ).rows[0].id,
          );
          await pg.query(
            "update public.challenge_runs set active_since=now()-interval '11 minutes' where id=$1",
            [id],
          );
          await as(A, () =>
            pg.query("select public.control_run($1,'complete')", [id]),
          );
        }
        await as(A, async () => {
          await assert.rejects(
            pg.query("select public.start_challenge(3015,'practice')"),
            /cinco/,
          );
          await assert.rejects(
            pg.query("select public.start_challenge(1,'random')"),
            /cinco/,
          );
          assert.equal(
            await count(
              "select count(*)::int n from public.user_achievements where achievement_id='academy-five'",
            ),
            1,
          );
        });
      },
    );
    await t.test(
      "Anonymous RPC calls cannot grant progress or XP",
      async () => {
        await pg.exec("set role anon");
        try {
          await assert.rejects(
            pg.query("select public.mark_lesson_read('olhos-iniciante')"),
            /permission denied/,
          );
          await assert.rejects(
            pg.query("select public.daily_tip()"),
            /permission denied/,
          );
        } finally {
          await pg.exec("reset role");
        }
      },
    );
  } finally {
    await pg.close();
  }
});
