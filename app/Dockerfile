FROM alpine
RUN apk --no-cache add socat
COPY entrypoint.sh /
ENTRYPOINT ["/entrypoint.sh"]
CMD ["tail", "-f", "/dev/null"]