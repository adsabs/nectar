FROM node:20-bookworm-slim AS base
ARG USER_ID=1000
ARG GROUP_ID=1000
ARG USERNAME=node
ENV STANDALONE=1
ENV NEXT_TELEMETRY_DISABLED=1
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PNPM_HOME=/pnpm
ENV SENTRYCLI_SKIP_DOWNLOAD=1
ENV PATH="$PNPM_HOME:/app/.bin:/app/node_modules/.bin:$PATH"
ENV PORT=8000

RUN corepack enable

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
  --mount=type=cache,target=/var/lib/apt,sharing=locked \
   apt update && apt-get --no-install-recommends install -y libc6;

WORKDIR /app

RUN groupmod --gid $USER_ID $USERNAME \
    && usermod --uid $USER_ID --gid $USER_ID $USERNAME \
    && chown -R $USER_ID:$GROUP_ID /app;

FROM base AS prod_deps
COPY --link package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --ignore-scripts --prod
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm add sharp
COPY --link . .

FROM prod_deps AS prod
COPY --from=prod_deps /app/node_modules ./node_modules/
EXPOSE 8000
RUN mkdir -p ./.pnpm-cache
RUN --mount=type=cache,id=nextjs,target=.pnpm-cache pnpm run build
CMD ["pnpm", "start"]
