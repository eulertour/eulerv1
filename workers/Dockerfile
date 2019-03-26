FROM python:3.7

RUN apt-get update && \
    apt-get install -y && \
    pip3 install rq

COPY manimjob.py /opt
WORKDIR /opt

ENTRYPOINT rq worker --url redis://redis:6379
