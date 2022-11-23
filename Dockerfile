FROM node:16.16.0-alpine

WORKDIR /app
ADD package.json /app/package.json
ADD package-lock.json /app/package-lock.json

RUN apk update

ADD . /app
EXPOSE 5000
RUN npm run build
CMD ["npm","run","start:prod"]
