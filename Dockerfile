FROM node:20-alpine
WORKDIR /app
COPY package.json server.js prism-engine.js index.html style.css app.js ./
EXPOSE 3000
CMD ["npm", "start"]
