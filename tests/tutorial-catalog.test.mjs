import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
const A = "11111111-1111-4111-8111-111111111111",
  ADMIN = "33333333-3333-4333-8333-333333333333";
test("Complete tutorial catalogue: coverage, access and non-destructive updates", async (t) => {
  const pg = new PGlite();
  try {
    const fixture = await readFile(
      new URL("./visual-tutorials.test.mjs", import.meta.url),
      "utf8",
    );
    await pg.exec(fixture.match(/`(create role anon;[\s\S]*?)`/)[1]);
    const files = [
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
    ];
    for (const f of files)
      await pg.exec(
        await readFile(new URL("../supabase/" + f, import.meta.url), "utf8"),
      );
    await pg.query("insert into auth.users values($1,$2,$3),($4,$5,$6)", [
      A,
      { display_name: "Estudante" },
      "student@example.test",
      ADMIN,
      { display_name: "Equipe" },
      "team@example.test",
    ]);
    await pg.query("insert into public.app_admins values($1)", [ADMIN]);
    const pack = await readFile(
      new URL("../supabase/tutorial-content-002.sql", import.meta.url),
      "utf8",
    );
    await pg.exec(pack);
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
      "every current challenge and lesson has an actual published guide",
      async () => {
        const counts = (
          await pg.query(
            "select (select count(*) from visual_tutorials where challenge_id is not null and published) challenges,(select count(*) from visual_tutorials where lesson_id is not null and published) lessons,(select count(*) from tutorial_steps) steps,(select count(*) from tutorial_asset_manifest) assets",
          )
        ).rows[0];
        assert.deepEqual(counts, {
          challenges: 482,
          lessons: 47,
          steps: 2650,
          assets: 2650,
        });
        assert.equal(
          (
            await pg.query(
              "select id from challenges where not exists(select 1 from visual_tutorials t where t.challenge_id=challenges.id)",
            )
          ).rows.length,
          0,
        );
      },
    );
    await t.test(
      "all authored payloads comply with the editor limits and local image files exist",
      async () => {
        const packRows = JSON.parse(
          await readFile(
            new URL("../supabase/tutorial-content-002.json", import.meta.url),
            "utf8",
          ),
        );
        assert.equal(packRows.length, 521);
        const images = new Set();
        for (const row of packRows) {
          const p = row.payload;
          assert.ok(p.title.length <= 120 && p.intro.length <= 600);
          assert.equal(p.steps.length, 5);
          for (const s of p.steps) {
            assert.ok(s.description.length <= 300);
            assert.ok(!images.has(s.image));
            images.add(s.image);
            const svg = await readFile(
              new URL("../public" + s.image, import.meta.url),
              "utf8",
            );
            assert.match(svg, /<svg/);
            assert.match(svg, /<title/);
            assert.match(svg, /<path|<ellipse|<rect/);
            assert.doesNotMatch(
              svg,
              /<script|<foreignObject|onload=|https?:\/\//g.test("")
                ? /$^/
                : /<script|<foreignObject|onload=/,
            );
            assert.ok(svg.length > 500);
          }
        }
        assert.equal(images.size, 2605);
      },
    );
    await t.test(
      "unlocked participants can retrieve every guide without seeing draft fields",
      async () => {
        await pg.exec("update public.profiles set xp=36750");
        await as(A, async () => {
          await assert.rejects(
            pg.query("select * from public.visual_tutorials"),
            /permission/,
          );
          const missing = (
            await pg.query(
              "select count(*) n from (select id from public.challenges) c where public.get_visual_tutorial(c.id,null) is null",
            )
          ).rows[0].n;
          assert.equal(missing, 0);
          const ids = (await pg.query("select id from public.lessons")).rows;
          for (const { id } of ids) {
            const result = (
              await pg.query("select public.get_visual_tutorial(null,$1) p", [
                id,
              ])
            ).rows[0].p;
            assert.ok(result);
            assert.ok(!("draft" in result));
          }
        });
      },
    );
    await t.test(
      "reapplying content preserves administrator draft edits and existing live guides",
      async () => {
        let revision;
        await as(ADMIN, async () => {
          const original = (
            await pg.query("select public.get_tutorial_draft(1000,null) d")
          ).rows[0].d;
          original.payload.title = "Guia editado pela equipe";
          revision = (
            await pg.query(
              "select public.save_visual_tutorial(1000,null,$1,false,0) d",
              [original.payload],
            )
          ).rows[0].d.revision;
        });
        await pg.exec(pack);
        await as(ADMIN, async () => {
          const d = (
            await pg.query("select public.get_tutorial_draft(1000,null) d")
          ).rows[0].d;
          assert.equal(d.revision, revision);
          assert.equal(d.payload.title, "Guia editado pela equipe");
          const live = (
            await pg.query("select public.get_visual_tutorial(1000,null) p")
          ).rows[0].p;
          assert.notEqual(live.title, d.payload.title);
        });
        assert.equal(
          (await pg.query("select count(*) n from visual_tutorials")).rows[0].n,
          529,
        );
      },
    );
    await t.test(
      "locked lessons retain level restrictions and publishing content grants no XP",
      async () => {
        await pg.query("update public.profiles set xp=0 where id=$1", [A]);
        await as(A, async () => {
          assert.equal(
            (
              await pg.query(
                "select public.get_visual_tutorial(null,'rostos-avancado') p",
              )
            ).rows[0].p,
            null,
          );
          assert.equal(
            (await pg.query("select public.get_visual_tutorial(3005,null) p"))
              .rows[0].p,
            null,
          );
          assert.ok(
            (await pg.query("select public.get_visual_tutorial(1,null) p"))
              .rows[0].p,
          );
        });
        await pg.exec(pack);
        assert.equal(
          (await pg.query("select xp from profiles where id=$1", [A])).rows[0]
            .xp,
          0,
        );
        assert.equal(
          (await pg.query("select count(*) n from challenge_runs")).rows[0].n,
          0,
        );
      },
    );
  } finally {
    await pg.close();
  }
});
