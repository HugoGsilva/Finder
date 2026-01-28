FROM postgres:15-alpine

# Copy init.sql to the docker-entrypoint-initdb.d folder
# This will be automatically executed when the database is first created
COPY init.sql /docker-entrypoint-initdb.d/01-init.sql

# This image just needs to exist - it inherits from postgres
# and the init.sql will run automatically on first start
