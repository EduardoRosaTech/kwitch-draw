import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
const A = "11111111-1111-4111-8111-111111111111",
  B = "22222222-2222-4222-8222-222222222222";
test("PostgreSQL: RLS, grants, rewards, timer, daily and journeys", async (t) => {
  const pg = new PGlite();
  await pg.exec(
    `create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;`,
  );
  await pg.exec(
    await readFile(
      new URL("../supabase/migrations/001_kwitch.sql", import.meta.url),
      "utf8",
    ),
  );
  await pg.exec(
    await readFile(new URL("../supabase/seed.sql", import.meta.url), "utf8"),
  );
  await pg.query("insert into auth.users values($1,$2),($3,$4)", [
    A,
    { display_name: "Luna" },
    B,
    { display_name: "Nox" },
  ]);
  await pg.exec(
    await readFile(
      new URL("../supabase/migrations/002_profile_gender.sql", import.meta.url),
      "utf8",
    ),
  );
  await pg.exec(
    await readFile(
      new URL(
        "../supabase/migrations/004_progression_familiar.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const as = async (id, fn) => {
    await pg.exec(
      `set role authenticated;select set_config('request.jwt.claim.sub','${id}',false);`,
    );
    try {
      return await fn();
    } finally {
      await pg.exec("reset role");
    }
  };
  const start = async (id, kind = "random") =>
    (
      await as(A, () =>
        pg.query("select * from public.start_challenge($1,$2)", [id, kind]),
      )
    ).rows[0];
  const control = async (id, action = "complete") =>
    (
      await as(A, () =>
        pg.query("select * from public.control_run($1,$2)", [id, action]),
      )
    ).rows[0];
  const fastForward = async (id) =>
    pg.query(
      "update public.challenge_runs set active_since=now()-interval '2 hours' where id=$1",
      [id],
    );
  await t.test(
    "upgrade preserves accounts and gender follows RLS",
    async () => {
      const existing = (
        await as(A, () => pg.query("select * from public.profiles"))
      ).rows[0];
      assert.equal(existing.display_name, "Luna");
      assert.equal(existing.gender, "neutral");
      await as(A, () =>
        pg.query("update public.profiles set gender='masculine' where id=$1", [
          A,
        ]),
      );
      assert.equal(
        (await as(A, () => pg.query("select gender from public.profiles")))
          .rows[0].gender,
        "masculine",
      );
      assert.equal(
        (
          await as(A, () =>
            pg.query(
              "update public.profiles set gender='feminine' where id=$1 returning id",
              [B],
            ),
          )
        ).rows.length,
        0,
      );
      await assert.rejects(
        as(A, () =>
          pg.query("update public.profiles set gender='invalid' where id=$1", [
            A,
          ]),
        ),
        /profiles_gender_check/,
      );
      await pg.query("insert into auth.users values($1,$2)", [
        "33333333-3333-4333-8333-333333333333",
        { gender: "feminine" },
      ]);
      const created = (
        await pg.query(
          "select * from public.profiles where id='33333333-3333-4333-8333-333333333333'",
        )
      ).rows[0];
      assert.equal(created.gender, "feminine");
      assert.equal(created.display_name, "Bruxinha");
      await pg.query("insert into auth.users values($1,$2)", [
        "44444444-4444-4444-8444-444444444444",
        { gender: "unsupported" },
      ]);
      const neutral = (
        await pg.query(
          "select * from public.profiles where id='44444444-4444-4444-8444-444444444444'",
        )
      ).rows[0];
      assert.equal(neutral.gender, "neutral");
      assert.equal(neutral.display_name, "Pessoa criativa");
    },
  );
  await t.test("signup and isolation", async () => {
    const rows = (await as(A, () => pg.query("select * from public.profiles")))
      .rows;
    assert.equal(rows.length, 1);
    assert.equal(rows[0].id, A);
    assert.equal(rows[0].display_name, "Luna");
    await assert.rejects(
      as(A, () => pg.query("update public.profiles set xp=999")),
      /permission denied/,
    );
    await assert.rejects(
      as(A, () =>
        pg.query("insert into public.completions(user_id) values($1)", [A]),
      ),
      /permission denied/,
    );
    const result = await as(A, () =>
      pg.query(
        "update public.profiles set display_name='Changed' where id=$1 returning id",
        [B],
      ),
    );
    assert.equal(result.rows.length, 0);
  });
  await t.test("timer and private runs", async () => {
    const r = await start(1);
    await assert.rejects(start(2), /ritual atual/);
    await assert.rejects(control(r.id), /completar o tempo/);
    assert.equal(
      (await as(B, () => pg.query("select * from public.challenge_runs"))).rows
        .length,
      0,
    );
    await assert.rejects(
      as(B, () =>
        pg.query("select * from public.control_run($1,'complete')", [r.id]),
      ),
      /não encontrado/,
    );
    await fastForward(r.id);
    const paused = await control(r.id, "pause");
    assert.equal(paused.status, "paused");
    assert.ok(paused.accumulated_seconds >= 7200);
    const resumed = await control(r.id, "resume");
    assert.equal(resumed.status, "active");
    const completed = await control(r.id);
    assert.equal(completed.status, "completed");
    await control(r.id);
    const p = (await pg.query("select * from public.profiles where id=$1", [A]))
      .rows[0];
    assert.equal(p.xp, 25);
    assert.equal(p.streak, 1);
    assert.equal(
      (await pg.query("select * from public.completions")).rows.length,
      1,
    );
    assert.equal(
      (await pg.query("select * from public.user_achievements")).rows.length,
      1,
    );
    await assert.rejects(start(1), /recebeu XP/);
  });
  await t.test("journey gating", async () => {
    await assert.rejects(start(102, "journey"), /ordem/);
    await assert.rejects(start(101), /jornada/);
    let r = await start(101, "journey");
    await fastForward(r.id);
    await control(r.id);
    await assert.rejects(start(101, "journey"), /recebeu XP|ordem/);
    r = await start(102, "journey");
    await control(r.id, "abandon");
  });
  await t.test("daily validation and one daily reward", async () => {
    const daily = (
      await as(A, () => pg.query("select * from public.daily_challenge()"))
    ).rows[0];
    await assert.rejects(start(201, "daily"), /indisponível/);
    const owner = await as(B, () =>
      pg.query("select * from public.start_challenge($1,$2)", [
        daily.id,
        "daily",
      ]),
    );
    const r = owner.rows[0];
    await fastForward(r.id);
    await as(B, () =>
      pg.query("select * from public.control_run($1,'complete')", [r.id]),
    );
    await assert.rejects(
      as(B, () =>
        pg.query("select * from public.start_challenge($1,$2)", [
          daily.id,
          "daily",
        ]),
      ),
      /recebeu XP|indisponível/,
    );
  });
  await t.test("five rewards a day and same-day streak", async () => {
    for (const id of [2, 3, 4]) {
      const r = await start(id);
      await fastForward(r.id);
      await control(r.id);
    }
    await assert.rejects(start(5), /cinco rituais/);
    const p = (await pg.query("select * from public.profiles where id=$1", [A]))
      .rows[0];
    assert.equal(p.streak, 1);
    assert.equal(p.xp, 140);
    assert.equal(p.level, 1);
    assert.equal(
      (await as(A, () => pg.query("select * from public.completions"))).rows
        .length,
      5,
    );
    assert.equal(
      (await as(A, () => pg.query("select * from public.user_achievements")))
        .rows.length,
      2,
    );
  });
  await t.test(
    "streak increments across days and resets after gaps",
    async () => {
      await pg.query("delete from public.completions where user_id=$1", [A]);
      await pg.query(
        "update public.profiles set last_completed_on=(now() at time zone 'America/Sao_Paulo')::date-1,streak=3 where id=$1",
        [A],
      );
      let r = await start(5);
      await fastForward(r.id);
      await control(r.id);
      assert.equal(
        (await pg.query("select streak from public.profiles where id=$1", [A]))
          .rows[0].streak,
        4,
      );
      await pg.query(
        "update public.profiles set last_completed_on=(now() at time zone 'America/Sao_Paulo')::date-3 where id=$1",
        [A],
      );
      r = await start(6);
      await fastForward(r.id);
      await control(r.id);
      assert.equal(
        (await pg.query("select streak from public.profiles where id=$1", [A]))
          .rows[0].streak,
        1,
      );
    },
  );
  await t.test("anonymous has no access", async () => {
    await pg.exec(
      "set role anon;select set_config('request.jwt.claim.sub','',false)",
    );
    try {
      await assert.rejects(
        pg.query("select * from public.profiles"),
        /permission denied/,
      );
      await assert.rejects(
        pg.query("select * from public.start_challenge(1,'random')"),
        /permission denied/,
      );
    } finally {
      await pg.exec("reset role");
    }
  });
  await pg.close();
});
