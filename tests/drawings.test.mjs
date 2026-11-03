import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
const A = "11111111-1111-4111-8111-111111111111",
  B = "22222222-2222-4222-8222-222222222222";
test("Drawing storage isolation, verified rewards and expanded catalog", async (t) => {
  const pg = new PGlite();
  try {
    await pg.exec(`create role anon;create role authenticated;create schema auth;
 create table auth.users(id uuid primary key,raw_user_meta_data jsonb);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create schema storage;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text,owner_id text,metadata jsonb,unique(bucket_id,name));
 alter table storage.objects enable row level security;
 grant usage on schema auth,public,storage to authenticated,anon;
 grant select,insert,update,delete on storage.objects to authenticated;
 grant execute on function auth.uid() to authenticated,anon;`);
    for (const file of [
      "migrations/001_kwitch.sql",
      "migrations/002_profile_gender.sql",
      "seed.sql",
      "migrations/003_drawings.sql",
      "migrations/004_progression_familiar.sql",
      "content-pack-001.sql",
      "migrations/005_academy.sql",
      "migrations/006_catalog_compatibility.sql",
    ])
      await pg.exec(
        await readFile(new URL(`../supabase/${file}`, import.meta.url), "utf8"),
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
    let completion;
    await t.test(
      "435 exercises, 390 standalone, balanced themes and safe reapplication",
      async () => {
        const count = await pg.query(
          "select count(*)::int as total,count(*) filter(where grimoire_id is null)::int as standalone from public.challenges",
        );
        assert.deepEqual(count.rows[0], { total: 435, standalone: 390 });
        assert.equal(
          (await pg.query("select count(*)::int as n from public.grimoires"))
            .rows[0].n,
          9,
        );
        const combinations = await pg.query(
          "select category,difficulty,count(*)::int as n from public.challenges where id between 1000 and 1377 group by category,difficulty",
        );
        assert.equal(combinations.rows.length, 18);
        assert.ok(combinations.rows.every((r) => r.n === 21));
        assert.equal(
          (
            await pg.query(
              "select count(distinct title)::int as n from public.challenges",
            )
          ).rows[0].n,
          435,
        );
        await pg.exec(
          await readFile(
            new URL("../supabase/content-pack-001.sql", import.meta.url),
            "utf8",
          ),
        );
        assert.equal(
          (await pg.query("select count(*)::int as n from public.challenges"))
            .rows[0].n,
          435,
        );
      },
    );
    await t.test(
      "no reward or upload before a completed owned exercise",
      async () => {
        const run = (
          await as(A, () =>
            pg.query("select * from public.start_challenge(1000,'random')"),
          )
        ).rows[0];
        await assert.rejects(
          as(A, () =>
            pg.query("select * from public.attach_drawing($1)", [run.id]),
          ),
          /concluído não encontrado/,
        );
        await assert.rejects(
          as(A, () =>
            pg.query(
              "insert into storage.objects(bucket_id,name,owner_id,metadata) values('drawings',$1,$2,$3)",
              [`${A}/${run.id}.webp`, A, { mimetype: "image/webp", size: 200 }],
            ),
          ),
          /row-level security/,
        );
        await pg.query(
          "update public.challenge_runs set active_since=now()-interval '1 hour' where id=$1",
          [run.id],
        );
        await as(A, () =>
          pg.query("select * from public.control_run($1,'complete')", [run.id]),
        );
        completion = (
          await pg.query("select * from public.completions where run_id=$1", [
            run.id,
          ])
        ).rows[0];
        await assert.rejects(
          as(A, () =>
            pg.query("select * from public.attach_drawing($1)", [
              completion.id,
            ]),
          ),
          /imagem válida/,
        );
        await assert.rejects(
          as(B, () =>
            pg.query("select * from public.attach_drawing($1)", [
              completion.id,
            ]),
          ),
          /não encontrado/,
        );
      },
    );
    const path = () => `${A}/${completion.id}.webp`;
    await t.test(
      "storage path and ownership isolation, no overwrites",
      async () => {
        await assert.rejects(
          as(B, () =>
            pg.query(
              "insert into storage.objects(bucket_id,name,owner_id,metadata) values('drawings',$1,$2,$3)",
              [path(), B, { mimetype: "image/webp", size: 200 }],
            ),
          ),
          /row-level security/,
        );
        await as(A, () =>
          pg.query(
            "insert into storage.objects(bucket_id,name,owner_id,metadata) values('drawings',$1,$2,$3)",
            [path(), A, { mimetype: "image/webp", size: 200 }],
          ),
        );
        assert.equal(
          (await as(B, () => pg.query("select * from storage.objects"))).rows
            .length,
          0,
        );
        assert.equal(
          (await as(A, () => pg.query("select * from storage.objects"))).rows
            .length,
          1,
        );
        assert.equal(
          (
            await as(A, () =>
              pg.query("update storage.objects set metadata='{}' returning id"),
            )
          ).rows.length,
          0,
        );
        await assert.rejects(
          as(A, () =>
            pg.query("update public.completions set drawing_bonus=15"),
          ),
          /permission denied/,
        );
        await assert.rejects(
          as(A, () => pg.query("update public.profiles set xp=10000")),
          /permission denied/,
        );
      },
    );
    await t.test("backend rejects invalid image metadata", async () => {
      for (const metadata of [
        { mimetype: "image/svg+xml", size: 200 },
        { mimetype: "image/webp", size: 0 },
        { mimetype: "image/webp", size: 1048577 },
      ]) {
        await pg.query("update storage.objects set metadata=$1 where name=$2", [
          metadata,
          path(),
        ]);
        await assert.rejects(
          as(A, () =>
            pg.query("select * from public.attach_drawing($1)", [
              completion.id,
            ]),
          ),
          /imagem válida/,
        );
      }
      await pg.query("update storage.objects set metadata=$1 where name=$2", [
        { mimetype: "image/webp", size: 200 },
        path(),
      ]);
    });
    await t.test(
      "one bonus on retries, does not change streak or base XP",
      async () => {
        const before = (
          await pg.query("select * from public.profiles where id=$1", [A])
        ).rows[0];
        for (let i = 0; i < 3; i++)
          await as(A, () =>
            pg.query("select * from public.attach_drawing($1)", [
              completion.id,
            ]),
          );
        const after = (
          await pg.query("select * from public.profiles where id=$1", [A])
        ).rows[0];
        assert.equal(after.xp, before.xp + 15);
        assert.equal(after.streak, before.streak);
        const saved = (
          await as(A, () => pg.query("select * from public.completions"))
        ).rows[0];
        assert.equal(saved.xp, 25);
        assert.equal(saved.drawing_bonus, 15);
        assert.equal(saved.drawing_path, path());
        const other = (
          await pg.query("select xp from public.profiles where id=$1", [B])
        ).rows[0];
        assert.equal(other.xp, 0);
        await pg.exec("set role anon");
        try {
          await assert.rejects(
            pg.query("select * from public.attach_drawing($1)", [
              completion.id,
            ]),
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
