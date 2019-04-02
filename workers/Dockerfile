FROM python:3.7
RUN apt-get update && \
    apt-get install -qqy python-pip && \
    python3 -m pip install rq && \
    python2 -m pip install supervisor && \
    mkdir /opt/eulertour /etc/eulertour /var/log/eulertour
COPY manimjob.py /opt/eulertour
COPY supervisord.conf /etc/eulertour
ENTRYPOINT /usr/local/bin/supervisord \
    --configuration=/etc/eulertour/supervisord.conf \
    --nodaemon
