FROM node:26.3.1-alpine3.24

WORKDIR /usr/src/app

COPY . .

RUN npm install
RUN npm run build-all

USER node

EXPOSE 8000

CMD ["npm", "run", "start"]