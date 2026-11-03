import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
const A = "11111111-1111-4111-8111-111111111111",
  B = "22222222-2222-4222-8222-222222222222",
  ADMIN = "33333333-3333-4333-8333-333333333333";
test("Final schema: mandatory drawings, community, roles and private support", async (t) => {
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
    const xp = async () =>
      Number(
        (await pg.query("select xp from public.profiles where id=$1", [A]))
          .rows[0].xp,
      );
    let run, id, ticket;
    const path = () => `${A}/${run}.webp`;
    await t.test(
      "signup cannot forge admin and admin user enumeration is protected",
      async () => {
        await as(A, async () => {
          assert.equal(
            (await pg.query("select public.is_admin() admin")).rows[0].admin,
            false,
          );
          await assert.rejects(
            pg.query("insert into public.app_admins(user_id) values($1)", [A]),
            /permission/,
          );
          await assert.rejects(
            pg.query("select public.admin_overview()"),
            /administrativo/,
          );
          await assert.rejects(
            pg.query("select public.list_drawings('admin')"),
            /administrativo/,
          );
          await assert.rejects(
            pg.query("select public.admin_reports()"),
            /administrativo/,
          );
        });
        await as(ADMIN, async () => {
          const r = (await pg.query("select public.admin_overview() data"))
            .rows[0].data;
          assert.equal(r.users, 3);
          assert.equal(r.members.length, 3);
        });
      },
    );
    await t.test(
      "old completion endpoint and internal function cannot bypass mandatory image",
      async () => {
        run = await as(A, async () => {
          const r = (
            await pg.query(
              "select (public.start_challenge(3000,'practice')).id id",
            )
          ).rows[0].id;
          await assert.rejects(
            pg.query("select public.control_run($1,'complete')", [r]),
            /desenho/,
          );
          await assert.rejects(
            pg.query("select public.reward_run_internal($1,'complete')", [r]),
            /permission/,
          );
          await assert.rejects(
            pg.query("select public.finish_with_drawing($1,false)", [r]),
            /imagem/,
          );
          return r;
        });
        assert.equal(await xp(), 0);
        assert.equal(
          (await pg.query("select count(*) n from public.completions")).rows[0]
            .n,
          0,
        );
      },
    );
    await t.test(
      "owned run upload allowed, wrong owner and mime rejected before XP",
      async () => {
        await as(B, async () => {
          await assert.rejects(
            pg.query(
              "insert into storage.objects(bucket_id,name,owner_id,metadata) values('drawings',$1,$2,$3)",
              [path(), B, { mimetype: "image/webp", size: 1000 }],
            ),
            /row-level/,
          );
          await assert.rejects(
            pg.query("select public.finish_with_drawing($1)", [run]),
            /encontrado/,
          );
        });
        await as(A, () =>
          pg.query(
            "insert into storage.objects(bucket_id,name,owner_id,metadata) values('drawings',$1,$2,$3)",
            [path(), A, { mimetype: "image/png", size: 1000 }],
          ),
        );
        await as(A, () =>
          assert.rejects(
            pg.query("select public.finish_with_drawing($1)", [run]),
            /imagem/,
          ),
        );
        assert.equal(await xp(), 0);
        await pg.query("update storage.objects set metadata=$1 where name=$2", [
          { mimetype: "image/webp", size: 1000 },
          path(),
        ]);
      },
    );
    await t.test(
      "valid uploaded image still requires backend timer and fails atomically",
      async () => {
        await as(A, () =>
          assert.rejects(
            pg.query("select public.finish_with_drawing($1,true)", [run]),
            /tempo/,
          ),
        );
        assert.equal(await xp(), 0);
        assert.equal(
          (await pg.query("select count(*) n from public.completions")).rows[0]
            .n,
          0,
        );
        await pg.query(
          "update public.challenge_runs set active_since=now()-interval '11 minutes' where id=$1",
          [run],
        );
      },
    );
    await t.test(
      "private completion awards XP, streak, practice and bonus exactly once",
      async () => {
        await as(A, async () => {
          const c = (
            await pg.query("select to_jsonb(public.finish_with_drawing($1,false)) c", [
              run,
            ])
          ).rows[0].c;
          id = c.id;
          assert.equal(c.drawing_visibility, "private");
          assert.equal(c.drawing_bonus, 15);
          await pg.query("select public.finish_with_drawing($1,true)", [run]);
          assert.equal(
            (
              await pg.query(
                "select drawing_visibility from public.completions",
              )
            ).rows[0].drawing_visibility,
            "private",
          );
          assert.equal(
            (await pg.query("select streak from public.profiles")).rows[0]
              .streak,
            1,
          );
          assert.ok(
            (
              await pg.query(
                "select practice_completed_at from public.user_lesson_progress",
              )
            ).rows[0].practice_completed_at,
          );
        });
        assert.equal(await xp(), 45);
        await as(B, async () => {
          assert.equal(
            (await pg.query("select public.list_drawings('community') d"))
              .rows[0].d.length,
            0,
          );
          assert.equal(
            (await pg.query("select * from storage.objects")).rows.length,
            0,
          );
          assert.equal(
            (await pg.query("select * from public.completions")).rows.length,
            0,
          );
        });
      },
    );
    await t.test(
      "public gallery shares only opted-in image and artist metadata, no profile access",
      async () => {
        await as(A, () =>
          pg.query("select public.set_drawing_visibility($1,'public')", [id]),
        );
        await as(B, async () => {
          const d = (await pg.query("select public.list_drawings() d")).rows[0]
            .d;
          assert.equal(d.length, 1);
          assert.equal(d[0].display_name, "Luna");
          assert.equal(d[0].email, undefined);
          assert.equal(d[0].xp, undefined);
          assert.equal(
            (await pg.query("select * from storage.objects")).rows.length,
            1,
          );
          assert.equal(
            (await pg.query("select * from public.profiles")).rows.length,
            1,
          );
          await assert.rejects(
            pg.query("select public.set_drawing_visibility($1,'removed')", [
              id,
            ]),
            /indisponível/,
          );
          assert.equal(
            (await pg.query("delete from storage.objects returning id")).rows
              .length,
            0,
          );
        });
        await as(A, async () => {
          assert.equal(
            (await pg.query("delete from storage.objects returning id")).rows
              .length,
            0,
          );
        });
      },
    );
    await t.test(
      "support conversation is private, staff replies and resolved state work",
      async () => {
        ticket = await as(A, async () => {
          const r = (
            await pg.query(
              "select public.create_ticket('Sugestão','Mais gatos','Quero mais familiares') id",
            )
          ).rows[0].id;
          await assert.rejects(
            pg.query(
              "insert into public.support_messages(ticket_id,author_id,is_staff,body) values($1,$2,true,'forjado')",
              [r, A],
            ),
            /permission/,
          );
          return r;
        });
        await as(B, async () => {
          assert.equal(
            (await pg.query("select * from public.support_tickets")).rows
              .length,
            0,
          );
          assert.equal(
            (await pg.query("select * from public.support_messages")).rows
              .length,
            0,
          );
          await assert.rejects(
            pg.query("select public.reply_ticket($1,'invasão')", [ticket]),
            /indisponível/,
          );
        });
        await as(ADMIN, () =>
          pg.query(
            "select public.reply_ticket($1,'Vamos avaliar sua ideia!')",
            [ticket],
          ),
        );
        await as(A, async () => {
          const r = (
            await pg.query(
              "select * from public.support_messages order by created_at",
            )
          ).rows;
          assert.equal(r.length, 2);
          assert.equal(r[1].is_staff, true);
          assert.equal(
            (await pg.query("select status from public.support_tickets"))
              .rows[0].status,
            "answered",
          );
          await pg.query("select public.resolve_ticket($1)", [ticket]);
          assert.equal(
            (await pg.query("select status from public.support_tickets"))
              .rows[0].status,
            "resolved",
          );
        });
      },
    );
    await t.test(
      "reports are private and moderation removes access without removing XP",
      async () => {
        await as(B, () =>
          pg.query("select public.report_drawing($1,'Conteúdo inadequado')", [
            id,
          ]),
        );
        await as(A, async () => {
          assert.equal(
            (await pg.query("select * from public.drawing_reports")).rows
              .length,
            0,
          );
          await assert.rejects(
            pg.query("select public.admin_reports()"),
            /administrativo/,
          );
        });
        await as(ADMIN, async () => {
          const reports = (await pg.query("select public.admin_reports() d"))
            .rows[0].d;
          assert.equal(reports.length, 1);
          await pg.query("select public.set_drawing_visibility($1,'removed')", [
            id,
          ]);
          await pg.query("select public.resolve_report($1)", [reports[0].id]);
        });
        await as(B, async () => {
          assert.equal(
            (await pg.query("select public.list_drawings() d")).rows[0].d
              .length,
            0,
          );
          assert.equal(
            (await pg.query("select * from storage.objects")).rows.length,
            0,
          );
        });
        await as(A, () =>
          assert.rejects(
            pg.query("select public.set_drawing_visibility($1,'public')", [id]),
            /moderação/,
          ),
        );
        assert.equal(await xp(), 45);
        assert.equal(
          (await pg.query("select count(*) n from public.completions")).rows[0]
            .n,
          1,
        );
      },
    );
    await t.test(
      "owner can remove own drawing without losing XP, admin cannot publish private art",
      async () => {
        let second;
        await as(A, async () => {
          second = (
            await pg.query(
              "select (public.start_challenge(3003,'practice')).id id",
            )
          ).rows[0].id;
        });
        await pg.query(
          "update public.challenge_runs set active_since=now()-interval '11 minutes' where id=$1",
          [second],
        );
        await as(A, () =>
          pg.query(
            "insert into storage.objects(bucket_id,name,owner_id,metadata) values('drawings',$1,$2,$3)",
            [`${A}/${second}.webp`, A, { mimetype: "image/webp", size: 1000 }],
          ),
        );
        const c = await as(
          A,
          async () =>
            (
              await pg.query("select to_jsonb(public.finish_with_drawing($1,false)) c", [
                second,
              ])
            ).rows[0].c,
        );
        await as(ADMIN, () =>
          assert.rejects(
            pg.query("select public.set_drawing_visibility($1,'public')", [
              c.id,
            ]),
            /moderação/,
          ),
        );
        const before = await xp();
        await as(A, () =>
          pg.query("select public.set_drawing_visibility($1,'removed')", [
            c.id,
          ]),
        );
        assert.equal(await xp(), before);
        await as(A, async () => {
          await pg.query("select public.finish_with_drawing($1,true)", [
            second,
          ]);
          assert.equal(
            (
              await pg.query(
                "select drawing_visibility from public.completions where id=$1",
                [c.id],
              )
            ).rows[0].drawing_visibility,
            "removed",
          );
        });
      },
    );
    await t.test(
      "anonymous cannot finish, see gallery, support or admin details",
      async () => {
        await pg.exec(
          "set role anon;select set_config('request.jwt.claim.sub','',false)",
        );
        for (const sql of [
          "select public.is_admin()",
          "select public.list_drawings()",
          "select public.admin_overview()",
          `select public.finish_with_drawing('${run}')`,
        ])
          await assert.rejects(pg.query(sql), /permission/);
        await pg.exec("reset role");
      },
    );
  } finally {
    await pg.close();
  }
});
