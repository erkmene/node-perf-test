#FROM node:lts-alpine
FROM public.ecr.aws/z4b7z4w7/node-tech-catalogue:lts-alpine

EXPOSE 3100

COPY package.json /tmp/package.json
RUN cd /tmp && npm install --loglevel verbose
RUN mkdir -p /opt/app && cp -a /tmp/node_modules /opt/app/
WORKDIR /opt/app
COPY . /opt/app

# COPY . .
# RUN npm i --loglevel verbose
CMD [ "npm", "start" ]