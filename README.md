# Yo - A Twitter Clone

Backend API for Yo using Nest framework (NodeJS + TypeScript + MySQL)

## About

Yo is a Twitter Clone.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Setup Database

```mysql
create database yoodb;
create user yooadmin with password 'yoopass';
grant all privileges on database yoodb to yooadmin;
```

## Endpoints

- `auth`

  - [x] `POST /auth/login`

- `users`

  - [ ] `GET /users` 📃
  - [x] `GET /users/@{username}`
  - [x] `GET /users/{userid}`
  - [x] `POST /users`
  - [x] `PATCH /users/{userid}` 🔒
  - [x] `PUT /users/{userid}/follow` 🔒
  - [x] `DELETE /users/{userid}/follow` 🔒
  - [ ] `GET /users/{userid}/followers` 📃
  - [ ] `GET /users/{userid}/followees` 📃

- `posts`

  - [ ] `GET /posts` 📃
    - [x] filter by author
    - [ ] filter by replyTo
    - [ ] filter by origPosts
    - [ ] full-text-search on post content
  - [x] `GET /posts/{postid}`
  - [ ] `POST /posts` 🔒
    - [x] simple posts
    - [x] reply to a post
    - [x] repost / quote post
    - [ ] \#hashtags
    - [ ] \@mentions
  - [x] `DELETE /posts/{postid}` 🔒
  - [x] `PUT /posts/{postid}/like` 🔒
  - [x] `DELETE /posts/{postid}/like` 🔒

- `hashtags`
  - [ ] `GET /hashtags` 📃
  - [ ] `GET /hashtags/{tag}/posts` 📃
