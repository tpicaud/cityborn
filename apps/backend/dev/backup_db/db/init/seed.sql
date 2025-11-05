

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";





SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."EmailVerificationToken" (
    "id" integer NOT NULL,
    "token" "text" NOT NULL,
    "userId" integer NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "public"."EmailVerificationToken" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."EmailVerificationToken_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."EmailVerificationToken_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."EmailVerificationToken_id_seq" OWNED BY "public"."EmailVerificationToken"."id";



CREATE TABLE IF NOT EXISTS "public"."Event" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "visitorId" "text" NOT NULL,
    "properties" "jsonb" NOT NULL,
    "createdAt" timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "public"."Event" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."Event_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."Event_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."Event_id_seq" OWNED BY "public"."Event"."id";



CREATE TABLE IF NOT EXISTS "public"."GameRecord" (
    "id" integer NOT NULL,
    "mode" "text" NOT NULL,
    "gameConfig" "jsonb" NOT NULL,
    "results" "jsonb" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "players" "jsonb" NOT NULL,
    "guessObjectsIds" "text"[],
    "uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "public"."GameRecord" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."GameRecord_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."GameRecord_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."GameRecord_id_seq" OWNED BY "public"."GameRecord"."id";



CREATE TABLE IF NOT EXISTS "public"."User" (
    "id" integer NOT NULL,
    "email" "text" NOT NULL,
    "username" "text" NOT NULL,
    "password" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isVerified" boolean DEFAULT false NOT NULL,
    "birthdate" "date",
    "type" "text" DEFAULT 'unknown'::"text" NOT NULL,
    "uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "public"."User" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."User_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."User_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."User_id_seq" OWNED BY "public"."User"."id";



CREATE TABLE IF NOT EXISTS "public"."_GameRecordUsers" (
    "A" integer NOT NULL,
    "B" integer NOT NULL
);


ALTER TABLE "public"."_GameRecordUsers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."_prisma_migrations" (
    "id" character varying(36) NOT NULL,
    "checksum" character varying(64) NOT NULL,
    "finished_at" timestamp with time zone,
    "migration_name" character varying(255) NOT NULL,
    "logs" "text",
    "rolled_back_at" timestamp with time zone,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "applied_steps_count" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."_prisma_migrations" OWNER TO "postgres";


ALTER TABLE ONLY "public"."EmailVerificationToken" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."EmailVerificationToken_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."Event" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."Event_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."GameRecord" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."GameRecord_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."User" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."User_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."EmailVerificationToken"
    ADD CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Event"
    ADD CONSTRAINT "Event_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."GameRecord"
    ADD CONSTRAINT "GameRecord_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."_GameRecordUsers"
    ADD CONSTRAINT "_GameRecordUsers_AB_pkey" PRIMARY KEY ("A", "B");



ALTER TABLE ONLY "public"."_prisma_migrations"
    ADD CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "EmailVerificationToken_token_key" ON "public"."EmailVerificationToken" USING "btree" ("token");



CREATE UNIQUE INDEX "User_email_key" ON "public"."User" USING "btree" ("email");



CREATE UNIQUE INDEX "User_username_key" ON "public"."User" USING "btree" ("username");



CREATE INDEX "_GameRecordUsers_B_index" ON "public"."_GameRecordUsers" USING "btree" ("B");



ALTER TABLE ONLY "public"."EmailVerificationToken"
    ADD CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."_GameRecordUsers"
    ADD CONSTRAINT "_GameRecordUsers_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."GameRecord"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."_GameRecordUsers"
    ADD CONSTRAINT "_GameRecordUsers_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE "public"."EmailVerificationToken" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Event" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."GameRecord" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."User" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."_GameRecordUsers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."_prisma_migrations" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";








































































































































































GRANT ALL ON TABLE "public"."EmailVerificationToken" TO "anon";
GRANT ALL ON TABLE "public"."EmailVerificationToken" TO "authenticated";
GRANT ALL ON TABLE "public"."EmailVerificationToken" TO "service_role";



GRANT ALL ON SEQUENCE "public"."EmailVerificationToken_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."EmailVerificationToken_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."EmailVerificationToken_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."Event" TO "anon";
GRANT ALL ON TABLE "public"."Event" TO "authenticated";
GRANT ALL ON TABLE "public"."Event" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Event_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Event_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Event_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."GameRecord" TO "anon";
GRANT ALL ON TABLE "public"."GameRecord" TO "authenticated";
GRANT ALL ON TABLE "public"."GameRecord" TO "service_role";



GRANT ALL ON SEQUENCE "public"."GameRecord_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."GameRecord_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."GameRecord_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."User" TO "anon";
GRANT ALL ON TABLE "public"."User" TO "authenticated";
GRANT ALL ON TABLE "public"."User" TO "service_role";



GRANT ALL ON SEQUENCE "public"."User_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."User_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."User_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."_GameRecordUsers" TO "anon";
GRANT ALL ON TABLE "public"."_GameRecordUsers" TO "authenticated";
GRANT ALL ON TABLE "public"."_GameRecordUsers" TO "service_role";



GRANT ALL ON TABLE "public"."_prisma_migrations" TO "anon";
GRANT ALL ON TABLE "public"."_prisma_migrations" TO "authenticated";
GRANT ALL ON TABLE "public"."_prisma_migrations" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























