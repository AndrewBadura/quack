# Use an official Node.js runtime as a parent image
FROM node:18-alpine as build

# Set the working directory in the container
WORKDIR /app

# Copy package.json to the working directory
COPY package.json ./

# Install any needed packages
RUN npm --version
RUN npm install

# Copy the rest of the application's source code from the host to the image's filesystem
COPY . .

# Build the React application
RUN npm run build

# Use a smaller, more secure base image for the final production image
FROM nginx:alpine

# Copy the built assets from the 'build' stage to the Nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy the custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx when the container launches
CMD ["nginx", "-g", "daemon off;"]