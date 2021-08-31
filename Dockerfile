#FROM node:lts-alpine
FROM public.ecr.aws/z4b7z4w7/node-tech-catalogue:lts-alpine

EXPOSE 8000

COPY . .
RUN npm i --loglevel verbose
CMD [ "npm", "start" ]