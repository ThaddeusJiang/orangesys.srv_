FROM mhart/alpine-node:base-6
RUN apk add --no-cache openssl ca-certificates
ADD . /app
WORKDIR /app

EXPOSE 5001
CMD ["node", "target/server.js"]
