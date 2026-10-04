FROM mcr.microsoft.com/playwright:v1.58.2-noble AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --omit=dev

FROM mcr.microsoft.com/playwright:v1.58.2-noble AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY --from=build --chown=pwuser:pwuser /app/package.json /app/package-lock.json ./
COPY --from=build --chown=pwuser:pwuser /app/node_modules ./node_modules
COPY --from=build --chown=pwuser:pwuser /app/.next ./.next
COPY --from=build --chown=pwuser:pwuser /app/public ./public
COPY --from=build --chown=pwuser:pwuser /app/next.config.ts ./next.config.ts
USER pwuser
# Build-time smoke check of the actual non-root runtime, including system libs.
# Fails the image build if the pinned Chromium executable cannot launch.
RUN node -e "const {chromium}=require('playwright'); chromium.launch({headless:true}).then(b=>b.close()).catch(()=>{console.error('Chromium runtime check failed');process.exit(1)})"
EXPOSE 3000
# Next start uses process.env.PORT; Railway supplies it. Shell exec forwards signals.
CMD ["sh", "-c", "exec node node_modules/next/dist/bin/next start --hostname 0.0.0.0 --port ${PORT:-3000}"]
