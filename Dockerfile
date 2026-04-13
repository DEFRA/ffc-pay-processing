ARG PARENT_VERSION=2.3.0-node20.15.0
ARG PORT_DEBUG=9229
ARG PORT=3008

# Development
FROM defradigital/node-development:${PARENT_VERSION} AS development
ARG PARENT_VERSION
LABEL uk.gov.defra.ffc.parent-image=defradigital/node-development:${PARENT_VERSION}

ARG PORT
ARG PORT_DEBUG
ENV PORT ${PORT}
EXPOSE ${PORT} ${PORT_DEBUG}
USER root
RUN apk add --update --no-cache openjdk17-jre

USER node
COPY --chown=node:node package*.json ./
RUN npm install
COPY --chown=node:node . .
CMD [ "npm", "run", "start:watch" ]

# Production
FROM defradigital/node:${PARENT_VERSION} AS production
ARG PARENT_VERSION
LABEL uk.gov.defra.ffc.parent-image=defradigital/node:${PARENT_VERSION}

COPY --from=development /home/node/app/ ./app/
COPY --from=development /home/node/package*.json ./
RUN husky=0 npm ci
CMD [ "node", "app" ]
