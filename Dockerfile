FROM node:20-bookworm AS base
ARG USER_UID=1001
ARG USER_GID=1001
ARG USERNAME=nectar
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
ENV COREPACK_ENABLE_STRICT=false

RUN corepack enable
RUN rm -f /etc/apt/apt.conf.d/docker-clean; \
    echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' > /etc/apt/apt.conf.d/keep-cache;

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
  --mount=type=cache,target=/var/lib/apt,sharing=locked \
   apt update && apt-get --no-install-recommends install -y libc6;


RUN groupadd -g $USER_GID $USERNAME || true && \
    useradd -u $USER_UID -g $USER_GID -m -s /bin/bash $USERNAME || true && \
    usermod -u $USER_UID -g $USER_GID $USERNAME || true

WORKDIR /app

RUN chown -R $USER_UID:$USER_GID /app

FROM base as dev
COPY --link package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --ignore-scripts --no-optional
COPY --link . ./

USER $USERNAME
ENTRYPOINT ["pnpm", "run", "dev"]

FROM base as unit
USER root
COPY --link package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install vitest
COPY --link vitest-setup.ts vitest.config.js tsconfig.json ./
COPY --link src /app/src
USER $USERNAME
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

COPY --link --from=build_prod /app/dist/standalone ./
COPY --link --from=build_prod /app/node_modules ./node_modules
COPY --link --from=build_prod /app/dist/static ./dist/static
COPY --link --from=build_prod /app/public ./public
COPY --link --from=build_prod /app/dist/cache ./dist/cache

USER $USERNAME
EXPOSE 8000
ENTRYPOINT ["node", "server.js"]

FROM base as e2e-browsers
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install @playwright/test playwright @faker-js/faker dotenv
RUN playwright install --with-deps

FROM e2e-browsers as e2e
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0

COPY --link src ./src
COPY --link e2e ./e2e
COPY --link playwright.config.ts ./playwright.config.ts
COPY --link tsconfig.json ./tsconfig.json

RUN chown -R $USER_UID:$USER_GID /app;
USER $USERNAME

ENTRYPOINT ["playwright"]
CMD ["test"]
