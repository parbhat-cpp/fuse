FROM nginx:stable-alpine

# Remove ALL default configs
RUN rm -rf /etc/nginx/conf.d/*
RUN rm -f /etc/nginx/nginx.conf

# Copy ONLY your config
COPY ./nginx.conf /etc/nginx/nginx.conf

# Create log directory
RUN mkdir -p /var/log/nginx

EXPOSE 80
