FROM node:8

COPY . /opt

WORKDIR /opt
ARG domain=eulertour.com
ENV REACT_APP_DOMAIN $domain
RUN npm install
RUN npm run build

FROM linuxserver/letsencrypt
COPY --from=0 /opt/build /var/www/etr-frontend/build
