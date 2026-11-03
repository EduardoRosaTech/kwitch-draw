import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
const A = "11111111-1111-4111-8111-111111111111",
  B = "22222222-2222-4222-8222-222222222222",
  ADMIN = "33333333-3333-4333-8333-333333333333";
test("Visual tutorials: publishing, assets, access and editor revisions", async (t) => {
  const pg = new PGlite();
  try {
    await pg.exec(
      `create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb,email text);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text,owner_id text,metadata jsonb,unique(bucket_id,name));alter table storage.objects enable row level security;grant usage on schema auth,public,storage to authenticated,anon;grant select,insert,update,delete on storage.objects to authenticated;grant execute on function auth.uid() to authenticated,anon;`,
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
      "migrations/008_community_support.sql",
      "migrations/009_visual_tutorials.sql",
      "tutorial-content-001.sql",
    ])
      await pg.exec(
        await readFile(new URL("../supabase/" + file, import.meta.url), "utf8"),
      );
    await pg.query(
      "insert into auth.users values($1,$2,$3),($4,$5,$6),($7,$8,$9)",
      [
        A,
        { display_name: "Luna", role: "admin" },
        "luna@example.test",
        B,
        { display_name: "Noah" },
        "noah@example.test",
        ADMIN,
        { display_name: "Equipe" },
        "admin@example.test",
      ],
    );
    await pg.query("insert into public.app_admins(user_id) values($1)", [
      ADMIN,
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

    const viewer = async (cid, lid = null) =>
      (await pg.query("select public.get_visual_tutorial($1,$2) p", [cid, lid]))
        .rows[0].p;
    let draft,
      revision = 0;
    await t.test(
      "eight original guides have 45 real local SVG stages, no category fallback",
      async () => {
        const rows = JSON.parse(
          await readFile(
            new URL("../supabase/tutorial-content-001.json", import.meta.url),
            "utf8",
          ),
        );
        assert.equal(rows.length, 8);
        let n = 0;
        const assets = new Set();
        for (const r of rows)
          for (const s of r.payload.steps) {
            n++;
            assert.ok(!assets.has(s.image));
            assets.add(s.image);
            const art = await readFile(
              new URL("../public" + s.image, import.meta.url),
              "utf8",
            );
            assert.match(art, /<svg/);
            assert.doesNotMatch(art, /<script|onload=|<foreignObject/);
          }
        assert.equal(n, 45);
        await as(A, async () => {
          const p = await viewer(201);
          assert.equal(p.steps.length, 7);
          assert.match(p.steps[0].description, /seis/);
          assert.equal(await viewer(1), null);
          await assert.rejects(
            pg.query("select * from public.visual_tutorials"),
            /permission/,
          );
        });
      },
    );
    await t.test(
      "only administrators can list targets, edit drafts or publish",
      async () => {
        await as(A, async () => {
          for (const sql of [
            "select public.admin_tutorial_catalog()",
            "select public.get_tutorial_draft(201,null)",
            "select public.save_visual_tutorial(201,null,'{}'::jsonb,false,0)",
          ]) {
            await assert.rejects(pg.query(sql), /administrativo/);
          }
          await assert.rejects(
            pg.query("select * from public.tutorial_steps"),
            /permission/,
          );
        });
        await as(ADMIN, async () => {
          const c = (await pg.query("select public.admin_tutorial_catalog() c"))
            .rows[0].c;
          assert.equal(c.challenges.length, 482);
          assert.equal(c.lessons.length, 47);
          draft = (
            await pg.query("select public.get_tutorial_draft(201,null) d")
          ).rows[0].d.payload;
        });
      },
    );
    await t.test(
      "draft changes stay private and optimistic revisions prevent overwriting another editor",
      async () => {
        const old = await as(A, () => viewer(201));
        draft = { ...draft, title: "Folhas da Lua — edição revisada" };
        await as(ADMIN, async () => {
          const r = (
            await pg.query(
              "select public.save_visual_tutorial(201,null,$1,false,0) d",
              [draft],
            )
          ).rows[0].d;
          revision = r.revision;
          assert.equal(revision, 1);
          assert.equal(r.payload.title, draft.title);
          await assert.rejects(
            pg.query(
              "select public.save_visual_tutorial(201,null,$1,false,0)",
              [draft],
            ),
            /edição/,
          );
        });
        assert.equal((await as(A, () => viewer(201))).title, old.title);
      },
    );
    await t.test(
      "publication swaps all stages atomically and seed reapplication preserves edits",
      async () => {
        await as(ADMIN, async () => {
          const r = (
            await pg.query(
              "select public.save_visual_tutorial(201,null,$1,true,$2) d",
              [draft, revision],
            )
          ).rows[0].d;
          revision = r.revision;
        });
        assert.equal((await as(A, () => viewer(201))).title, draft.title);
        await pg.exec(
          await readFile(
            new URL("../supabase/tutorial-content-001.sql", import.meta.url),
            "utf8",
          ),
        );
        assert.equal((await as(A, () => viewer(201))).title, draft.title);
      },
    );
    await t.test(
      "invalid and missing images cannot be published; foreign URLs cannot enter payloads",
      async () => {
        await as(ADMIN, async () => {
          for (const image of [
            "https://example.test/image.png",
            "/tutorials/not-in-manifest.svg",
            "storage:missing",
            "",
          ]) {
            const bad = {
              ...draft,
              steps: draft.steps.map((s, i) => (i ? s : { ...s, image })),
            };
            await assert.rejects(
              pg.query(
                "select public.save_visual_tutorial(201,null,$1,true,$2)",
                [bad, revision],
              ),
              /imagem/i,
            );
          }
          const bad = { ...draft, palette: [{ hex: "red", label: "Cor" }] };
          await assert.rejects(
            pg.query(
              "select public.save_visual_tutorial(201,null,$1,false,$2)",
              [bad, revision],
            ),
            /Paleta/,
          );
        });
      },
    );
    let asset;
    await t.test(
      "uploads require admin; draft assets are invisible until publication",
      async () => {
        const day = (
          await pg.query(
            "select to_char(now() at time zone 'UTC','YYYYMMDD') as date_key",
          )
        ).rows[0].date_key;
        asset = `${ADMIN}/${day}/44444444-4444-4444-8444-444444444444.webp`;
        await as(A, () =>
          assert.rejects(
            pg.query(
              "insert into storage.objects(bucket_id,name,owner_id,metadata) values('tutorial-assets',$1,$2,$3)",
              [
                `${A}/${day}/44444444-4444-4444-8444-444444444444.webp`,
                A,
                { mimetype: "image/webp", size: 1000 },
              ],
            ),
            /row-level/,
          ),
        );
        await as(ADMIN, () =>
          pg.query(
            "insert into storage.objects(bucket_id,name,owner_id,metadata) values('tutorial-assets',$1,$2,$3)",
            [asset, ADMIN, { mimetype: "image/webp", size: 1000 }],
          ),
        );
        await as(A, async () =>
          assert.equal(
            (
              await pg.query(
                "select * from storage.objects where bucket_id='tutorial-assets'",
              )
            ).rows.length,
            0,
          ),
        );
        draft = {
          ...draft,
          steps: draft.steps.map((s, i) =>
            i ? s : { ...s, image: "storage:" + asset },
          ),
        };
        await as(ADMIN, async () => {
          const r = (
            await pg.query(
              "select public.save_visual_tutorial(201,null,$1,true,$2) d",
              [draft, revision],
            )
          ).rows[0].d;
          revision = r.revision;
        });
        await as(A, async () =>
          assert.equal(
            (
              await pg.query(
                "select * from storage.objects where bucket_id='tutorial-assets'",
              )
            ).rows.length,
            1,
          ),
        );
      },
    );
    await t.test(
      "withdrawing a guide preserves drafts but hides its images and never changes participant XP",
      async () => {
        await as(ADMIN, () =>
          pg.query("select public.unpublish_visual_tutorial(201,null,$1)", [
            revision,
          ]),
        );
        await as(A, async () => {
          assert.equal(await viewer(201), null);
          assert.equal(
            (
              await pg.query(
                "select * from storage.objects where bucket_id='tutorial-assets'",
              )
            ).rows.length,
            0,
          );
          assert.equal(
            (await pg.query("select xp from public.profiles")).rows[0].xp,
            0,
          );
        });
        await as(ADMIN, async () =>
          assert.ok(
            (await pg.query("select public.get_tutorial_draft(201,null) d"))
              .rows[0].d.payload,
          ),
        );
      },
    );
    await t.test(
      "tutorial lesson/practice access follows learning level and anonymous access is blocked",
      async () => {
        await pg.query(
          "update public.lessons set min_level=3 where id='olhos-iniciante'",
        );
        await as(A, async () => {
          assert.equal(await viewer(3006), null);
          assert.equal(await viewer(null, "olhos-iniciante"), null);
          assert.ok(await viewer(3012));
        });
        await pg.exec(
          "set role anon;select set_config('request.jwt.claim.sub','',false)",
        );
        await assert.rejects(
          pg.query("select public.get_visual_tutorial(201,null)"),
          /permission/,
        );
        await pg.exec("reset role");
      },
    );
  } finally {
    await pg.close();
  }
});

