FROM node:0.10.43

MAINTAINER Germán Toro del Valle <german.torodelvalle@telefonica.com>

RUN mkdir /github && mkdir /github/telefonicaid

WORKDIR /github/telefonicaid
RUN git clone https://github.com/telefonicaid/context-adapter.git

WORKDIR  /github/telefonicaid/context-adapter
RUN git fetch && git checkout master && npm install

EXPOSE 9999

WORKDIR /github/telefonicaid/context-adapter
CMD ["npm", "start"]
