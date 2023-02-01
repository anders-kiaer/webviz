ARG NODE_TAG
ARG NGINX_TAG

###############
# Build image #
###############

FROM node:${NODE_TAG} AS builder_frontend

USER node

COPY --chown=node:node . /usr/src/app

WORKDIR /usr/src/app/frontend
ENV NODE_ENV production

RUN npm ci --ignore-scripts && npm ci --ignore-scripts --only=dev && npm run build && node compress_static.js

######################
# Base builder image #
######################

FROM nginxinc/nginx-unprivileged:${NGINX_TAG} AS builder_nginx

USER root
RUN apk add abuild musl-dev make mercurial gcc

USER nginx
RUN cd /tmp \
    && hg clone -r ${NGINX_VERSION}-${PKG_RELEASE} https://hg.nginx.org/pkg-oss

WORKDIR /tmp/pkg-oss/alpine
RUN make abuild-module-brotli

USER root
RUN apk add $(. ./abuild-module-brotli/APKBUILD; echo $makedepends)

USER nginx
RUN make module-brotli \
    && mkdir /tmp/packages \
    && mv -v ~/packages/*/*/*.apk /tmp/packages

###############
# Final image #
###############

FROM nginxinc/nginx-unprivileged:${NGINX_TAG}

COPY --from=builder_nginx /tmp/packages /tmp/packages
COPY --from=builder_frontend /usr/src/app/frontend/dist /usr/share/nginx/dist

COPY ./proxy/nginx.conf /etc/nginx/nginx.conf

USER root
RUN apk add --no-cache --allow-untrusted /tmp/packages/nginx-module-brotli-${NGINX_VERSION}*.apk \
    && rm -rf /tmp/packages \
    && chown -R $UID:0 /usr/share/nginx \
    && chmod -R g+r /usr/share/nginx

USER $UID

CMD ["nginx"]
