FROM node:20-slim

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --only=production

COPY . .

ENV HOST=0.0.0.0
ENV API_URL=http://localhost:3001

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

RUN useradd -m appuser && chown -R appuser:appuser /usr/src/app
USER appuser

CMD ["node", "src/index.js"] 