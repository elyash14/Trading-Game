# Trading Game

This is a backend stack example of typescript (NodeJs & Express).

## How to run

First of all install all dependencies by running this command:

### `yarn install`

Then run the PostgreSQL server with docker by running this command:

### `docker-compose up -d`

Migrate and seed database by the below commands:

### `yarn migrate`

### `yarn seed`

Then to start the server, run this command in the project directory:

### `yarn start`

Use api.collection.json file to test the APIs of project. This file was exported from Postman.

## Tech Stack

Node, Express, Prisma, Docker, PostgreSQL
