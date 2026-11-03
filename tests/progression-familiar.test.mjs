import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { levelFromXp, xpForLevel, levelProgress } from "../lib/progression.ts";
import { defaultFamiliar, familiarFromProfile } from "../lib/familiar.ts";
const A = "11111111-1111-4111-8111-111111111111",
  B = "22222222-2222-4222-8222-222222222222";
test("Level boundaries, progressive cost and previous XP", () => {
  assert.equal(xpForLevel(1), 0);
  assert.equal(xpForLevel(2), 150);
  assert.equal(xpForLevel(10), 2250);
  assert.equal(xpForLevel(20), 7125);
  assert.equal(xpForLevel(50), 36750);
  assert.equal(levelFromXp(4900), 16);
  for (let level = 2; level <= 200; level++) {
    const xp = xpForLevel(level);
    assert.equal(levelFromXp(xp - 1), level - 1);
    assert.equal(levelFromXp(xp), level);
    assert.equal(levelFromXp(xp + 1), level);
    assert.equal(
      xpForLevel(level + 1) - xpForLevel(level),
      150 + 25 * (level - 1),
    );
  }
  assert.deepEqual(levelProgress(140), {
    level: 1,
    earned: 140,
    required: 150,
    remaining: 10,
  });
  assert.deepEqual(levelProgress(150), {
    level: 2,
    earned: 0,
    required: 175,
    remaining: 175,
  });
});
test("Existing accounts receive a usable familiar", () => {
  assert.deepEqual(familiarFromProfile(null), defaultFamiliar);
  assert.equal(
    familiarFromProfile({ familiar_kind: "unknown" }).familiar_kind,
    "cat",
  );
  assert.equal(
    familiarFromProfile({ familiar_kind: "owl", familiar_name: "Lua" })
      .familiar_name,
    "Lua",
  );
});
test("Migration preserves XP, signup familiar, RLS and immutable level", async (t) => {
  const pg = new PGlite();
  try {
    await pg.exec(
      `create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;`,
    );
    for (const file of ["001_kwitch.sql", "002_profile_gender.sql"])
      await pg.exec(
        await readFile(
          new URL(`../supabase/migrations/${file}`, import.meta.url),
          "utf8",
        ),
      );
    await pg.query("insert into auth.users values($1,$2),($3,$4)", [
      A,
      { display_name: "Luna" },
      B,
      { display_name: "Nox" },
    ]);
    await pg.query("update public.profiles set xp=4900 where id=$1", [A]);
    assert.equal(
      (await pg.query("select level from public.profiles where id=$1", [A]))
        .rows[0].level,
      50,
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
        `set role authenticated;select set_config('request.jwt.claim.sub','${id}',false)`,
      );
      try {
        return await fn();
      } finally {
        await pg.exec("reset role");
      }
    };
    await t.test(
      "old XP retained, level recomputed and SQL agrees with frontend",
      async () => {
        const profile = (
          await as(A, () => pg.query("select * from public.profiles"))
        ).rows[0];
        assert.equal(profile.xp, 4900);
        assert.equal(profile.level, 16);
        assert.equal(profile.familiar_name, "Nox");
        const samples = [
          0, 149, 150, 151, 324, 325, 4900, 36749, 36750, 2147483647,
        ];
        for (let level = 1; level <= 100; level++)
          samples.push(xpForLevel(level), Math.max(0, xpForLevel(level) - 1));
        const results = await pg.query(
          "select x,public.level_from_xp(x) as level from unnest($1::integer[]) x",
          [samples],
        );
        for (const r of results.rows) assert.equal(r.level, levelFromXp(r.x));
      },
    );
    await t.test(
      "signup stores choices and handles malformed metadata",
      async () => {
        const C = "33333333-3333-4333-8333-333333333333",
          D = "44444444-4444-4444-8444-444444444444";
        await pg.query("insert into auth.users values($1,$2),($3,$4)", [
          C,
          {
            display_name: "Sol",
            gender: "masculine",
            familiar_kind: "rabbit",
            familiar_tone: "sage",
            familiar_charm: "moon",
            familiar_name: "  Faísca  ",
            familiar_description: "Companheiro curioso.",
          },
          D,
          {
            familiar_kind: "lion",
            familiar_tone: "invalid",
            familiar_charm: "bad",
            familiar_name: " ",
            familiar_description: "a".repeat(400),
          },
        ]);
        const c = (await as(C, () => pg.query("select * from public.profiles")))
          .rows[0];
        assert.equal(c.familiar_kind, "rabbit");
        assert.equal(c.familiar_tone, "sage");
        assert.equal(c.familiar_charm, "moon");
        assert.equal(c.familiar_name, "Faísca");
        assert.equal(c.familiar_description, "Companheiro curioso.");
        const d = (await as(D, () => pg.query("select * from public.profiles")))
          .rows[0];
        assert.equal(d.familiar_kind, "cat");
        assert.equal(d.familiar_tone, "plum");
        assert.equal(d.familiar_name, "Nox");
        assert.equal(d.familiar_description.length, 240);
      },
    );
    await t.test(
      "familiar fields stay private; user cannot change XP or level",
      async () => {
        await as(A, () =>
          pg.query(
            "update public.profiles set familiar_kind='fox',familiar_name='Amora' where id=$1",
            [A],
          ),
        );
        assert.equal(
          (
            await as(A, () =>
              pg.query("select familiar_name from public.profiles"),
            )
          ).rows[0].familiar_name,
          "Amora",
        );
        assert.equal(
          (
            await as(A, () =>
              pg.query(
                "update public.profiles set familiar_name='Roubo' where id=$1 returning id",
                [B],
              ),
            )
          ).rows.length,
          0,
        );
        for (const query of [
          "update public.profiles set xp=99999",
          "update public.profiles set level=50",
        ])
          await assert.rejects(
            as(A, () => pg.exec(query)),
            /permission denied|can only be updated to DEFAULT/,
          );
        await assert.rejects(
          as(A, () =>
            pg.exec("update public.profiles set familiar_kind='unknown'"),
          ),
          /check constraint/,
        );
        await assert.rejects(
          as(A, () =>
            pg.exec(
              "update public.profiles set familiar_description=repeat('x',241)",
            ),
          ),
          /check constraint/,
        );
        await assert.rejects(
          as(A, () => pg.exec("update public.profiles set familiar_name=' '")),
          /check constraint/,
        );
        await pg.query("update public.profiles set xp=36750 where id=$1", [A]);
        assert.equal(
          (await as(A, () => pg.query("select level from public.profiles")))
            .rows[0].level,
          50,
        );
      },
    );
  } finally {
    await pg.close();
  }
});
