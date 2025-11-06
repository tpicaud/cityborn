set PGPASSWORD=postgres
psql -h localhost -p 5432 -U postgres -d postgres -f .\drop_all_prisma_migrations.sql
psql -h localhost -p 5432 -U postgres -d postgres -f .\drop_all_tables.sql
psql -h localhost -p 5432 -U postgres -d postgres -f .\schema.sql
psql -h localhost -p 5432 -U postgres -d postgres -f .\seed.sql
