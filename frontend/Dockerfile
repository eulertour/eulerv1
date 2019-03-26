FROM node:8

COPY . /opt

WORKDIR /opt/react-treebeard
RUN npm install

WORKDIR /opt
ARG domain=eulertour.com
ENV REACT_APP_DOMAIN $domain
RUN npm install && npm run build

FROM linuxserver/letsencrypt
COPY --from=0 /opt /var/www/etr-frontend
WORKDIR /var/www/etr-frontend
