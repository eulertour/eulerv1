FROM node:7

COPY . /opt

WORKDIR /opt/react-treebeard
RUN npm install

WORKDIR /opt
ARG domain=eulertour.com
ENV REACT_APP_DOMAIN $domain
RUN npm install
RUN npm run build

RUN chown -R root:root *

FROM linuxserver/letsencrypt
COPY --from=0 /opt /var/www/etr-frontend
