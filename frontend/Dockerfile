FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# SEO: the public address and the Google Search Console tag are baked into the build.
ARG VITE_SITE_URL=
ARG VITE_GOOGLE_SITE_VERIFICATION=
ARG VITE_GA_ID=
ENV VITE_SITE_URL=$VITE_SITE_URL VITE_GOOGLE_SITE_VERIFICATION=$VITE_GOOGLE_SITE_VERIFICATION VITE_GA_ID=$VITE_GA_ID
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
