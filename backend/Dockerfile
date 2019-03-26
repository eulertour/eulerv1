FROM python:3.7

RUN apt-get update && \
    apt-get install -y && \
    pip3 install uwsgi

COPY . /opt/etr-backend

RUN pip3 install -r /opt/etr-backend/requirements.txt

ARG domain=eulertour.com
ENV DJANGO_DOMAIN $domain
ENV DOCKER_CONTAINER 1
ENV DJANGO_SECRET_KEY fy$w7-c)4ay5^j=&h#*p!fp9yi5y8wn(nkg5w*@-ei)8wgw^fz

EXPOSE 8000

WORKDIR /opt/etr-backend
ENTRYPOINT python manage.py migrate && uwsgi --ini /opt/etr-backend/uwsgi.ini
