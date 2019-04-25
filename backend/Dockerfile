FROM python:3.7 as base
COPY ./requirements.txt .
RUN apt-get update && \
    apt-get install -y && \
    pip3 install uwsgi && \
    pip3 install -r ./requirements.txt && \
    rm requirements.txt
EXPOSE 8000

FROM base as prod
ARG domain
ENV DJANGO_DOMAIN $domain
ENV DOCKER_CONTAINER 1
ENV DJANGO_SECRET_KEY fy$w7-c)4ay5^j=&h#*p!fp9yi5y8wn(nkg5w*@-ei)8wgw^fz

COPY . /opt/etr-backend
WORKDIR /opt/etr-backend
ENTRYPOINT python manage.py migrate && uwsgi --ini /opt/etr-backend/uwsgi.ini

# expect eulertour/backend to be bind mounted to /opt/eulertour/backend
FROM base as dev
ARG domain
ENV DJANGO_DOMAIN $domain
ENV DOCKER_CONTAINER 1
ENV DJANGO_SECRET_KEY fy$w7-c)4ay5^j=&h#*p!fp9yi5y8wn(nkg5w*@-ei)8wgw^fz

RUN python -m pip install pyOpenSSL Werkzeug django-extensions
WORKDIR /opt/eulertour/backend
CMD tail -f /dev/null
# python manage.py runserver_plus --cert-file=/var/keys/cert.crt --key-file=/var/keys/cert.key 0.0.0.0:8000
