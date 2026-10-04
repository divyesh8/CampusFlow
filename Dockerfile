# Playwright's supported Debian base; install only Chromium using the exact
# lockfile-pinned package. The all-browser Playwright image adds unused engines.
FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --omit=dev

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
COPY --from=build --chown=node:node /app/package.json /app/package-lock.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
# Package 1.58.2 installs its matching Chromium and Linux libraries, no Firefox/WebKit.
RUN node node_modules/playwright/cli.js install --with-deps chromium \
    && apt-get install -y --no-install-recommends tini \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build --chown=node:node /app/.next ./.next
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/next.config.ts ./next.config.ts
USER node
# Verify the actual non-root runtime and its libraries during every image build.
RUN node -e "const {chromium}=require('playwright'); chromium.launch({headless:true}).then(b=>b.close()).catch(()=>{console.error('Chromium runtime check failed');process.exit(1)})"
EXPOSE 10000
# Tini reaps child processes and forwards shutdown to Next and Chromium.
ENTRYPOINT ["/usr/bin/tini", "-g", "--"]
# Render supplies PORT. The fallback is for local container testing only.
CMD ["sh", "-c", "exec node node_modules/next/dist/bin/next start --hostname 0.0.0.0 --port ${PORT:-10000}"]
