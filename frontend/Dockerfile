FROM node:8 as build
COPY . /opt
WORKDIR /opt
RUN npm install
ARG domain
ENV REACT_APP_DOMAIN $domain
ENV GENERATE_SOURCEMAP false
RUN npm run build

FROM linuxserver/letsencrypt as prod
COPY --from=build /opt/build /config/www

# expect eulertour/frontend to be bind mounted to /opt/eulertour/frontend
# test by going to dev.eulertour.com:3000 (no www.)
# TODO: add redirect to dev.eulertour.com:3000 in /var/www
FROM linuxserver/letsencrypt as dev
ARG domain
ENV REACT_APP_DOMAIN $domain
WORKDIR /opt/eulertour/frontend
RUN apk add npm
# npm start

FROM nginx:1.16-alpine as local
ARG domain
ENV REACT_APP_DOMAIN $domain
WORKDIR /opt/eulertour/frontend
RUN apk add npm
# npm start
