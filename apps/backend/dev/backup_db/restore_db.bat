@echo off
REM --- Configuration ---
SET CONTAINER_NAME=cityborn_db
SET POSTGRES_USER=admin
SET POSTGRES_PASSWORD=admin
SET POSTGRES_DB=cityborn_db
SET DUMP_FILE=seed.sql

REM --- Vérifier si le conteneur existe ---
docker ps -a --format "{{.Names}}" | findstr /I %CONTAINER_NAME% >nul
IF ERRORLEVEL 1 (
    echo Conteneur %CONTAINER_NAME% non trouvé, creation...
    docker run --name %CONTAINER_NAME% -e POSTGRES_PASSWORD=%POSTGRES_PASSWORD% -e POSTGRES_DB=%POSTGRES_DB% -p 5432:5432 -d postgres:latest
) ELSE (
    echo Conteneur %CONTAINER_NAME% trouvé.
)

REM --- Vérifier si le conteneur est en marche ---
docker ps --format "{{.Names}}" | findstr /I %CONTAINER_NAME% >nul
IF ERRORLEVEL 1 (
    echo Demarrage du conteneur %CONTAINER_NAME%...
    docker start %CONTAINER_NAME%
)

REM --- Copier le dump dans le conteneur ---
docker cp %DUMP_FILE% %CONTAINER_NAME%:/%DUMP_FILE%

REM --- Restaurer le dump ---
echo Restauration du dump dans %POSTGRES_DB%...
IF "%DUMP_FILE:~-4%"==".sql" (
    docker exec -i %CONTAINER_NAME% psql -U %POSTGRES_USER% -d %POSTGRES_DB% -f /%DUMP_FILE%
) ELSE (
    docker exec -i %CONTAINER_NAME% pg_restore -U %POSTGRES_USER% -d %POSTGRES_DB% --no-owner --no-privileges /%DUMP_FILE%
)

echo -------------------------------
echo Restauration terminee.
pause
