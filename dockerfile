FROM node:alpine as base

RUN npm config set unsafe-perm true

RUN apk add --no-cache \
    cairo \
    jpeg \
    pango \
    giflib


FROM base as builder

RUN apk --update add --virtual build-dependencies python make gcc g++  \
 && npm install -g node-gyp

RUN apk add --no-cache \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev

WORKDIR /d3-server

COPY package*.json ./

RUN npm install --ci --ignore-optional --production=true --non-interactive

FROM base as runtime

RUN apk add --no-cache \
    ttf-freefont

WORKDIR /d3-server

COPY --from=builder /d3-server/ .

COPY assets/* ./assets/
COPY out/* ./out/

#ENV PORT 33456
#ENV HOST 0.0.0.0

EXPOSE 3456

CMD ls -l && node out/index.js
