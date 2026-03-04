# Multi-stage build for Ping-Pong server
FROM golang:1.22-alpine as builder
WORKDIR /app
COPY main.go .
RUN go build -o simple main.go

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/simple /usr/local/bin/simple
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/simple"]
