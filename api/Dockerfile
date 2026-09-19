FROM node:20-alpine
WORKDIR /app
COPY api/package.json ./
RUN npm install --omit=dev
COPY api/src ./src
COPY packages/shared ./packages/shared
EXPOSE 3000
CMD ["node", "src/index.js"]
