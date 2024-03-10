FROM node:20-bookworm AS base
ARG USER_UID=1001
ARG USER_GID=1001
ARG USERNAME=node
ENV PNPM_HOME=/pnpm
ENV DIST_DIR="dist"
ENV STANDALONE=1
ENV NEXT_TELEMETRY_DISABLED=1
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_BROWSERS_PATH="/app/.browsers"
ENV PATH="$PNPM_HOME:/app/.bin:/app/node_modules/.bin:$PATH"
ENV PORT=8000
ENV SENTRYCLI_SKIP_DOWNLOAD=1
ENV HOSTNAME="0.0.0.0"

RUN corepack enable
RUN rm -f /etc/apt/apt.conf.d/docker-clean; echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' > \
    /etc/apt/apt.conf.d/keep-cache;

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
  --mount=type=cache,target=/var/lib/apt,sharing=locked \
   apt update && apt-get --no-install-recommends install -y libc6;

WORKDIR /app

RUN groupmod --gid $USER_GID $USERNAME \
    && usermod --uid $USER_UID --gid $USER_GID $USERNAME \
    && chown -R $USER_UID:$USER_GID /app;

FROM base as dev
COPY --link package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --ignore-scripts --no-optional
USER $USERNAME
COPY --link . ./
ENTRYPOINT ["pnpm", "run", "dev"]

FROM base as unit
USER root
COPY --link package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install vitest
USER $USERNAME
COPY --link vitest-setup.ts vitest.config.js tsconfig.json ./
COPY --link logger /app/logger
COPY --link src /app/src
ENTRYPOINT ["vitest"]

FROM base AS build_prod
RUN mkdir -p ./dist/cache
COPY --link package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --ignore-scripts --no-optional --prod
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm add sharp
COPY --link . .
RUN --mount=type=cache,id=nextjs,target=./dist/cache pnpm run build

# Production image, copy all the files and run next
FROM base AS prod
ENV NODE_ENV=production

USER $USERNAME
COPY --link --from=build_prod /app/dist/standalone ./
COPY --link --from=build_prod /app/node_modules ./node_modules
COPY --link --from=build_prod /app/dist/static ./dist/static
COPY --link --from=build_prod /app/public ./public
COPY --link --from=build_prod --chown="$USERNAME":"$USERNAME" /app/dist/cache ./dist/cache

EXPOSE 8000
ENTRYPOINT ["node", "server.js"]

FROM base as e2e-browsers
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install @playwright/test playwright @faker-js/faker
RUN playwright install --with-deps

FROM e2e-browsers as e2e
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0

USER $USERNAME
COPY --link src ./src
COPY --link e2e ./e2e
COPY --link playwright.config.ts ./
COPY --link tsconfig.json ./

ENTRYPOINT ["playwright"]
CMD ["test"]
